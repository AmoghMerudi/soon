import { afterEach, describe, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.*s");

function setup() {
  return convexTest(schema, modules);
}

async function createTicket(t: ReturnType<typeof setup>, assignee: string | null = null) {
  return t.mutation(api.mutations.createTicket, {
    title: "Dispatch test",
    description: "Validate agent dispatch tracking.",
    status: "backlog",
    priority: "medium",
    assignee,
    tags: ["test"],
    createdBy: "user",
    taggedAgents: [],
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete process.env.APP_BASE_URL;
  delete process.env.NEXT_PUBLIC_CONVEX_URL;
});

describe("dispatch system", () => {
  test("storeWorkflowRun records the run and running status", async () => {
    const t = setup();
    const ticketId = await createTicket(t);

    await t.mutation(api.mutations.storeWorkflowRun, {
      ticketId,
      runId: "run_123",
    });

    const ticket = await t.query(api.queries.getTicket, { ticketId });
    expect(ticket?.workflowRunId).toBe("run_123");
    expect(ticket?.dispatchStatus).toBe("running");
    expect(ticket?.dispatchErrorDetail).toBeUndefined();
  });

  test("assigning to CEO leaves the ticket pending and logs chat guidance", async () => {
    const t = setup();
    const ticketId = await createTicket(t);

    await t.mutation(api.mutations.assignTicket, {
      ticketId,
      assignee: "CEO",
    });

    const [ticket, logs] = await Promise.all([
      t.query(api.queries.getTicket, { ticketId }),
      t.query(api.queries.getAgentLogsByTicket, { ticketId }),
    ]);

    expect(ticket?.assignee).toBe("ceo");
    expect(ticket?.dispatchStatus).toBe("pending");
    expect(ticket?.workflowRunId).toBeUndefined();
    expect(
      logs.some(
        (log) =>
          log.action === "dispatch_pending" &&
          log.details.includes("/dashboard/ceo-chat")
      )
    ).toBe(true);
  });

  test("creating an assigned ticket immediately schedules dispatch", async () => {
    vi.useFakeTimers();
    process.env.APP_BASE_URL = "https://app.test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ runId: "run_created" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const t = setup();
    const ticketId = await createTicket(t, "CTO");

    await t.finishAllScheduledFunctions(() => {
      vi.runAllTimers();
    });

    const ticket = await t.query(api.queries.getTicket, { ticketId });
    expect(ticket?.assignee).toBe("cto");
    expect(ticket?.dispatchStatus).toBe("running");
    expect(ticket?.workflowRunId).toBe("run_created");
  });

  test("successful dispatch stores the workflow run ID", async () => {
    vi.useFakeTimers();
    process.env.APP_BASE_URL = "https://app.test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ runId: "run_success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const t = setup();
    const ticketId = await createTicket(t);

    await t.mutation(api.mutations.assignTicket, {
      ticketId,
      assignee: "developer",
    });
    await t.finishAllScheduledFunctions(() => {
      vi.runAllTimers();
    });

    const ticket = await t.query(api.queries.getTicket, { ticketId });
    expect(ticket?.dispatchStatus).toBe("running");
    expect(ticket?.workflowRunId).toBe("run_success");
    expect(ticket?.dispatchErrorDetail).toBeUndefined();
  });

  test("failed dispatch retries four times before marking the ticket failed", async () => {
    vi.useFakeTimers();
    process.env.APP_BASE_URL = "https://app.test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("server blew up", {
        status: 500,
        statusText: "Internal Server Error",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const t = setup();
    const ticketId = await createTicket(t);

    await t.mutation(api.mutations.assignTicket, {
      ticketId,
      assignee: "developer",
    });
    await t.finishAllScheduledFunctions(() => {
      vi.runAllTimers();
    });

    const [ticket, logs] = await Promise.all([
      t.query(api.queries.getTicket, { ticketId }),
      t.query(api.queries.getAgentLogsByTicket, { ticketId }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(ticket?.dispatchStatus).toBe("failed");
    expect(ticket?.dispatchErrorDetail).toContain("500");
    expect(logs.some((log) => log.action === "dispatch_error")).toBe(true);
  });

  test("retryDispatch clears failure state and schedules a fresh dispatch", async () => {
    vi.useFakeTimers();
    process.env.APP_BASE_URL = "https://app.test";
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ runId: "run_retry" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const t = setup();
    const ticketId = await createTicket(t, "developer");
    await t.finishAllScheduledFunctions(() => {
      vi.runAllTimers();
    });

    await t.mutation(api.mutations.storeWorkflowRun, {
      ticketId,
      dispatchStatus: "failed",
      errorDetail: "old failure",
    });

    await t.mutation(api.mutations.retryDispatch, { ticketId });
    await t.finishAllScheduledFunctions(() => {
      vi.runAllTimers();
    });

    const ticket = await t.query(api.queries.getTicket, { ticketId });
    expect(ticket?.dispatchStatus).toBe("running");
    expect(ticket?.workflowRunId).toBe("run_retry");
    expect(ticket?.dispatchErrorDetail).toBeUndefined();
  });

  test("agent step lifecycle updates active and recent step queries", async () => {
    const t = setup();
    const ticketId = await createTicket(t);

    const stepId = await t.mutation(api.agentSteps.logAgentStep, {
      ticketId,
      workflowRunId: "run_steps",
      agentId: "developer",
      stepIndex: 0,
      toolName: "getTicketDetails",
      inputSummary: "{\"ticketId\":\"abc\"}",
      status: "running",
      startedAt: 100,
    });

    const activeBefore = await t.query(api.agentSteps.getActiveAgents, {});
    expect(activeBefore).toHaveLength(1);
    expect(activeBefore[0]?.agentId).toBe("developer");
    expect(activeBefore[0]?.toolName).toBe("getTicketDetails");

    await t.mutation(api.agentSteps.updateAgentStep, {
      stepId,
      outputSummary: "{\"ok\":true}",
      status: "completed",
      completedAt: 112,
      durationMs: 12,
    });

    await t.mutation(api.agentSteps.logAgentStep, {
      ticketId,
      workflowRunId: "run_steps",
      agentId: "developer",
      stepIndex: 1,
      toolName: "addComment",
      inputSummary: "{\"content\":\"done\"}",
      outputSummary: "{\"commentId\":\"123\"}",
      status: "completed",
      startedAt: 140,
      completedAt: 155,
      durationMs: 15,
    });

    const [byRun, byTicket, recentByAgent, activeAfter] = await Promise.all([
      t.query(api.agentSteps.getAgentStepsByRun, { workflowRunId: "run_steps" }),
      t.query(api.agentSteps.getAgentStepsByTicket, { ticketId }),
      t.query(api.agentSteps.getRecentStepsByAgent, {
        agentId: "developer",
        limit: 2,
      }),
      t.query(api.agentSteps.getActiveAgents, {}),
    ]);

    expect(byRun).toHaveLength(2);
    expect(byTicket.map((step) => step.toolName)).toEqual([
      "getTicketDetails",
      "addComment",
    ]);
    expect(recentByAgent.map((step) => step.toolName)).toEqual([
      "addComment",
      "getTicketDetails",
    ]);
    expect(byRun[0]?.status).toBe("completed");
    expect(byRun[0]?.durationMs).toBe(12);
    expect(activeAfter).toHaveLength(0);
  });

  test("dispatch action marks invalid roles as failed", async () => {
    const t = setup();
    const ticketId = await createTicket(t, "ops");

    await t.action(internal.dispatch.dispatchAgent, {
      ticketId,
      agentRole: "ops",
      attempt: 0,
    });

    const ticket = await t.query(api.queries.getTicket, { ticketId });
    expect(ticket?.dispatchStatus).toBe("failed");
    expect(ticket?.dispatchErrorDetail).toContain("No dispatch route wired");
  });

  test("dispatch fails fast when hosted Convex targets localhost", async () => {
    process.env.APP_BASE_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const t = setup();
    const ticketId = await createTicket(t, "cmo");

    await t.action(internal.dispatch.dispatchAgent, {
      ticketId,
      agentRole: "cmo",
      attempt: 3,
    });

    const ticket = await t.query(api.queries.getTicket, { ticketId });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ticket?.dispatchStatus).toBe("failed");
    expect(ticket?.dispatchErrorDetail).toContain("hosted Convex actions cannot dispatch to loopback addresses");
  });
});
