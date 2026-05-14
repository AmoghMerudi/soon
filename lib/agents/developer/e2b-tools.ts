import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

let _sandboxId: string | null = null;
let _bootstrapped = false;
let _ticketId: string | null = null;
let _acquiringPromise: Promise<any> | null = null;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getSandboxClass() {
  const { Sandbox } = await import("@e2b/code-interpreter");
  return Sandbox;
}

function getSandboxEnvs(): Record<string, string> {
  const envs: Record<string, string> = {
    GIT_AUTHOR_NAME: "agent-bot",
    GIT_AUTHOR_EMAIL: "agent-bot@users.noreply.github.com",
    GIT_COMMITTER_NAME: "agent-bot",
    GIT_COMMITTER_EMAIL: "agent-bot@users.noreply.github.com",
  };
  const pat = process.env.AGENT_GITHUB_PAT;
  if (pat) {
    envs.GH_TOKEN = pat;
  }
  const vercelToken = process.env.VERCEL_TOKEN;
  if (vercelToken) {
    envs.VERCEL_TOKEN = vercelToken;
  }
  return envs;
}

async function bootstrapSandbox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sandbox: any,
) {
  if (_bootstrapped) return;

  const ghVersion = "2.62.0";
  const installGh = [
    "if ! command -v gh >/dev/null 2>&1; then",
    `  curl -fsSL https://github.com/cli/cli/releases/download/v${ghVersion}/gh_${ghVersion}_linux_amd64.tar.gz -o /tmp/gh.tgz`,
    "  tar -xzf /tmp/gh.tgz -C /tmp",
    `  install -m 0755 /tmp/gh_${ghVersion}_linux_amd64/bin/gh /usr/local/bin/gh`,
    `  rm -rf /tmp/gh.tgz /tmp/gh_${ghVersion}_linux_amd64`,
    "fi",
  ].join("\n");

  const installVercel = [
    "if ! command -v vercel >/dev/null 2>&1; then",
    "  npm install -g vercel@latest 2>/dev/null || true",
    "fi",
  ].join("\n");

  const configureGit = [
    "git config --global init.defaultBranch main",
    "git config --global pull.rebase true",
    "git config --global push.default current",
    "git config --global user.name 'agent-bot'",
    "git config --global user.email 'agent-bot@users.noreply.github.com'",
    `git config --global credential.https://github.com.helper '!f() { echo "username=x-access-token"; echo "password=$GH_TOKEN"; }; f'`,
  ].join(" && ");

  await sandbox.commands.run(`${installGh}\n${configureGit}`, {
    timeoutMs: 90_000,
  });

  try {
    await sandbox.commands.run(installVercel, { timeoutMs: 60_000 });
  } catch {
    // Vercel CLI is nice-to-have
  }


  _bootstrapped = true;
}

async function persistSandboxId(sandboxId: string | null) {
  if (!_ticketId) return;
  try {
    await convex.mutation(api.mutations.storeSandboxId, {
      ticketId: _ticketId as Id<"tickets">,
      sandboxId,
    });
  } catch {
    // best-effort — don't fail the step if persistence fails
  }
}

async function loadPersistedSandboxId(): Promise<string | null> {
  if (!_ticketId) return null;
  try {
    const ticket = await convex.query(api.queries.getTicket, {
      ticketId: _ticketId as Id<"tickets">,
    });
    return ticket?.sandboxId ?? null;
  } catch {
    return null;
  }
}

