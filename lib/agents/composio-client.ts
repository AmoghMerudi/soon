// Keep Composio imports behind runtime boundaries so workflow bundle init
// does not evaluate CommonJS-only dependencies inside the workflow VM.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any = null;

async function loadComposioSdk() {
  const [{ Composio }, { VercelProvider }] = await Promise.all([
    import("@composio/core"),
    import("@composio/vercel"),
  ]);
  return { Composio, VercelProvider };
}

export async function getComposio() {
  if (!instance) {
    const { Composio, VercelProvider } = await loadComposioSdk();
    instance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY!,
      provider: new VercelProvider(),
    });
  }
  return instance;
}

export interface ComposioSessionConfig {
  userId: string;
  toolkits: string[];
}

export interface ComposioToolSchema {
  slug: string;
  name?: string;
  description?: string;
  inputParameters?: Record<string, unknown>;
}

export async function createComposioSession(config: ComposioSessionConfig) {
  const composio = await getComposio();
  return composio.create(config.userId, {
    toolkits: config.toolkits,
    manageConnections: true,
  });
}

export async function getComposioSessionToolSchemas(
  config: ComposioSessionConfig
): Promise<ComposioToolSchema[]> {
  const composio = await getComposio();
  const session = await createComposioSession(config);
  const tools = await composio.tools.getRawToolRouterSessionTools(
    session.sessionId
  );

  return tools.map((tool: {
    slug: string;
    name?: string;
    description?: string;
    inputParameters?: unknown;
  }) => ({
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    inputParameters:
      tool.inputParameters &&
      typeof tool.inputParameters === "object" &&
      !Array.isArray(tool.inputParameters)
        ? (tool.inputParameters as Record<string, unknown>)
        : undefined,
  }));
}

export async function executeComposioSessionTool(input: {
  userId: string;
  toolkits: string[];
  toolSlug: string;
  arguments: Record<string, unknown>;
}) {
  const session = await createComposioSession({
    userId: input.userId,
    toolkits: input.toolkits,
  });

  return session.execute(input.toolSlug, input.arguments);
}
