import { ConvexHttpClient } from "convex/browser";
import type { ToolExecutionOptions, ToolSet } from "ai";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type AgentStepStatus = "running" | "completed" | "failed";

export type AgentObservabilityContext = {
  ticketId: string;
  workflowRunId: string;
  agentId: string;
};

type AgentToolExecutionContext = {
  stepNumber?: number;
};

function toSummary(value: unknown, maxLength = 500) {
  let serialized: string;

  if (typeof value === "string") {
    serialized = value;
  } else {
    try {
      serialized = JSON.stringify(value);
    } catch {
      serialized = String(value);
    }
  }

  const compact = serialized.replace(/\s+/g, " ").trim();
  return compact.length > maxLength
    ? `${compact.slice(0, maxLength - 1)}…`
    : compact;
}

function readToolExecutionContext(
  options?: ToolExecutionOptions
): AgentToolExecutionContext {
  if (
    options?.experimental_context &&
    typeof options.experimental_context === "object" &&
    !Array.isArray(options.experimental_context)
  ) {
    return options.experimental_context as AgentToolExecutionContext;
  }

  return {};
}

export async function writeAgentStep(input: {
  ticketId: string;
  workflowRunId: string;
  agentId: string;
  stepIndex: number;
  toolName: string;
  inputSummary: string;
  outputSummary?: string;
  status: AgentStepStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
}) {
  "use step";

  return await convex.mutation(api.agentSteps.logAgentStep, {
    ticketId: input.ticketId as never,
    workflowRunId: input.workflowRunId,
    agentId: input.agentId,
    stepIndex: input.stepIndex,
    toolName: input.toolName,
    inputSummary: input.inputSummary,
    outputSummary: input.outputSummary,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    error: input.error?.slice(0, 500),
  });
}

export async function updateAgentStep(input: {
  stepId: string;
  outputSummary?: string;
  status: AgentStepStatus;
  completedAt?: number;
  durationMs?: number;
  error?: string;
}) {
  "use step";

  await convex.mutation(api.agentSteps.updateAgentStep, {
    stepId: input.stepId as never,
    outputSummary: input.outputSummary,
    status: input.status,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    error: input.error?.slice(0, 500),
  });
}

export function createObservedTools<TOOLS extends ToolSet>(
  tools: TOOLS,
  context: AgentObservabilityContext
): TOOLS {
  return Object.fromEntries(
    Object.entries(tools).map(([toolName, toolDefinition]) => {
      if (
        !toolDefinition ||
        typeof toolDefinition !== "object" ||
        typeof toolDefinition.execute !== "function"
      ) {
        return [toolName, toolDefinition];
      }

      const execute = toolDefinition.execute as (
        input: unknown,
        options: ToolExecutionOptions
      ) => Promise<unknown> | unknown;

      return [
        toolName,
        {
          ...toolDefinition,
          execute: async (input: unknown, options: ToolExecutionOptions) => {
            const startedAt = Date.now();
            const { stepNumber = 0 } = readToolExecutionContext(options);
            const stepId = await writeAgentStep({
              ticketId: context.ticketId,
              workflowRunId: context.workflowRunId,
              agentId: context.agentId,
              stepIndex: stepNumber,
              toolName,
              inputSummary: toSummary(input),
              status: "running",
              startedAt,
            });

            try {
              const output = await execute(input, options);
              const completedAt = Date.now();
              await updateAgentStep({
                stepId: stepId as string,
                outputSummary: toSummary(output),
                status: "completed",
                completedAt,
                durationMs: completedAt - startedAt,
              });
              return output;
            } catch (error) {
              const completedAt = Date.now();
              await updateAgentStep({
                stepId: stepId as string,
                status: "failed",
                completedAt,
                durationMs: completedAt - startedAt,
                error: error instanceof Error ? error.message : String(error),
              });
              throw error;
            }
          },
        },
      ];
    })
  ) as TOOLS;
}

export function attachObservabilityContext(stepNumber: number) {
  return {
    stepNumber,
  };
}
