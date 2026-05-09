import { start } from "workflow/api";
import { ceoAgentWorkflow } from "@/lib/agents/ceo-workflow";

export async function POST(request: Request) {
  const { idea } = await request.json();

  if (!idea || typeof idea !== "string") {
    return Response.json({ error: "Missing 'idea' field" }, { status: 400 });
  }

  const run = await start(ceoAgentWorkflow, [idea]);

  return Response.json({
    runId: run.runId,
    message: "CEO agent workflow started",
  });
}
