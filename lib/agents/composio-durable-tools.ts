import { tool, type ToolSet } from "ai";
import { jsonSchemaToZod } from "@composio/json-schema-to-zod";
import type {
  ComposioSessionConfig,
  ComposioToolSchema,
} from "./composio-client";

async function getComposioToolSchemasStep(config: ComposioSessionConfig) {
  "use step";

  try {
    const { getComposioSessionToolSchemas } = await import("./composio-client");
    const tools = await getComposioSessionToolSchemas(config);
    return { tools, error: null };
  } catch (error) {
    return { tools: null, error: String(error) };
  }
}

async function executeComposioToolStep(input: {
  userId: string;
  toolkits: string[];
  toolSlug: string;
  arguments: Record<string, unknown>;
}) {
  "use step";

  const { executeComposioSessionTool } = await import("./composio-client");
  return executeComposioSessionTool(input);
}

function normalizeToolInput(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return {};
}

function toDurableTool(
  schema: ComposioToolSchema,
  config: ComposioSessionConfig
) {
  return tool({
    description: schema.description ?? schema.name ?? schema.slug,
    inputSchema: jsonSchemaToZod(
      (schema.inputParameters ?? {
        type: "object",
        properties: {},
        additionalProperties: true,
      }) as Record<string, unknown>
    ),
    execute: async (input: unknown) =>
      executeComposioToolStep({
        userId: config.userId,
        toolkits: config.toolkits,
        toolSlug: schema.slug,
        arguments: normalizeToolInput(input),
      }),
  });
}

export async function getComposioDurableTools(config: ComposioSessionConfig): Promise<{
  tools: ToolSet | null;
  error: string | null;
}> {
  const result = await getComposioToolSchemasStep(config);
  if (!result.tools) {
    return { tools: null, error: result.error };
  }

  const tools = Object.fromEntries(
    result.tools.map((tool) => [tool.slug, toDurableTool(tool, config)])
  ) as ToolSet;

  return { tools, error: null };
}
