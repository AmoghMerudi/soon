"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { PCFShadowMap } from "three";
import type { Id } from "@/convex/_generated/dataModel";
import type { RoleKey } from "@/lib/dashboard/constants";
import { AgentInfoDrawer } from "@/lib/playground/AgentInfoDrawer";
import { Office } from "./Office";
import { Agents } from "./Agents";
import { Player } from "./Player";
import { TicketBoard } from "./TicketBoard";
import { MessageProjectiles } from "./MessageProjectile";
import { PLAYER_SPAWN, CAMERA_POSITION, CAMERA_ZOOM } from "./layout";
import { useAgentLiveStates, type PlaygroundRole } from "./useAgentState";
import { useTicketMentions } from "./useTicketMentions";

/**
 * Pins the default camera to a fixed isometric view of the office.
 * Re-applies orientation every frame so any external mutation can't drift the view.
 * Must run inside <Canvas>.
 */
/* eslint-disable react-hooks/immutability -- R3F camera rig pattern requires
   mutating the camera retrieved from useThree; this is the documented R3F idiom. */
function CameraRig({
  onDebug,
}: {
  onDebug?: (s: string) => void;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    camera.position.set(...CAMERA_POSITION);
    if ("zoom" in camera) {
      (camera as { zoom: number }).zoom = CAMERA_ZOOM;
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    onDebug?.(
      `vp ${size.width}×${size.height} · cam (${CAMERA_POSITION.join(",")}) zoom ${CAMERA_ZOOM} · type ${camera.type}`,
    );
  }, [camera, size.width, size.height, onDebug]);

  useFrame(() => {
    camera.position.set(...CAMERA_POSITION);
    if ("zoom" in camera && (camera as { zoom: number }).zoom !== CAMERA_ZOOM) {
      (camera as { zoom: number }).zoom = CAMERA_ZOOM;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, 0, 0);
  });

  return null;
}
/* eslint-enable react-hooks/immutability */

export function PlaygroundScene({ projectId }: { projectId: string }) {
  // The route params come through as a plain string; Convex's Id is just a tag.
  const projectConvexId = projectId as unknown as Id<"projects">;

  const states = useAgentLiveStates();
  const mentions = useTicketMentions(projectConvexId);

  const playerPosRef = useRef({ x: PLAYER_SPAWN.x, z: PLAYER_SPAWN.z });
  const [closestRole, setClosestRole] = useState<PlaygroundRole | null>(null);
  const [talkingTo, setTalkingTo] = useState<RoleKey | null>(null);
  const [debug, setDebug] = useState<string>("");

  const handleInteract = useCallback((role: PlaygroundRole) => {
    setTalkingTo((prev) => (prev === role ? null : role));
  }, []);

  // ESC closes the drawer (global listener since the canvas may have focus).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTalkingTo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#0A0A0A",
        overflow: "hidden",
      }}
    >
      <Canvas
        shadows={{ type: PCFShadowMap }}
        orthographic
        camera={{
          position: CAMERA_POSITION,
          zoom: CAMERA_ZOOM,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0A0A0A"]} />

        <CameraRig onDebug={setDebug} />

        {/* Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-near={1}
          shadow-camera-far={80}
        />
        {/* Soft fill from the opposite side */}
        <directionalLight position={[-20, 20, -10]} intensity={0.35} />

        <Office />
        <TicketBoard projectId={projectConvexId} />
        <Agents states={states} highlightedRole={closestRole} />
        <Player
          positionRef={playerPosRef}
          onClosestRoleChange={setClosestRole}
          onInteract={handleInteract}
          paused={!!talkingTo}
        />
        <MessageProjectiles events={mentions} playerPosRef={playerPosRef} />

        <EffectComposer>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* HUD overlay */}
      <Hud talking={!!talkingTo} promptRole={closestRole} />

      {/* Debug strip */}
      <div
        className="font-mono"
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          padding: "4px 8px",
          background: "#0F0E0Caa",
          border: "1px solid #3D3B36",
          borderRadius: 3,
          color: "#8E8B82",
          fontSize: 9,
          letterSpacing: "0.06em",
          pointerEvents: "none",
          maxWidth: 360,
        }}
      >
        {debug || "…"}
      </div>

      {/* Drawer */}
      {talkingTo && talkingTo !== "user" && (
        <AgentInfoDrawer role={talkingTo} onClose={() => setTalkingTo(null)} />
      )}
    </div>
  );
}

function Hud({
  talking,
  promptRole,
}: {
  talking: boolean;
  promptRole: PlaygroundRole | null;
}) {
  return (
    <>
      {/* Top-left badge */}
      <div
        className="font-mono"
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          padding: "6px 10px",
          background: "#0F0E0Caa",
          border: "1px solid #3D3B36",
          borderRadius: 3,
          color: "#D9C4A8",
          fontSize: 10,
          letterSpacing: "0.18em",
          pointerEvents: "none",
        }}
      >
        ◆ STARTUP HQ ◆ LIVE
      </div>

      {/* Bottom HUD */}
      <div
        className="font-mono"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 14,
          display: "flex",
          justifyContent: "center",
          gap: 18,
          fontSize: 10,
          letterSpacing: "0.16em",
          color: "#F4F1E8",
          textShadow: "0 1px 2px rgba(0,0,0,0.9)",
          pointerEvents: "none",
        }}
      >
        <span>WASD / ARROWS · MOVE</span>
        <span style={{ color: promptRole && !talking ? "#F2C744" : "#5E5C56" }}>
          E · {talking ? "CLOSE" : promptRole ? `TALK TO ${promptRole.toUpperCase()}` : "TALK"}
        </span>
        <span>ESC · CLOSE</span>
      </div>
    </>
  );
}
