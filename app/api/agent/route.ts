import { createAgentUIStreamResponse } from "ai";
import { createSkillsAgent } from "@/lib/agent/skills-agent";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const agent = await createSkillsAgent();

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
