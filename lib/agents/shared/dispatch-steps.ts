import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function markDispatchCompleted(ticketId: string) {
  "use step";

  await convex.mutation(api.mutations.storeWorkflowRun, {
    ticketId: ticketId as never,
    dispatchStatus: "completed",
  });
}

export async function markDispatchFailed(ticketId: string, error: string) {
  "use step";

  await convex.mutation(api.mutations.storeWorkflowRun, {
    ticketId: ticketId as never,
    dispatchStatus: "failed",
    errorDetail: error.slice(0, 500),
  });
}
