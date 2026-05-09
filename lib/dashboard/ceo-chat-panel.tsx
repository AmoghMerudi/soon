"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Avatar, Btn } from "./primitives";

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
            maxWidth: "78%",
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
      <Avatar role="ceo" size={26} />
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
      <Avatar role="ceo" size={26} />
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

export function CEOChatPanel({
  open,
  onClose,
  initialMessage,
}: {
  open: boolean;
  onClose: () => void;
  initialMessage?: string;
}) {
  const { messages, sendMessage, status, stop } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && initialMessage && !sentInitialRef.current && status === "ready") {
      sentInitialRef.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [open, initialMessage, status, sendMessage]);

  if (!open) return null;

  const isWorking = status === "submitted" || status === "streaming";

  const send = () => {
    const text = input.trim();
    if (!text || isWorking) return;
    setInput("");
    sendMessage({ text });
  };

  return (
    <div
      className="absolute top-0 right-0 bottom-0 flex flex-col"
      style={{
        width: 460,
        background: "#0F0E0C",
        borderLeft: "1px solid #26241F",
        boxShadow: "var(--shadow-3)",
        zIndex: 8,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "14px 18px",
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
              <span className="pulse">●</span> Direct line
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="font-mono cursor-pointer"
          style={{
            background: "transparent",
            border: "none",
            color: "#8E8B82",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3"
        style={{ padding: "18px" }}
      >
        {messages.length === 0 && !initialMessage && (
          <div className="text-center" style={{ padding: "40px 0" }}>
            <div
              className="font-sans font-semibold"
              style={{
                fontSize: 22,
                color: "#FAFAF7",
                letterSpacing: "-0.02em",
              }}
            >
              Talk to the CEO.
            </div>
            <div
              className="font-sans"
              style={{
                fontSize: 14,
                color: "#BFBCB1",
                marginTop: 10,
                maxWidth: 360,
                margin: "10px auto 0",
                lineHeight: 1.6,
              }}
            >
              Describe what you want to build. I'll research the market, draft a
              plan, and walk you through it. You approve before any agent moves.
            </div>
          </div>
        )}
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
          padding: "14px 18px",
          background: "#0A0A0A",
        }}
      >
        <div className="flex gap-2 items-end">
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
              padding: "10px 12px",
              background: "#1A1815",
              border: "1px solid #3D3B36",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: 14,
              color: "#FAFAF7",
              lineHeight: 1.4,
              resize: "none",
              outline: "none",
              maxHeight: 120,
            }}
          />
          {isWorking ? (
            <Btn kind="ghost" onClick={stop}>
              ■ Stop
            </Btn>
          ) : (
            <Btn
              kind="ghost"
              onClick={send}
              disabled={!input.trim()}
            >
              ↑ Send
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
