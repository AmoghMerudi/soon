import type { ToolSet } from "ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _composio: any = null;

export async function getComposio() {
  if (!_composio) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set");
    const { Composio } = await import("@composio/core");
    _composio = new Composio({ apiKey });
  }
  return _composio;
}

/**
 * Toolkits we route through Composio. GitHub is intentionally excluded — the
 * developer agent talks to GitHub via the `gh`/`git` CLI inside its E2B
 * sandbox using a bot-account PAT (AGENT_GITHUB_PAT), not via Composio.
 * Convex is also excluded — we use the Convex client directly.
 */
const COMPOSIO_TOOLKITS = new Set(["vercel"]);

/**
 * Fetch all Composio-backed tools for an agent based on its `enabledTools`.
 * Silently skips toolkits with no active connection so missing OAuth on one
 * toolkit doesn't break the others.
 */
export async function getComposioToolsForAgent(
  agentEntityId: string,
  enabledTools: string[]
): Promise<ToolSet> {
  const toolkits = enabledTools.filter((t) => COMPOSIO_TOOLKITS.has(t));
  if (toolkits.length === 0) return {} as ToolSet;

  const composio = await getComposio();
  const merged: ToolSet = {} as ToolSet;

  await Promise.all(
    toolkits.map(async (toolkit) => {
      try {
        const tools = await composio.tools.get(agentEntityId, {
          toolkits: [toolkit],
          limit: 30,
        });
        Object.assign(merged, tools);
      } catch (err) {
        console.warn(
          `[composio] could not load ${toolkit} for ${agentEntityId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }),
  );

  return merged;
}

export async function authorizeAgentToolkit(
  agentEntityId: string,
  toolkitSlug: string
) {
  const composio = await getComposio();
  return composio.toolkits.authorize(agentEntityId, toolkitSlug);
}
