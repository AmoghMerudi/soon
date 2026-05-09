import { internalMutation } from "../_generated/server";

const SCOPED_TABLES = [
  "tickets",
  "comments",
  "artifacts",
  "agentLogs",
  "agentMemory",
  "ceoChatThreads",
  "ceoChatMessages",
] as const;

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    let defaultProject = await ctx.db.query("projects").first();
    if (!defaultProject) {
      const id = await ctx.db.insert("projects", {
        name: "Default Project",
        description: "Auto-created during project-scoping migration.",
        createdAt: Date.now(),
      });
      defaultProject = await ctx.db.get(id);
    }
    if (!defaultProject) throw new Error("failed to create default project");
    const projectId = defaultProject._id;

    const counts: Record<string, number> = {};
    for (const table of SCOPED_TABLES) {
      let n = 0;
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        if ((row as { projectId?: unknown }).projectId) continue;
        await ctx.db.patch(row._id, { projectId });
        n++;
      }
      counts[table] = n;
    }

    return { defaultProjectId: projectId, backfilled: counts };
  },
});
