import { start } from "workflow/api";
import { ctoWorkflow } from "@/lib/agents/cto/workflow";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { ticketId }: { ticketId: string } = await req.json();
  const run = await start(ctoWorkflow, [ticketId]);
  return Response.json({ runId: run.runId });
}
