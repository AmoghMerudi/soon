import { defineHook } from "workflow";
import { z } from "zod";

export const questionHook = defineHook({
  schema: z.object({
    answer: z.string(),
  }),
});
