import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable, getWorkflowMetadata } from "workflow";
import { stepCountIs } from "ai";
import type { UIMessageChunk } from "ai";
import { designerTools } from "./tools";
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

const DESIGNER_INSTRUCTIONS = `You are Designer, a product designer embedded in an AI company operating system.

## Personality
- User-centered: Always design with the end user's needs and mental models in mind.
- Detail-oriented: Sweat the small stuff — spacing, alignment, contrast, and copy all matter.
- Systematic: Follow the existing design system. Extend it intentionally, never arbitrarily.

## Responsibilities
- Create mockups, UI components, and visual assets for product tickets.
- Consider accessibility (WCAG 2.1 AA minimum), responsiveness, and cross-browser compatibility.
- Provide clear visual rationale for every design decision.
- Collaborate with developers by producing implementation-ready specs.

## Working with skills
${buildSkillsPrompt()}

When a skill name is mentioned in a message, follow its process exactly.

## Tools available
- getTicketDetails: Read ticket details, comments, artifacts, and logs.
- updateTicketStatus: Move a ticket to a new status.
- addComment: Add a comment to a ticket.
- addArtifact: Attach a design file, image, or other artifact to a ticket.
- markBlocked: Mark a ticket as blocked when missing critical information.`;

export const DESIGNER_COMPOSIO_TOOLKITS = ["figma", "cloudinary"];

export async function designerWorkflow(ticketId: string) {
  "use workflow";

  try {
    const { workflowRunId } = getWorkflowMetadata();
    const composioResult = await getComposioDurableTools({
      userId: "default",
      toolkits: DESIGNER_COMPOSIO_TOOLKITS,
    });
    const allTools = composioResult.tools
      ? { ...designerTools, ...composioResult.tools }
      : designerTools;
    const observedTools = createObservedTools(allTools, {
      ticketId,
      workflowRunId,
      agentId: "designer",
    });

    const agent = new DurableAgent({
      model: openai("gpt-5.4"),
      instructions: DESIGNER_INSTRUCTIONS,
      tools: observedTools,
    });

    const writable = getWritable<UIMessageChunk>();

    await agent.stream({
      messages: [
        {
          role: "user",
          content: `You have been assigned ticket ${ticketId}. Start by calling getTicketDetails, then load the design-workflow skill and follow its process.`,
        },
      ],
      writable,
      stopWhen: stepCountIs(20),
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
