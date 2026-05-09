import { MemoryClient } from "mem0ai";
import { tool, type ToolSet } from "ai";
import { z } from "zod";

let _client: MemoryClient | null = null;

function getClient(): MemoryClient | null {
  const apiKey = process.env.MEM0_API_KEY;
  if (!apiKey) return null;
  if (!_client) _client = new MemoryClient({ apiKey });
  return _client;
}

export function memoryUserId(projectId: string, agentId: string): string {
  return `${projectId}:${agentId}`;
}

export interface RecalledMemory {
  id: string;
  memory: string;
  score?: number;
}

export async function recallMemories(
  projectId: string,
  agentId: string,
  query: string,
  limit = 5
): Promise<RecalledMemory[]> {
  const client = getClient();
  if (!client || !query.trim()) return [];
  try {
    const res = await client.search(query, {
      filters: { user_id: memoryUserId(projectId, agentId) },
      topK: limit,
    } as Parameters<typeof client.search>[1]);
    return (res.results ?? []).map((m) => ({
      id: m.id ?? "",
      memory: m.memory ?? "",
      score: (m as { score?: number }).score,
    }));
  } catch (err) {
    console.warn("[mem0] recall failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function saveMemory(
  projectId: string,
  agentId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const client = getClient();
  if (!client || !content.trim()) return null;
  try {
    const res = (await client.add(
      [{ role: "user", content }],
      {
        user_id: memoryUserId(projectId, agentId),
        metadata: metadata as Record<string, string> | undefined,
      } as Parameters<typeof client.add>[1]
    )) as unknown;
    // Mem0 v3 returns { status: "PENDING", eventId } for async processing,
    // or an array of Memory objects for synchronous saves.
    if (Array.isArray(res)) return res[0]?.id ?? null;
    if (res && typeof res === "object" && "eventId" in res) {
      return (res as { eventId: string }).eventId;
    }
    return null;
  } catch (err) {
    console.warn(
      "[mem0] save failed:",
      err instanceof Error ? err.message : err,
      err instanceof Error && "cause" in err ? err.cause : undefined
    );
    return null;
  }
}

export function formatRecalledForPrompt(memories: RecalledMemory[]): string {
  if (memories.length === 0) return "";
  const lines = memories.map((m, i) => `${i + 1}. ${m.memory}`).join("\n");
  return `\n\n## Recalled context (from prior runs)\n${lines}`;
}

export function mem0Tools(projectId: string, agentId: string): ToolSet {
  return {
    recall_memory: tool({
      description:
        "Search semantic memory for relevant prior decisions, preferences, or facts learned in earlier runs. Use when you need context the system prompt didn't include.",
      inputSchema: z.object({
        query: z.string().describe("Natural-language query about prior context"),
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ query, limit }) => {
        const memories = await recallMemories(projectId, agentId, query, limit ?? 5);
        return { memories };
      },
    }),
    save_memory: tool({
      description:
        "Persist a fact, decision, or user preference to long-term memory so future runs can recall it. Be concise — one sentence per memory.",
      inputSchema: z.object({
        content: z.string().describe("The fact or preference to remember"),
        category: z
          .enum(["decision", "preference", "context", "knowledge"])
          .optional(),
      }),
      execute: async ({ content, category }) => {
        const id = await saveMemory(projectId, agentId, content, {
          category: category ?? "knowledge",
        });
        return { id, saved: id !== null };
      },
    }),
  };
}
