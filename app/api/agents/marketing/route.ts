import { start } from "workflow/api";
import { marketingWorkflow } from "@/lib/agents/marketing/workflow";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { ticketId }: { ticketId: string } = await req.json();
  const run = await start(marketingWorkflow, [ticketId]);
  return Response.json({ runId: run.runId });
}
