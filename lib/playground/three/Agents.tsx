"use client";

import { DESKS } from "./layout";
import { AgentDesk } from "./AgentDesk";
import type { AgentLiveState, PlaygroundRole } from "./useAgentState";

export function Agents({
  states,
  highlightedRole,
}: {
  states: Record<PlaygroundRole, AgentLiveState> | null;
  highlightedRole: PlaygroundRole | null;
}) {
  return (
    <group>
      {(Object.keys(DESKS) as PlaygroundRole[]).map((role) => (
        <AgentDesk
          key={role}
          role={role}
          anchor={DESKS[role]}
          live={states?.[role] ?? null}
          highlighted={highlightedRole === role}
        />
      ))}
    </group>
  );
}
