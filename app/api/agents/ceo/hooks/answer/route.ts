import { questionHook } from "@/lib/agents/ceo/hooks";

export async function POST(request: Request) {
  const { toolCallId, answer } = await request.json();
  await questionHook.resume(toolCallId, { answer });
  return Response.json({ success: true });
}
