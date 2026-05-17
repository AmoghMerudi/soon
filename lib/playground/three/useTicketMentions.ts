"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PlaygroundRole } from "./useAgentState";

export type MentionEvent = {
  id: string;
  /** Who sent the message — an agent role, or "founder" for the player. */
  from: PlaygroundRole | "founder";
  /** Who was @-mentioned (rendered as one projectile per recipient). */
  to: PlaygroundRole;
  /** Used so old projectiles can be cleaned up. */
  spawnedAt: number;
};

const VALID_ROLES = new Set<string>([
  "ceo",
  "cto",
  "cmo",
  "developer",
  "designer",
  "marketing",
]);

function normalizeFrom(author: string): PlaygroundRole | "founder" {
  const a = author.toLowerCase();
  if (VALID_ROLES.has(a)) return a as PlaygroundRole;
  return "founder";
}

/**
 * Watches for new @mention comments in this project and returns a transient
 * list of MentionEvents to animate. Each event auto-expires after `lifetimeMs`.
 *
 * Implementation is pure-render: events are derived from the Convex query
 * result, with a ticking `now` state to drive expiration.
 */
export function useTicketMentions(
  projectId: Id<"projects"> | null,
  lifetimeMs = 2200,
): MentionEvent[] {
  // Lazy initial state — function form only runs once.
  const [mountTs] = useState(() => Date.now());
  const [now, setNow] = useState(mountTs);

  // Tick a "now" clock so the memo below re-derives and old events fall off.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(id);
  }, []);

  const recent = useQuery(
    api.queries.getRecentMentionsByProject,
    projectId ? { projectId, sinceTs: mountTs - 500, limit: 40 } : "skip",
  );

  return useMemo(() => {
    if (!recent) return [];
    const events: MentionEvent[] = [];
    for (const c of recent) {
      // Ignore historic mentions that already happened before this component mounted.
      if (c.createdAt < mountTs) continue;
      if (now - c.createdAt > lifetimeMs) continue;
      const from = normalizeFrom(c.author);
      for (const m of c.mentions) {
        const mRole = m.toLowerCase();
        if (!VALID_ROLES.has(mRole) || mRole === from) continue;
        events.push({
          id: `${c._id}-${mRole}`,
          from,
          to: mRole as PlaygroundRole,
          spawnedAt: c.createdAt,
        });
      }
    }
    return events;
  }, [recent, now, mountTs, lifetimeMs]);
}
