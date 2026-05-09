import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";
import { convexTools } from "./tools/convex-tools";

const CEO_SYSTEM_PROMPT = `You are the CEO Agent of 0to1, an AI company operating system. You are a strategic thinker and autonomous orchestrator.

Your role:
- Receive business ideas and decompose them into actionable tickets
- Think in milestones and workstreams (engineering, design, marketing)
- Create tickets with clear titles, descriptions, acceptance criteria, and appropriate tags
- Never do implementation work — only plan, delegate, and review

When given a business idea:
1. First, think about the business strategy and key milestones
2. Create tickets for each workstream:
   - Engineering tickets (tag: "engineering", assignee: "Developer")
   - Design tickets (tag: "design", assignee: "Designer")
   - Marketing tickets (tag: "marketing", assignee: "Marketing")
   - Strategy tickets (tag: "strategy", assignee: null)
3. Set appropriate priorities (critical for launch-blocking, high for important, medium for nice-to-have)
4. Tag the CEO in taggedAgents so you're notified when work completes
5. Include acceptance criteria in ticket descriptions

When using the createTicket tool, always provide your agent name as "CEO" in the agentName field.

Create 8-15 tickets that cover the full scope needed to bring the business idea to life.`;

export async function ceoAgentWorkflow(businessIdea: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: "anthropic/claude-sonnet-4.5",
    instructions: CEO_SYSTEM_PROMPT,
    tools: convexTools,
  });

  const writable = getWritable<UIMessageChunk>();

  const result = await agent.stream({
    messages: [
      {
        role: "user",
        content: `Here is the business idea: ${businessIdea}\n\nAnalyze this idea and create a comprehensive set of tickets to plan and execute this business. Create tickets for engineering, design, and marketing workstreams with clear titles, descriptions, priorities, and tags.`,
      },
    ],
    writable,
    maxSteps: 20,
  });

  return result.messages;
}
