import { start } from "workflow/api";
import { developerTicketWorkflow } from "@/lib/agents/developer/workflow";

export const maxDuration = 300;

export async function POST(request: Request) {
  const { ticketId, projectId, triggerComment } = await request.json();

  if (!ticketId || typeof ticketId !== "string") {
    return Response.json({ error: "Missing 'ticketId' field" }, { status: 400 });
  }

  const run = await start(developerTicketWorkflow, [
    ticketId,
    triggerComment ?? null,
  ]);

  return Response.json({ ok: true, ticketId, runId: run.runId });
}
