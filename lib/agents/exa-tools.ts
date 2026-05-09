import { tool } from "ai";
import { z } from "zod";

const searchInputSchema = z.object({
  query: z.string().describe("Search query — be specific for better results"),
  numResults: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe("Number of results to return (default: 5)"),
});

// DurableAgent "use step" version — for CEO, CMO, CTO, etc.
export async function exaSearchStep(
  input: z.infer<typeof searchInputSchema>
) {
  "use step";
  const { default: Exa } = await import("exa-js");
  const exa = new Exa(process.env.EXA_API_KEY!);
  const response = await exa.searchAndContents(input.query, {
    numResults: input.numResults ?? 5,
    highlights: { numSentences: 3 },
  });
  return response.results.map((r) => ({
    title: r.title ?? "",
    url: r.url,
    snippet: r.highlights?.[0] ?? "",
  }));
}

// DurableAgent tool definition shape (no tool() wrapper)
export const exaSearchDurableTool = {
  description:
    "Search the web for up-to-date information. Use for market research, competitor analysis, industry trends, technical documentation, and any factual lookup. Prefer this over relying on training data for time-sensitive topics.",
  inputSchema: searchInputSchema,
  execute: exaSearchStep,
};

// ai SDK tool() format — for ToolLoopAgent-style agents (Developer, Designer, Marketing)
export const exaSearchTool = tool({
  description:
    "Search the web for up-to-date information. Use for research, documentation lookup, competitor analysis, and finding relevant resources.",
  inputSchema: searchInputSchema,
  execute: async (input) => {
    const { default: Exa } = await import("exa-js");
    const exa = new Exa(process.env.EXA_API_KEY!);
    const response = await exa.searchAndContents(input.query, {
      numResults: input.numResults ?? 5,
      highlights: { numSentences: 3 },
    });
    return response.results.map((r) => ({
      title: r.title ?? "",
      url: r.url,
      snippet: r.highlights?.[0] ?? "",
    }));
  },
});
