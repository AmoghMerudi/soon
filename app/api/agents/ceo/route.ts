import {
  convertToModelMessages,
  createUIMessageStreamResponse,
} from "ai";
import type { UIMessage } from "ai";
import { start } from "workflow/api";
import { ceoChatWorkflow } from "@/lib/agents/ceo/workflow";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages, projectId }: { messages: UIMessage[]; projectId?: string } =
    await req.json();

  if (!projectId || typeof projectId !== "string") {
    return Response.json({ error: "Missing 'projectId'" }, { status: 400 });
  }

  const modelMessages = await convertToModelMessages(messages);

  const run = await start(ceoChatWorkflow, [projectId, modelMessages]);

  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
}
