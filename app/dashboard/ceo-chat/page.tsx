"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { WorkflowChatTransport } from "@workflow/ai";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MarkdownMessage } from "@/lib/dashboard/markdown-message";
import { Avatar, Btn, Eyebrow } from "@/lib/dashboard/primitives";

function ChatBubble({
  role,
  text,
  pending,
}: {
  role: "user" | "assistant";
  text: string;
  pending?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          style={{
            maxWidth: "72%",
            background: "#26241F",
            color: "#FAFAF7",
            borderRadius: "16px 16px 6px 16px",
            padding: "10px 14px",
          }}
        >
          <MarkdownMessage text={text} variant="user" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5 items-start">
      <Avatar role="ceo" size={28} />
      <div
        className="flex-1 min-w-0"
        style={{
          paddingTop: 2,
          color: pending ? "#5E5C56" : "#E6E3DA",
          fontStyle: pending ? "italic" : "normal",
        }}
      >
        {pending ? text : <MarkdownMessage text={text} variant="assistant" />}
      </div>
    </div>
  );
}

function ToolCallIndicator({
  toolName,
  input,
  output,
  state,
  errorText,
  done,
}: {
  toolName: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state?: string;
  errorText?: string;
  done?: boolean;
}) {
  const labels: Record<string, string> = {
    createTicket: "Creating ticket",
    assignTicket: "Assigning ticket",
    updateTicketStatus: "Updating status",
    addComment: "Adding comment",
    getTicketsByStatus: "Checking pipeline",
    getTicketsByAssignee: "Checking workload",
    reviewArtifact: "Reviewing work",
    createSubTicket: "Creating sub-task",
    listTickets: "Checking tickets",
    loadSkill: "Activating skill",
    askQuestion: "Waiting for your answer",
  };

  const isDone = done ?? output !== undefined;
  const label = labels[toolName] ?? toolName;

  let detail = "";
  if (toolName === "loadSkill" && input?.name) {
    detail = String(input.name);
  } else if (toolName === "createTicket" && input?.title) {
    detail = String(input.title);
  } else if (toolName === "createSubTicket" && input?.title) {
    detail = String(input.title);
  } else if (toolName === "getTicketsByStatus" && input?.status) {
    detail = String(input.status);
  } else if (toolName === "getTicketsByAssignee" && input?.assignee) {
    detail = String(input.assignee);
  } else if (toolName === "assignTicket" && input?.assignee) {
    detail = `→ ${input.assignee ?? "unassigned"}`;
  } else if (toolName === "updateTicketStatus" && input?.status) {
    detail = `→ ${input.status}`;
  }

  const formatToolValue = (value: unknown) => {
    if (typeof value === "string") return value;
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return String(value);
    }
    if (value == null) return "";
    try {
      return JSON.stringify(
        value,
        (_key, nestedValue) =>
          typeof nestedValue === "bigint"
            ? nestedValue.toString()
            : nestedValue,
        2
      );
    } catch {
      return String(value);
    }
  };

  const renderedInput = input ? formatToolValue(input) : "";
  const renderedOutput =
    state === "output-error"
      ? errorText ?? "Tool execution failed."
      : state === "output-denied"
        ? "Tool execution was denied."
        : output !== undefined
          ? formatToolValue(output)
          : isDone
            ? "No output returned."
            : "Running...";

  const outputLabel =
    state === "output-error"
      ? "Error"
      : state === "output-denied"
        ? "Denied"
        : "Output";

  return (
    <div className="flex gap-2.5 items-start">
      <Avatar role="ceo" size={28} />
      <div className="flex-1 min-w-0" style={{ maxWidth: 620 }}>
        <div
          className="font-mono inline-flex items-center gap-1.5"
          style={{
            fontSize: 11,
            letterSpacing: "0.06em",
            color: isDone ? "#8E8B82" : "#F2C744",
            padding: "4px 10px",
            background: "#1A1815",
            borderRadius: 8,
            border: `1px solid ${isDone ? "#1F1D1A" : "#26241F"}`,
          }}
        >
          {!isDone && (
            <span
              className="pulse rounded-full"
              style={{ width: 5, height: 5, background: "#F2C744" }}
            />
          )}
          {isDone && <span style={{ fontSize: 10 }}>✓</span>}
          <span style={{ textTransform: "uppercase" }}>{label}</span>
          {detail && (
            <span
              style={{
                color: "#5E5C56",
                textTransform: "none",
                fontWeight: 400,
              }}
            >
              {detail}
            </span>
          )}
        </div>
        <details className="mt-2 group">
          <summary
            className="font-mono cursor-pointer list-none inline-flex items-center gap-2 select-none"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "#8E8B82",
            }}
          >
            <span
              style={{
                fontSize: 10,
                transform: "rotate(0deg)",
                transition: "transform 160ms ease",
              }}
              className="group-open:rotate-90"
            >
              ▶
            </span>
            <span style={{ textTransform: "uppercase" }}>View I/O</span>
          </summary>
          <div className="mt-2 grid gap-2">
            {renderedInput && (
              <div
                style={{
                  background: "#12110F",
                  border: "1px solid #26241F",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "#8E8B82",
                    padding: "8px 10px",
                    borderBottom: "1px solid #26241F",
                  }}
                >
                  Input
                </div>
                <pre
                  className="font-mono whitespace-pre-wrap break-words"
                  style={{
                    margin: 0,
                    padding: "10px 12px",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#DCD9CF",
                    overflowX: "auto",
                  }}
                >
                  {renderedInput}
                </pre>
              </div>
            )}
            <div
              style={{
                background: "#12110F",
                border: "1px solid #26241F",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color:
                    state === "output-error"
                      ? "#F0A097"
                      : state === "output-denied"
                        ? "#F2C744"
                        : "#8E8B82",
                  padding: "8px 10px",
                  borderBottom: "1px solid #26241F",
                }}
              >
                {outputLabel}
              </div>
              <pre
                className="font-mono whitespace-pre-wrap break-words"
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color:
                    state === "output-error" ? "#F0A097" : "#DCD9CF",
                  overflowX: "auto",
                }}
              >
                {renderedOutput}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

