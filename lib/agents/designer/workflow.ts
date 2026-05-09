import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";
import { designerTools } from "./tools";
import { createComposioSession } from "../composio-client";
import { buildSkillsPrompt } from "./skills";

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

async function getComposioTools() {
  try {
    const session = await createComposioSession({
      userId: "default",
      toolkits: DESIGNER_COMPOSIO_TOOLKITS,
    });
    const tools = await session.tools();
    return { tools, error: null };
  } catch (e) {
    return { tools: null, error: String(e) };
  }
}

export async function designerWorkflow(ticketId: string) {
  "use workflow";

  const composioResult = await getComposioTools();
  const allTools = composioResult.tools
    ? { ...designerTools, ...composioResult.tools }
    : designerTools;

  const agent = new DurableAgent({
    model: openai("gpt-5.4"),
    instructions: DESIGNER_INSTRUCTIONS,
    tools: allTools,
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
    maxSteps: 20,
  });
}
