"use client";

import { createContext, useContext } from "react";
import type { Id } from "@/convex/_generated/dataModel";

const ProjectIdContext = createContext<Id<"projects"> | null>(null);

export function ProjectIdProvider({
  projectId,
  children,
}: {
  projectId: Id<"projects">;
  children: React.ReactNode;
}) {
  return (
    <ProjectIdContext.Provider value={projectId}>
      {children}
    </ProjectIdContext.Provider>
  );
}

export function useProjectId(): Id<"projects"> {
  const id = useContext(ProjectIdContext);
  if (!id) throw new Error("useProjectId must be used inside ProjectIdProvider");
  return id;
}