function QuestionCard({
  toolCallId,
  question,
  options,
  answered,
}: {
  toolCallId: string;
  question: string;
  options: string[];
  answered?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isDone = !!answered || submitting;

  const submit = async (answer: string, index?: number) => {
    if (isDone) return;
    setSelected(index ?? -1);
    setSubmitting(true);
    await fetch("/api/agents/ceo/hooks/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolCallId, answer }),
    });
  };

  if (answered) {
    return (
      <div className="flex gap-2.5 items-start">
        <Avatar role="ceo" size={28} />
        <div
          style={{
            background: "#1A1815",
            border: "1px solid #26241F",
            borderRadius: 12,
            padding: "16px 20px",
            width: "100%",
            maxWidth: 520,
          }}
        >
          <div
            style={{ fontSize: 14, color: "#8E8B82", marginBottom: 8 }}
          >
            {question}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#FAFAF7",
              background: "#26241F",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            {answered}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <Avatar role="ceo" size={28} />
      <div
        style={{
          background: "#1A1815",
          border: "1px solid #26241F",
          borderRadius: 12,
          padding: "16px 20px",
          width: "100%",
          maxWidth: 520,
        }}
      >
        <div
          style={{
            fontSize: 15,
            color: "#FAFAF7",
            fontWeight: 500,
            marginBottom: 12,
          }}
        >
          {question}
        </div>
        <div className="flex flex-col gap-1">
          {options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => submit(opt, i)}
                disabled={isDone}
                className="flex items-center gap-3 cursor-pointer"
                style={{
                  padding: "10px 14px",
                  background: isSelected ? "#26241F" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  color: "#FAFAF7",
                  fontSize: 14,
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 100ms",
                  opacity: isDone && !isSelected ? 0.4 : 1,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: "#26241F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#BFBCB1",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            marginTop: 8,
            borderTop: "1px solid #26241F",
            paddingTop: 8,
          }}
        >
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Something else..."
            disabled={isDone}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customInput.trim()) {
                submit(customInput.trim());
              }
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "transparent",
              border: "1px solid #3D3B36",
              borderRadius: 8,
              color: "#FAFAF7",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            onClick={() => submit("skip")}
            disabled={isDone}
            className="cursor-pointer"
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid #3D3B36",
              borderRadius: 8,
              color: "#8E8B82",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function ThreadItem({
  thread,
  active,
  onClick,
  onDelete,
}: {
  thread: {
    _id: Id<"ceoChatThreads">;
    title: string;
    preview: string;
    updatedAt: number;
  };
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const age = formatAge(thread.updatedAt);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className="w-full text-left flex flex-col gap-1.5 cursor-pointer group"
      style={{
        padding: "14px 16px",
        background: active ? "#221F1B" : "transparent",
        border: "none",
        borderBottom: "1px solid #1F1D1A",
        borderLeft: active ? "3px solid #F2C744" : "3px solid transparent",
        color: "inherit",
        fontFamily: "inherit",
        transition: "background 140ms",
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <div
          className="font-sans font-medium overflow-hidden flex-1"
          style={{
            fontSize: 14,
            lineHeight: 1.35,
            color: "#FAFAF7",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {thread.title}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "#5E5C56", letterSpacing: "0.04em" }}
          >
            {age}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 cursor-pointer"
            style={{
              background: "transparent",
              border: "none",
              color: "#5E5C56",
              fontSize: 14,
              padding: "0 2px",
              transition: "opacity 140ms",
            }}
          >
            ×
          </button>
        </div>
      </div>
      {thread.preview && (
        <div
          className="font-mono overflow-hidden"
          style={{
            fontSize: 12,
            color: "#8E8B82",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {thread.preview}
        </div>
      )}
    </div>
  );
}

function formatAge(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function EmptyChat() {
  return (
    <div
      className="flex-1 flex items-center justify-center flex-col gap-3"
      style={{ padding: 40 }}
    >
      <Avatar role="ceo" size={48} />
      <div
        className="font-sans font-semibold"
        style={{
          fontSize: 24,
          color: "#FAFAF7",
          letterSpacing: "-0.02em",
        }}
      >
        Talk to the CEO.
      </div>
      <div
        className="font-sans text-center"
        style={{
          fontSize: 14,
          color: "#BFBCB1",
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        Describe what you want to build. I&apos;ll research the market, draft a
        plan, and walk you through it. You approve before any agent moves.
      </div>
    </div>
  );
}

function deserializeMessages(
  saved: Array<{ serialized?: string; content?: string; role?: string; _id?: string }>
): UIMessage[] {
  return saved
    .map((m, i) => {
      if (m.serialized) {
        try {
          const { id, role, parts, metadata } = JSON.parse(m.serialized);
          return { id, role, parts, metadata } as UIMessage;
        } catch {
          return null;
        }
      }
      if (m.content) {
        return {
          id: m._id ?? `legacy-${i}`,
          role: (m.role ?? "user") as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        } as UIMessage;
      }
      return null;
    })
    .filter((m): m is UIMessage => m !== null);
}

function ChatArea({
  threadId,
  savedMessages,
}: {
  threadId: Id<"ceoChatThreads"> | null;
  savedMessages: Array<{ serialized?: string; content?: string; role?: string; _id?: string }>;
}) {
  const saveMessage = useMutation(api.ceoChatMutations.saveMessage);
  const updateTitle = useMutation(api.ceoChatMutations.updateThreadTitle);

  const initialMessages = useMemo(
    () => deserializeMessages(savedMessages),
    [savedMessages]
  );

  const runIdRef = useRef<string | null>(null);

  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        api: "/api/agents/ceo",
        onChatSendMessage: (response) => {
          const id = response.headers.get("x-workflow-run-id");
          if (id) runIdRef.current = id;
        },
        onChatEnd: () => {
          runIdRef.current = null;
        },
        prepareReconnectToStreamRequest: ({ api, ...rest }) => {
          const id = runIdRef.current;
          if (!id) throw new Error("No active workflow run ID");
          return {
            ...rest,
            api: `/api/agents/ceo/${encodeURIComponent(id)}/stream`,
          };
        },
      }),
    []
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId ?? undefined,
    transport,
    messages: initialMessages.length > 0 ? initialMessages : undefined,
    onFinish: async ({ message }) => {
      if (!threadId) return;
      await saveMessage({
        threadId,
        messageId: message.id,
        role: message.role,
        serialized: JSON.stringify(message),
      });
    },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isWorking = status === "submitted" || status === "streaming";

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isWorking || !threadId) return;
    setInput("");

    if (!titleSetRef.current.has(threadId) && initialMessages.length === 0) {
      titleSetRef.current.add(threadId);
      const title = text.length > 60 ? text.slice(0, 60) + "..." : text;
      await updateTitle({ threadId, title });
    }

    const userMessage: UIMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: "user",
      parts: [{ type: "text", text }],
    };
    await saveMessage({
      threadId,
      messageId: userMessage.id,
      role: "user",
      serialized: JSON.stringify(userMessage),
    });

    sendMessage({ text });
  }, [
    input,
    isWorking,
    threadId,
    initialMessages.length,
    saveMessage,
    updateTitle,
    sendMessage,
  ]);

  if (!threadId) {
    return <EmptyChat />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3"
        style={{ padding: "22px 28px" }}
      >
        {messages.length === 0 && <EmptyChat />}
        {messages.map((message) => {
          const parts = message.parts ?? [];
          return parts.map((part, idx) => {
            if (part.type === "text" && part.text) {
              return (
                <ChatBubble
                  key={`${message.id}-${idx}`}
                  role={message.role as "user" | "assistant"}
                  text={part.text}
                />
              );
            }
            if (part.type === "data-question") {
              const { question, options } = (part as { type: string; id: string; data: { question: string; options: string[] } }).data;
              const toolCallId = (part as { id: string }).id;
              const toolPart = parts.find(
                (p) =>
                  p.type === "tool-askQuestion" &&
                  "toolCallId" in p &&
                  p.toolCallId === toolCallId
              );
              const answered =
                toolPart &&
                "state" in toolPart &&
                toolPart.state === "output-available" &&
                typeof toolPart.output === "string"
                  ? toolPart.output
                  : undefined;
              return (
                <QuestionCard
                  key={`${message.id}-${idx}`}
                  toolCallId={toolCallId}
                  question={question}
                  options={options}
                  answered={answered}
                />
              );
            }
            if (part.type.startsWith("tool-")) {
              const toolName = part.type.replace("tool-", "");
              if (toolName === "askQuestion") return null;
              const toolInput =
                "input" in part
                  ? (part.input as Record<string, unknown>)
                  : undefined;
              const toolOutput =
                "state" in part && part.state === "output-available"
                  ? part.output
                  : undefined;
              const toolState = "state" in part ? part.state : undefined;
              const toolErrorText =
                "errorText" in part && typeof part.errorText === "string"
                  ? part.errorText
                  : undefined;
              const toolDone =
                "state" in part
                  ? part.state === "output-available" ||
                    part.state === "output-error" ||
                    part.state === "output-denied"
                  : toolOutput !== undefined;
              return (
                <ToolCallIndicator
                  key={`${message.id}-${idx}`}
                  toolName={toolName}
                  input={toolInput}
                  output={toolOutput}
                  state={toolState}
                  errorText={toolErrorText}
                  done={toolDone}
                />
              );
            }
            return null;
          });
        })}
        {status === "submitted" && (
          <ChatBubble role="assistant" text="thinking..." pending />
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid #26241F",
          padding: "14px 28px",
          background: "#0A0A0A",
        }}
      >
        <div className="flex gap-2.5 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              messages.length === 0
                ? "What do you want to build?"
                : "Ask the CEO anything..."
            }
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1"
            style={{
              padding: "10px 14px",
              background: "#1A1815",
              border: "1px solid #3D3B36",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: 14,
              color: "#FAFAF7",
              lineHeight: 1.4,
              resize: "none",
              outline: "none",
              maxHeight: 140,
            }}
          />
          {isWorking ? (
            <Btn kind="ghost" onClick={stop}>
              ■ Stop
            </Btn>
          ) : (
            <Btn kind="ghost" onClick={send} disabled={!input.trim()}>
              ↑ Send
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CeoChatPage() {
  const threads = useQuery(api.ceoChatQueries.listThreads) ?? [];
  const createThread = useMutation(api.ceoChatMutations.createThread);
  const deleteThread = useMutation(api.ceoChatMutations.deleteThread);

  const [activeThreadId, setActiveThreadId] =
    useState<Id<"ceoChatThreads"> | null>(null);

  const activeThread = threads.find((t) => t._id === activeThreadId);
  const rawMessages = useQuery(
    api.ceoChatQueries.getMessages,
    activeThreadId ? { threadId: activeThreadId } : "skip"
  );

  const savedMessages = useMemo(
    () =>
      (rawMessages ?? []).map((m: Record<string, unknown>) => ({
        serialized: m.serialized as string | undefined,
        content: m.content as string | undefined,
        role: m.role as string | undefined,
        _id: String(m._id),
      })),
    [rawMessages]
  );

  const handleNewChat = async () => {
    const id = await createThread({ title: "New conversation" });
    setActiveThreadId(id);
  };

  const handleDelete = async (threadId: Id<"ceoChatThreads">) => {
    await deleteThread({ threadId });
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #26241F",
        }}
      >
        <div className="flex justify-between items-baseline mb-1">
          <div>
            <Eyebrow>Direct line</Eyebrow>
            <h1
              className="font-sans font-semibold"
              style={{
                fontSize: 34,
                letterSpacing: "-0.02em",
                color: "#FAFAF7",
                margin: 0,
              }}
            >
              CEO Chat
            </h1>
          </div>
          <Btn kind="signal" onClick={handleNewChat}>
            + New chat
          </Btn>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className="overflow-y-auto shrink-0 flex flex-col"
          style={{
            width: 340,
            borderRight: "1px solid #26241F",
            background: "#0A0A0A",
          }}
        >
          {threads.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-2 font-mono uppercase"
              style={{
                color: "#5E5C56",
                fontSize: 12,
                letterSpacing: "0.08em",
                padding: 20,
              }}
            >
              <span style={{ fontSize: 28, color: "#3D3B36" }}>✉</span>
              No conversations yet
            </div>
          ) : (
            threads.map((t) => (
              <ThreadItem
                key={t._id}
                thread={t}
                active={t._id === activeThreadId}
                onClick={() => setActiveThreadId(t._id)}
                onDelete={() => handleDelete(t._id)}
              />
            ))
          )}
        </div>

        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: "#0F0E0C" }}
        >
          {activeThreadId ? (
            <div
              style={{
                padding: "14px 28px",
                borderBottom: "1px solid #26241F",
              }}
            >
              <div className="flex items-center gap-2.5">
                <Avatar role="ceo" size={28} />
                <div>
                  <div
                    className="font-sans font-semibold"
                    style={{ fontSize: 15, color: "#FAFAF7" }}
                  >
                    CEO
                  </div>
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: 11,
                      color: "#F2C744",
                      letterSpacing: "0.1em",
                    }}
                  >
                    <span className="pulse">●</span>{" "}
                    {activeThread?.title ?? "New conversation"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {activeThreadId && rawMessages === undefined ? (
            <div
              className="flex-1 flex items-center justify-center"
              style={{ color: "#5E5C56", fontSize: 13 }}
            >
              Loading...
            </div>
          ) : (
            <ChatArea
              key={activeThreadId ?? "empty"}
              threadId={activeThreadId}
              savedMessages={savedMessages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
