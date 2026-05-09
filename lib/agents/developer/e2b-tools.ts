import { z } from "zod";

let _sandboxId: string | null = null;
let _bootstrapped = false;

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
    // gh CLI auto-detects GH_TOKEN; git uses it via the credential helper we configure on bootstrap.
    envs.GH_TOKEN = pat;
  }
  return envs;
}

async function bootstrapSandbox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sandbox: any,
) {
  if (_bootstrapped) return;

  // Install gh CLI if not present. The default E2B code-interpreter template is plain Ubuntu
  // and does not ship with gh. Pulling the static binary is faster and more reliable than apt.
  const ghVersion = "2.62.0";
  const installGh = [
    "if ! command -v gh >/dev/null 2>&1; then",
    `  curl -fsSL https://github.com/cli/cli/releases/download/v${ghVersion}/gh_${ghVersion}_linux_amd64.tar.gz -o /tmp/gh.tgz`,
    "  tar -xzf /tmp/gh.tgz -C /tmp",
    `  install -m 0755 /tmp/gh_${ghVersion}_linux_amd64/bin/gh /usr/local/bin/gh`,
    `  rm -rf /tmp/gh.tgz /tmp/gh_${ghVersion}_linux_amd64`,
    "fi",
  ].join("\n");

  // Configure git identity + credential helper that pulls from GH_TOKEN.
  // The credential helper writes the token only to the in-sandbox process — never to disk.
  const configureGit = [
    "git config --global init.defaultBranch main",
    "git config --global pull.rebase true",
    "git config --global push.default current",
    "git config --global user.name 'agent-bot'",
    "git config --global user.email 'agent-bot@users.noreply.github.com'",
    // Credential helper: when git asks for a password on github.com, return the GH_TOKEN env var.
    `git config --global credential.https://github.com.helper '!f() { echo "username=x-access-token"; echo "password=$GH_TOKEN"; }; f'`,
  ].join(" && ");

  await sandbox.commands.run(`${installGh}\n${configureGit}`, {
    timeoutMs: 90_000,
  });
  _bootstrapped = true;
}

async function getOrCreateSandbox() {
  const Sandbox = await getSandboxClass();

  if (_sandboxId) {
    try {
      const sandbox = await Sandbox.connect(_sandboxId);
      await bootstrapSandbox(sandbox);
      return sandbox;
    } catch {
      _sandboxId = null;
      _bootstrapped = false;
    }
  }
  const sandbox = await Sandbox.create({
    timeoutMs: 10 * 60_000,
    envs: getSandboxEnvs(),
  });
  _sandboxId = sandbox.sandboxId;
  _bootstrapped = false;
  await bootstrapSandbox(sandbox);
  return sandbox;
}

// --- Step functions (each uses "use step" for durability and automatic retries) ---

async function runShellStep(input: {
  command: string;
  cwd?: string;
  timeoutMs?: number;
}) {
  "use step";

  const sandbox = await getOrCreateSandbox();
  const result = await sandbox.commands.run(input.command, {
    cwd: input.cwd,
    timeoutMs: input.timeoutMs ?? 60_000,
  });

  return {
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function runCodeStep(input: {
  code: string;
  language?: "python" | "javascript" | "typescript" | "r" | "java" | "bash";
}) {
  "use step";

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
    results: exec.results.map((r) => ({ text: r.text ?? null })),
  };
}

async function readFileStep(input: { path: string }) {
  "use step";

  const sandbox = await getOrCreateSandbox();
  const content = await sandbox.files.read(input.path);
  return { path: input.path, content };
}

async function writeFileStep(input: { path: string; content: string }) {
  "use step";

  const sandbox = await getOrCreateSandbox();
  await sandbox.files.write(input.path, input.content);
  return { path: input.path, bytes: input.content.length };
}

// --- Disposal (called from the workflow after the agent finishes) ---

export async function disposeSandbox() {
  "use step";

  if (!_sandboxId) return;
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
  // E2B exposes any listening port via getHost(); the URL is publicly reachable from the browser.
  const host: string = await sandbox.getHost(input.port);
  return {
    sandboxId: _sandboxId,
    port: input.port,
    url: `https://${host}`,
  };
}

// --- Tool definitions for DurableAgent ---

export const e2bTools = {
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
