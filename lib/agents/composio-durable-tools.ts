import type { ToolSet } from "ai";

/**
 * Fetch Composio's Tool Router tools via MCP for use in a workflow agent.
 * Per Composio's AI SDK guide, the recommended pattern is to scope the
 * session to the `composio` meta-toolkit and let the LLM use the exposed
 * search / multi-execute / manage-connections tools to discover and run
 * any underlying integration.
 *
 * https://composio.dev/toolkits/composio/framework/ai-sdk
 *
 * Note: the `toolkits` parameter is retained for call-site compatibility
 * but is no longer used — the meta-toolkit covers every integration.
 *
 * The caller is responsible for invoking `close()` once the agent stream
 * has finished (typically in a `try/finally`).
 */
export async function getComposioDurableTools(config: {
  userId: string;
  toolkits?: string[];
}): Promise<{
  tools: ToolSet | null;
  close: () => Promise<void>;
  error: string | null;
}> {
  try {
    // Hide `@ai-sdk/mcp` from the workflow bundler's static analysis so it
    // isn't traced into the steps bundle. Its transitive `pkce-challenge`
    // dep doesn't expose a matching export condition for the workflow
    // bundler, but at runtime Node resolves it fine.
    const mcpSpec = ["@ai-sdk", "mcp"].join("/");
    const importDynamic = (s: string): Promise<unknown> =>
      (Function("s", "return import(s)") as (s: string) => Promise<unknown>)(s);
    const [{ getComposioMcpConnection }, mcpModule] = await Promise.all([
      import("./composio-client"),
      importDynamic(mcpSpec) as Promise<typeof import("@ai-sdk/mcp")>,
    ]);
    const { createMCPClient } = mcpModule as typeof import("@ai-sdk/mcp");
    const { url, headers } = await getComposioMcpConnection(config.userId);
    const mcpClient = await createMCPClient({
      transport: { type: "http", url, headers },
    });
    const tools = (await mcpClient.tools()) as ToolSet;
    return {
      tools,
      close: () => mcpClient.close(),
      error: null,
    };
  } catch (error) {
    return {
      tools: null,
      close: async () => {},
      error: String(error),
    };
  }
}
