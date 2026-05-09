import { start } from "workflow/api";
import { designerWorkflow } from "@/lib/agents/designer/workflow";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { ticketId }: { ticketId: string } = await req.json();
  const run = await start(designerWorkflow, [ticketId]);
  return Response.json({ runId: run.runId });
}
