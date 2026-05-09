import { start } from "workflow/api";
import { cmoWorkflow } from "@/lib/agents/cmo/workflow";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { ticketId, projectId }: { ticketId: string; projectId?: string } = await req.json();
  const run = await start(cmoWorkflow, [ticketId, projectId]);
  return Response.json({ runId: run.runId });
}
