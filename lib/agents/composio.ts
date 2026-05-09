import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import type { ToolSet } from "ai";

let _composio: Composio<VercelProvider> | null = null;

export function getComposio(): Composio<VercelProvider> {
  if (!_composio) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set");
    _composio = new Composio({ apiKey, provider: new VercelProvider() });
  }
  return _composio;
}

export async function getGithubToolsForAgent(agentEntityId: string): Promise<ToolSet> {
  const composio = getComposio();
  const tools = await composio.tools.get(agentEntityId, {
    toolkits: ["github"],
    limit: 30,
  });
  return tools as ToolSet;
}

/**
 * Returns the OAuth URL the user must visit to connect this agent's Composio entity
 * to a toolkit (e.g. github). The promise also resolves once the connection is active —
 * but for the onboarding script we just print the URL and let the user open it.
 */
export async function authorizeAgentToolkit(
  agentEntityId: string,
  toolkitSlug: string,
) {
  const composio = getComposio();
  return composio.toolkits.authorize(agentEntityId, toolkitSlug);
}
