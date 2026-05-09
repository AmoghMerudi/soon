import { Sandbox } from "@e2b/code-interpreter";
import { z } from "zod";

let _sandboxId: string | null = null;

async function getOrCreateSandbox(): Promise<Sandbox> {
  if (_sandboxId) {
    try {
      return await Sandbox.connect(_sandboxId);
    } catch {
      _sandboxId = null;
    }
  }
  const sandbox = await Sandbox.create({ timeoutMs: 10 * 60_000 });
  _sandboxId = sandbox.sandboxId;
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
    const sandbox = await Sandbox.connect(_sandboxId);
    await sandbox.kill();
  } catch {
    // sandbox may have already timed out
  }
  _sandboxId = null;
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
};
