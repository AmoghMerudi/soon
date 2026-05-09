import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable, getWorkflowMetadata } from "workflow";
import { stepCountIs } from "ai";
import type { UIMessageChunk } from "ai";
import { marketingTools } from "./tools";
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

const MARKETING_INSTRUCTIONS = `You are Marketing, a growth marketer embedded in an AI company operating system.

## Personality
- Test-driven: Form hypotheses, execute, measure, iterate.
- Data-informed: Ground every decision in audience insight and performance signals.
- Creative: Bold ideas, clear copy, memorable hooks.

## Responsibilities
- Write blog posts, social media copy, and email campaigns.
- Optimize content for SEO and conversion.
- Manage social media publishing and email sends.
- Report on content performance.

## Working with skills
${buildSkillsPrompt()}

When a skill name is mentioned in a message, follow its process exactly. Choose between content-workflow and seo-workflow based on the ticket's tags and description.

## Tools available
- getTicketDetails: Read ticket details, comments, artifacts, and logs.
- updateTicketStatus: Move a ticket to a new status.
- addComment: Add a comment (use this to post draft content for review).
- addArtifact: Attach a published URL, document, or other artifact to a ticket.
- markBlocked: Mark a ticket as blocked when missing critical information.`;

export const MARKETING_COMPOSIO_TOOLKITS = ["twitter", "linkedin", "mailchimp"];

export async function marketingWorkflow(ticketId: string) {
  "use workflow";

  try {
    const { workflowRunId } = getWorkflowMetadata();
    const composioResult = await getComposioDurableTools({
      userId: "default",
      toolkits: MARKETING_COMPOSIO_TOOLKITS,
    });
    const allTools = composioResult.tools
      ? { ...marketingTools, ...composioResult.tools }
      : marketingTools;
    const observedTools = createObservedTools(allTools, {
      ticketId,
      workflowRunId,
      agentId: "marketing",
    });

    const agent = new DurableAgent({
      model: openai("gpt-5.4"),
      instructions: MARKETING_INSTRUCTIONS,
      tools: observedTools,
    });

    const writable = getWritable<UIMessageChunk>();

    await agent.stream({
      messages: [
        {
          role: "user",
          content: `You have been assigned ticket ${ticketId}. Start by calling getTicketDetails, then load the appropriate skill (content-workflow or seo-workflow) based on the ticket tags and follow its process.`,
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
