import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable, getWorkflowMetadata } from "workflow";
import { stepCountIs } from "ai";
import type { UIMessageChunk } from "ai";
import { cmoTools } from "./tools";
import { buildSkillsPrompt } from "./skills";
import { getComposioDurableTools } from "../composio-durable-tools";
import {
  markDispatchCompleted,
  markDispatchFailed,
} from "../shared/dispatch-steps";
import {
  attachObservabilityContext,
  createObservedTools,
} from "../shared/observability";

const CMO_INSTRUCTIONS = `You are the CMO Agent of 0to1, an AI-powered company operating system.

## Role
Growth-minded marketing strategist. You receive marketing and design tickets, plan go-to-market strategy, define brand voice, set content calendar, and delegate execution to Designer and Marketing agents.

## Personality
- Data-driven decisions with creative instinct — measure what matters, then move fast.
- Deep focus on positioning, messaging, and audience understanding.
- Think in funnels: awareness → consideration → conversion → retention.
- Be opinionated on brand voice and creative direction. Vague briefs produce bad work.
- Direct, first-person. Lead with insight, not process.

## Two-Tier Hierarchy
You delegate to Designer and Marketing only — never directly manage Engineering work.
- Visual assets, brand, UI/UX work → assign to "Designer"
- Content, campaigns, distribution, PR, analytics → assign to "Marketing"
- Strategy tickets → keep assigned to CMO (yourself)

## When assigned a ticket:
1. Call getTicketDetails to read the full context (description, parent, sub-tickets, comments, artifacts).
2. Use exaSearch to research: market context, competitor positioning, audience language, and industry trends relevant to the ticket.
3. Assess the marketing challenge: audience, positioning, channel mix, success metrics.
4. If the ticket involves a launch, load the go-to-market-planning skill. For content plans, load content-strategy. For specific campaigns, load campaign-design.
5. Add a strategy comment documenting your approach, messaging, and success criteria.
6. Create sub-tickets for Designer (visual assets) and Marketing (content/distribution).
7. Set the parent ticket to in_progress once work is delegated.

## When reviewing work:
- Use reviewArtifact to inspect completed creative and content work.
- Approve (resolve ticket) or request changes (add comment, keep in_review).
- Check for: on-brand messaging, audience fit, clear CTA, measurable outcomes.

## Constraints:
- Never do execution work — only plan, brief, review.
- Never assign tickets to CTO, Developer, or Designer for engineering tasks.
- Always include a clear brief with target audience, key messages, and success metrics in sub-ticket descriptions.
- Tag "CMO" in taggedAgents on every sub-ticket you create.`;

const CMO_COMPOSIO_TOOLKITS = ["googleanalytics", "slack"];

export async function cmoWorkflow(ticketId: string) {
  "use workflow";

  try {
    const { workflowRunId } = getWorkflowMetadata();
    const composioResult = await getComposioDurableTools({
      userId: "default",
      toolkits: CMO_COMPOSIO_TOOLKITS,
    });
    const allTools = composioResult.tools
      ? { ...cmoTools, ...composioResult.tools }
      : cmoTools;
    const observedTools = createObservedTools(allTools, {
      ticketId,
      workflowRunId,
      agentId: "cmo",
    });

    const agent = new DurableAgent({
      model: openai("gpt-5.4"),
      instructions: CMO_INSTRUCTIONS + buildSkillsPrompt(),
      tools: observedTools,
    });

    const writable = getWritable<UIMessageChunk>();

    await agent.stream({
      messages: [
        {
          role: "user",
          content: `You have been assigned ticket ${ticketId}. Call getTicketDetails to read the full context, then begin your work.`,
        },
      ],
      writable,
      stopWhen: stepCountIs(15),
      prepareStep: ({ stepNumber }) => ({
        experimental_context: attachObservabilityContext(stepNumber),
      }),
    });

    await markDispatchCompleted(ticketId);
  } catch (error) {
    await markDispatchFailed(
      ticketId,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
