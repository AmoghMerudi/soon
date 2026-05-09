import {
  convertToModelMessages,
  createUIMessageStreamResponse,
} from "ai";
import type { UIMessage } from "ai";
import { start } from "workflow/api";
import { ceoChatWorkflow } from "@/lib/agents/ceo/workflow";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const run = await start(ceoChatWorkflow, [modelMessages]);

  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
}
