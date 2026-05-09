"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Avatar, Btn, Eyebrow } from "@/lib/dashboard/primitives";

const transport = new DefaultChatTransport({
  api: "/api/agents/ceo-chat",
});

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
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          {text}
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
          fontSize: 14,
          color: pending ? "#5E5C56" : "#E6E3DA",
          lineHeight: 1.6,
          fontStyle: pending ? "italic" : "normal",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ToolCallIndicator({ toolName }: { toolName: string }) {
  const labels: Record<string, string> = {
    createTicket: "Creating ticket",
    updateTicketStatus: "Updating ticket",
    addComment: "Adding comment",
    listTickets: "Checking tickets",
  };
  return (
    <div className="flex gap-2.5 items-center">
      <Avatar role="ceo" size={28} />
      <div
        className="font-mono uppercase inline-flex items-center gap-1.5"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "#F2C744",
          padding: "4px 8px",
          background: "#1A1815",
          borderRadius: 8,
          border: "1px solid #26241F",
        }}
      >
        <span
          className="pulse rounded-full"
          style={{ width: 5, height: 5, background: "#F2C744" }}
        />
        {labels[toolName] ?? toolName}
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
    <button
      onClick={onClick}
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
    </button>
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
        Describe what you want to build. I'll research the market, draft a plan,
        and walk you through it. You approve before any agent moves.
      </div>
    </div>
  );
}

function ChatArea({
  threadId,
  savedMessages,
}: {
  threadId: Id<"ceoChatThreads"> | null;
  savedMessages: Array<{ role: "user" | "assistant"; content: string; _id: string }>;
}) {
  const saveMessage = useMutation(api.ceoChatMutations.saveMessage);
  const updateTitle = useMutation(api.ceoChatMutations.updateThreadTitle);

  const restored = savedMessages.map((m, i) => ({
    id: `saved-${m._id}-${i}`,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
    createdAt: new Date(),
  }));

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId ?? undefined,
    transport,
    messages: restored.length > 0 ? restored : undefined,
    onFinish: async ({ message }) => {
      if (!threadId) return;
      const text = message.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n");
      if (text) {
        await saveMessage({ threadId, role: "assistant", content: text });
      }
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

    if (!titleSetRef.current.has(threadId) && savedMessages.length === 0) {
      titleSetRef.current.add(threadId);
      const title = text.length > 60 ? text.slice(0, 60) + "..." : text;
      await updateTitle({ threadId, title });
    }

    await saveMessage({ threadId, role: "user", content: text });
    sendMessage({ text });
  }, [input, isWorking, threadId, savedMessages.length, saveMessage, updateTitle, sendMessage]);

  if (!threadId) {
    return <EmptyChat />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
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
            if (part.type.startsWith("tool-")) {
              const toolName = part.type.replace("tool-", "");
              return (
                <ToolCallIndicator
                  key={`${message.id}-${idx}`}
                  toolName={toolName}
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

      {/* Input */}
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
  const messages = useQuery(
    api.ceoChatQueries.getMessages,
    activeThreadId ? { threadId: activeThreadId } : "skip"
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
      {/* Header */}
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

      {/* Two-pane */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Thread list */}
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

        {/* Chat area */}
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
          <ChatArea
            key={activeThreadId ?? "empty"}
            threadId={activeThreadId}
            savedMessages={(messages ?? []).map((m) => ({
              _id: m._id,
              role: m.role,
              content: m.content,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
