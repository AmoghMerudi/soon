// Keep Composio imports behind runtime boundaries so workflow bundle init
// does not evaluate CommonJS-only dependencies inside the workflow VM.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let composioInstance: any = null;

async function getComposio() {
  if (!composioInstance) {
    const { Composio } = await import("@composio/core");
    composioInstance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY!,
    });
  }
  return composioInstance;
}

/**
 * Create a Composio Tool Router session and return MCP connection details.
 * Per Composio's AI SDK guide, the recommended pattern is to scope the session
 * to the `composio` meta-toolkit and let the LLM use the MCP-exposed
 * search/multi-execute tools to discover and run any underlying integration.
 *
 * https://composio.dev/toolkits/composio/framework/ai-sdk
 */
export async function getComposioMcpConnection(userId: string): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  const composio = await getComposio();
  const session = await composio.create(userId, {
    toolkits: ["composio"],
  });
  return {
    url: session.mcp.url,
    headers: session.mcp.headers,
  };
}
