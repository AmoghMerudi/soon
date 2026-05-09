import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any = null;

export function getComposio() {
  if (!instance) {
    instance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY!,
      provider: new VercelProvider(),
    });
  }
  return instance as InstanceType<typeof Composio>;
}

export interface ComposioSessionConfig {
  userId: string;
  toolkits: string[];
}

export async function createComposioSession(config: ComposioSessionConfig) {
  const composio = getComposio();
  return composio.create(config.userId, {
    toolkits: config.toolkits,
    manageConnections: true,
  });
}