async function quickHealthCheck(sandbox: any): Promise<boolean> {
  try {
    const result = await sandbox.commands.run("echo ok", { timeoutMs: 5_000 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

async function tryConnect(Sandbox: any, sandboxId: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const sandbox = await Sandbox.connect(sandboxId);
      if (await quickHealthCheck(sandbox)) return sandbox;
    } catch {
      // retry
    }
    if (attempt < 2) await new Promise<void>((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return null;
}

async function _doGetOrCreateSandbox() {
  const Sandbox = await getSandboxClass();

  if (_sandboxId) {
    const sandbox = await tryConnect(Sandbox, _sandboxId);
    if (sandbox) return sandbox;
    _sandboxId = null;
    _bootstrapped = false;
  }

  const persistedId = await loadPersistedSandboxId();
  if (persistedId) {
    const sandbox = await tryConnect(Sandbox, persistedId);
    if (sandbox) {
      _sandboxId = persistedId;
      return sandbox;
    }
  }

  const sandbox = await Sandbox.create({
    timeoutMs: 30 * 60_000,
    envs: getSandboxEnvs(),
  });
  _sandboxId = sandbox.sandboxId;
  _bootstrapped = false;
  await bootstrapSandbox(sandbox);

  await persistSandboxId(_sandboxId);

  return sandbox;
}

// Deduplicates concurrent calls so parallel tool invocations share one sandbox.
async function getOrCreateSandbox() {
  if (_acquiringPromise) return _acquiringPromise;

  _acquiringPromise = _doGetOrCreateSandbox();
  try {
    return await _acquiringPromise;
  } finally {
    _acquiringPromise = null;
  }
}

const BLOCKED_SHELL_PATTERNS = [
  /git\s+push\s+(?:origin\s+)?(?:main|master)\b/,
  /git\s+push\s+--force\b(?!-with-lease)/,
  /git\s+push\s+-f\b/,
];

function validateShellCommand(command: string): string | null {
  for (const pattern of BLOCKED_SHELL_PATTERNS) {
    if (pattern.test(command)) {
      return `Blocked: "${command}" — pushing directly to main/master or force-pushing is not allowed. Use a feature branch and open a PR instead.`;
    }
  }
  return null;
}

function isSandboxCrash(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("bus error") ||
    msg.includes("signal: killed") ||
    msg.includes("connection refused") ||
    msg.includes("socket hang up") ||
    msg.includes("sandbox_expired") ||
    msg.includes("sandbox not found")
  );
}

async function resetSandbox() {
  _acquiringPromise = null;
  if (_sandboxId) {
    try {
      const Sandbox = await getSandboxClass();
      const sandbox = await Sandbox.connect(_sandboxId);
      await sandbox.kill();
    } catch {
      // already dead
    }
  }
  _sandboxId = null;
  _bootstrapped = false;
  await persistSandboxId(null);
}

// --- Step functions (each uses "use step" for durability and automatic retries) ---

async function runShellStep(input: {
  command: string;
  cwd?: string;
  timeoutMs?: number;
}) {
  "use step";

  const blocked = validateShellCommand(input.command);
  if (blocked) {
    return { exitCode: 1, stdout: "", stderr: blocked };
  }

  const sandbox = await getOrCreateSandbox();
  try {
    const result = await sandbox.commands.run(input.command, {
      cwd: input.cwd,
      timeoutMs: input.timeoutMs ?? 60_000,
    });

    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (err: any) {
    if (err?.stdout !== undefined || err?.stderr !== undefined) {
      return {
        exitCode: err.exitCode ?? 1,
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? "",
      };
    }

    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("does not exist") && input.cwd) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `Directory ${input.cwd} does not exist — the sandbox was likely replaced. Re-clone the repo with \`gh repo clone\` before retrying this command.`,
      };
    }

    if (isSandboxCrash(err)) {
      await resetSandbox();
      const freshSandbox = await getOrCreateSandbox();
      try {
        const result = await freshSandbox.commands.run(input.command, {
          cwd: input.cwd,
          timeoutMs: input.timeoutMs ?? 60_000,
        });
        return {
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        };
      } catch (retryErr: any) {
        return {
          exitCode: retryErr?.exitCode ?? 1,
          stdout: retryErr?.stdout ?? "",
          stderr: retryErr?.stderr ?? msg,
        };
      }
    }

    return {
      exitCode: 1,
      stdout: "",
      stderr: msg.slice(0, 500),
    };
  }
}

async function runCodeStep(input: {
  code: string;
  language?: "python" | "javascript" | "typescript" | "r" | "java" | "bash";
}) {
  "use step";

  try {
    const sandbox = await getOrCreateSandbox();
    const exec = await sandbox.runCode(input.code, {
      language: input.language ?? "python",
    });

    return {
      stdout: exec.logs.stdout.join(""),
      stderr: exec.logs.stderr.join(""),
      error: exec.error
        ? {
            name: exec.error.name,
            value: exec.error.value,
            traceback: exec.error.traceback,
          }
        : null,
      results: exec.results.map((r: { text?: string }) => ({ text: r.text ?? null })),
    };
  } catch (err) {
    if (isSandboxCrash(err)) {
      await resetSandbox();
      const sandbox = await getOrCreateSandbox();
      const exec = await sandbox.runCode(input.code, {
        language: input.language ?? "python",
      });
      return {
        stdout: exec.logs.stdout.join(""),
        stderr: exec.logs.stderr.join(""),
        error: exec.error
          ? { name: exec.error.name, value: exec.error.value, traceback: exec.error.traceback }
          : null,
        results: exec.results.map((r: { text?: string }) => ({ text: r.text ?? null })),
      };
    }
    throw err;
  }
}

async function readFileStep(input: { path: string }) {
  "use step";

  try {
    const sandbox = await getOrCreateSandbox();
    const content = await sandbox.files.read(input.path);
    return { path: input.path, content };
  } catch (err) {
    if (isSandboxCrash(err)) {
      await resetSandbox();
      const sandbox = await getOrCreateSandbox();
      const content = await sandbox.files.read(input.path);
      return { path: input.path, content };
    }
    throw err;
  }
}

async function writeFileStep(input: { path: string; content: string }) {
  "use step";

  try {
    const sandbox = await getOrCreateSandbox();
    await sandbox.files.write(input.path, input.content);
    return { path: input.path, bytes: input.content.length };
  } catch (err) {
    if (isSandboxCrash(err)) {
      await resetSandbox();
      const sandbox = await getOrCreateSandbox();
      await sandbox.files.write(input.path, input.content);
      return { path: input.path, bytes: input.content.length };
    }
    throw err;
  }
}

// --- Disposal (called from the workflow after the agent finishes) ---

export async function disposeSandbox() {
  "use step";

  // Clear persisted sandbox ID first
  await persistSandboxId(null);

  if (!_sandboxId) {
    // Cold start — try to load and kill the persisted sandbox
    const persistedId = await loadPersistedSandboxId();
    if (persistedId) {
      try {
        const Sandbox = await getSandboxClass();
        const sandbox = await Sandbox.connect(persistedId);
        await sandbox.kill();
      } catch {
        // already dead
      }
    }
    return;
  }

  try {
    const Sandbox = await getSandboxClass();
    const sandbox = await Sandbox.connect(_sandboxId);
    await sandbox.kill();
  } catch {
    // sandbox may have already timed out
  }
  _sandboxId = null;
  _bootstrapped = false;
}

async function getSandboxPreviewStep(input: { port: number }) {
  "use step";

  const sandbox = await getOrCreateSandbox();
  const host: string = await sandbox.getHost(input.port);
  return {
    sandboxId: _sandboxId,
    port: input.port,
    url: `https://${host}`,
  };
}

// --- Factory: bind tools to a ticket so sandbox ID persists across cold starts ---

export function buildE2bTools(ticketId: string) {
  _ticketId = ticketId;

  return {
    runShell: {
      description:
        "Run a shell command inside the isolated sandbox. Use for build/test/lint, package installs, git clone/push, and file system operations. Returns stdout, stderr, and exit code.",
      inputSchema: z.object({
        command: z
          .string()
          .describe("The shell command to run, e.g. 'bun test' or 'git clone ...'"),
        cwd: z
          .string()
          .optional()
          .describe("Working directory inside the sandbox"),
        timeoutMs: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Per-command timeout in ms. Defaults to 60s."),
      }),
      execute: runShellStep,
    },

    runCode: {
      description:
        "Execute a code snippet in the sandbox's interpreter. Use for quick computations, data processing, or generating output.",
      inputSchema: z.object({
        code: z.string().describe("Code to execute"),
        language: z
          .enum(["python", "javascript", "typescript", "r", "java", "bash"])
          .optional()
          .describe("Defaults to python"),
      }),
      execute: runCodeStep,
    },

    readFile: {
      description:
        "Read a file from the sandbox file system. Use to inspect output or verify code.",
      inputSchema: z.object({
        path: z.string().describe("Absolute path inside the sandbox"),
      }),
      execute: readFileStep,
    },

    writeFile: {
      description:
        "Write a file to the sandbox file system. Overwrites if the file exists. Use to scaffold code or test fixtures before running them.",
      inputSchema: z.object({
        path: z.string().describe("Absolute path inside the sandbox"),
        content: z.string().describe("File content"),
      }),
      execute: writeFileStep,
    },

    getSandboxPreview: {
      description:
        "Get a public preview URL for a port listening inside the sandbox (e.g. 3000 for `next dev`). Call this AFTER starting the dev server so the user can see the running app live in their dashboard. Attach the returned URL via addArtifact (type: 'deployment') so the frontend can render it.",
      inputSchema: z.object({
        port: z
          .number()
          .int()
          .positive()
          .describe("Port the dev server is listening on (typically 3000)"),
      }),
      execute: getSandboxPreviewStep,
    },
  };
}

/** @deprecated use buildE2bTools(ticketId) */
export const e2bTools = buildE2bTools("");
