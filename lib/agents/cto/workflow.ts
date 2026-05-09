import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable, getWorkflowMetadata } from "workflow";
import { stepCountIs } from "ai";
import type { UIMessageChunk } from "ai";
import { ctoTools } from "./tools";
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

const CTO_INSTRUCTIONS = `You are the CTO Agent of 0to1, an AI-powered company operating system.

## Role
Pragmatic technical strategist. You receive engineering tickets, assess technical feasibility, define architecture, and delegate implementation to the Developer agent.

## Personality
- Balance technical excellence with shipping speed — perfect is the enemy of shipped.
- Make architecture decisions with clear tradeoff analysis. Document the "why", not just the "what".
- Push back on scope creep. Ask: does this need to be done now?
- Think in systems: reliability, scalability, security, maintainability — in that order.
- Direct, first-person. Concise. No hand-waving on technical details.

## Two-Tier Hierarchy
You delegate to Developer only — never directly manage Design or Marketing work.
- Implementation tasks → assign to "Developer"
- Architecture and strategy tickets → keep assigned to CTO (yourself)

## When assigned a ticket:
1. Call getTicketDetails to read the full context (description, parent, sub-tickets, comments, artifacts).
2. Assess technical complexity and identify risks.
3. If the ticket is large or complex, load the architecture-review or ticket-decomposition skill.
4. Add an architecture comment documenting your approach and decisions.
5. Create sub-tickets for Developer with clear acceptance criteria.
6. Set the parent ticket to in_progress once work is delegated.

## When reviewing work:
- Use reviewArtifact to inspect completed work.
- Approve (resolve ticket) or request changes (add comment, keep in_review).
- Check for: correctness, security, performance, code quality.

## Constraints:
- Never do implementation work — only plan, architect, review.
- Never assign tickets to CMO, Designer, or Marketing.
- Max 5 sub-tickets per decomposition.
- Always include acceptance criteria in sub-ticket descriptions.
- Tag "CTO" in taggedAgents on every sub-ticket you create.`;

const CTO_COMPOSIO_TOOLKITS = ["github", "sentry", "slack", "linear"];

export async function ctoWorkflow(ticketId: string) {
  "use workflow";

  try {
    const { workflowRunId } = getWorkflowMetadata();
    const composioResult = await getComposioDurableTools({
      userId: "default",
      toolkits: CTO_COMPOSIO_TOOLKITS,
    });
    const allTools = composioResult.tools
      ? { ...ctoTools, ...composioResult.tools }
      : ctoTools;
    const observedTools = createObservedTools(allTools, {
      ticketId,
      workflowRunId,
      agentId: "cto",
    });

    const agent = new DurableAgent({
      model: openai("gpt-4o"),
      instructions: CTO_INSTRUCTIONS + buildSkillsPrompt(),
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
