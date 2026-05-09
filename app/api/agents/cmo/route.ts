import { start } from "workflow/api";
import { cmoWorkflow } from "@/lib/agents/cmo/workflow";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { ticketId }: { ticketId: string } = await req.json();
  const run = await start(cmoWorkflow, [ticketId]);
  return Response.json({ runId: run.runId });
}
