import { tool } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

/**
 * Creates a fresh set of E2B sandbox tools bound to a single sandbox lifecycle.
 *
 * The sandbox boots lazily on first use and is torn down via `dispose()` when
 * the agent run finishes. All tool calls within one agent invocation share the
 * same sandbox so file system / installed deps persist across steps.
 */
export function createE2BTools() {
  let sandboxPromise: Promise<Sandbox> | null = null;

  function getSandbox(): Promise<Sandbox> {
    if (!sandboxPromise) {
      sandboxPromise = Sandbox.create({ timeoutMs: 5 * 60_000 });
    }
    return sandboxPromise;
  }

  const tools = {
    runShell: tool({
      description:
        "Run a shell command inside the agent's isolated sandbox. Use for build/test/lint, package installs, git operations, and any command that would touch the file system. Returns stdout, stderr, and exit code.",
      inputSchema: z.object({
        command: z.string().describe("The shell command to run, e.g. 'bun test' or 'ls -la'"),
        cwd: z.string().optional().describe("Working directory inside the sandbox. Defaults to the sandbox home."),
        timeoutMs: z.number().int().positive().optional().describe("Per-command timeout. Defaults to 60s."),
      }),
      execute: async ({ command, cwd, timeoutMs }) => {
        const sandbox = await getSandbox();
        const result = await sandbox.commands.run(command, {
          cwd,
          timeoutMs: timeoutMs ?? 60_000,
        });
        return {
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        };
      },
    }),

    runCode: tool({
      description:
        "Execute a code snippet (Python by default, or specify language) in the sandbox's interpreter. Use for quick computations, data processing, or generating output. Returns stdout, stderr, results, and any errors.",
      inputSchema: z.object({
        code: z.string(),
        language: z
          .enum(["python", "javascript", "typescript", "r", "java", "bash"])
          .optional()
          .describe("Defaults to python."),
      }),
      execute: async ({ code, language }) => {
        const sandbox = await getSandbox();
        const exec = await sandbox.runCode(code, {
          language: (language ?? "python") as "python" | "javascript" | "typescript" | "r" | "java" | "bash",
        });
        return {
          stdout: exec.logs.stdout.join(""),
          stderr: exec.logs.stderr.join(""),
          error: exec.error
            ? { name: exec.error.name, value: exec.error.value, traceback: exec.error.traceback }
            : null,
          results: exec.results.map((r) => ({ text: r.text ?? null })),
        };
      },
    }),

    readFile: tool({
      description:
        "Read a file from the sandbox file system. Use to inspect output of a previous tool call or look at code you've written.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path }) => {
        const sandbox = await getSandbox();
        const content = await sandbox.files.read(path);
        return { path, content };
      },
    }),

    writeFile: tool({
      description:
        "Write a file to the sandbox file system. Overwrites if the file exists. Use this to scaffold code or test fixtures before running them.",
      inputSchema: z.object({
        path: z.string(),
        content: z.string(),
      }),
      execute: async ({ path, content }) => {
        const sandbox = await getSandbox();
        await sandbox.files.write(path, content);
        return { path, bytes: content.length };
      },
    }),
  };

  async function dispose() {
    if (!sandboxPromise) return;
    try {
      const s = await sandboxPromise;
      await s.kill();
    } catch {
      // sandbox may have already timed out — ignore
    }
  }

  return { tools, dispose };
}
