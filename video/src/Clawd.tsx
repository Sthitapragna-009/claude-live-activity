import React from "react";
import { theme } from "./theme";
import type { Mood } from "./timeline";

// Frame-driven pixel Clawd. `f` is the global frame; no CSS animation (Remotion renders frame by frame).
export const Clawd: React.FC<{ w: number; mood: Mood; run: boolean; f: number; since?: number }> = ({ w, mood, run, f, since = 0 }) => {
  const c = theme.colors.clay;
  const walk = run ? Math.floor(f / 5) % 2 : 0;
  const legA = walk ? -0.8 : 0, legB = walk ? 0 : -0.8;
  let bodyY = 0, eyeX = 0, eyeSY = 1, armL = 0, armR = 0;
  if (mood === "thinking") bodyY = Math.floor(f / 18) % 2 ? -0.6 : 0;
  if (mood === "reading") eyeX = Math.floor(f / 24) % 2 ? 0.6 : -0.6;
  if (mood === "writing") { armL = Math.floor(f / 4) % 2 ? -0.8 : 0; armR = Math.floor(f / 4) % 2 ? 0 : -0.8; }
  if (mood === "testing") bodyY = Math.floor(f / 8) % 2 ? -0.8 : 0;
  if (mood === "waiting") armR = Math.floor(f / 9) % 2 ? -2.6 : -1.8;
  if (mood === "paused") eyeSY = 0.3;
  if (mood === "done" && f - since < 40) bodyY = Math.floor((f - since) / 10) % 2 ? -1.2 : 0;
  const dot = (k: number) => (Math.floor((f + k * 6) / 12) % 3 === 0 ? 1 : 0.3);
  const blink = Math.floor(f / 15) % 2 ? 1 : 0.35;
  return (
    <svg viewBox="-1 -4 16 14" style={{ width: w, display: "block", overflow: "visible" }} shapeRendering="crispEdges">
      <g transform={`translate(0 ${bodyY})`}>
        <rect x={3} y={6.4 + legA} width={1.1} height={2.4} fill={c} />
        <rect x={5} y={6.4 + legB} width={1.1} height={2.4} fill={c} />
        <rect x={7.9} y={6.4 + legA} width={1.1} height={2.4} fill={c} />
        <rect x={9.9} y={6.4 + legB} width={1.1} height={2.4} fill={c} />
        <rect x={0} y={2.8 + armL} width={2.2} height={1.8} fill={c} />
        <rect x={11.8} y={2.8 + armR} width={2.2} height={1.8} fill={c} />
        <rect x={2} y={0} width={10} height={6.6} fill={c} />
        <g transform={`translate(${eyeX} 0)`}>
          <rect x={4} y={1.6 + (1 - eyeSY) * 0.8} width={1.2} height={1.6 * eyeSY} fill="#000" />
          <rect x={8.8} y={1.6 + (1 - eyeSY) * 0.8} width={1.2} height={1.6 * eyeSY} fill="#000" />
        </g>
      </g>
      {mood === "thinking" && [0, 1, 2].map((k) => <rect key={k} x={10 + k * 1.6} y={-2.6 - k * 0.6} width={0.9} height={0.9} fill="#fff" opacity={dot(k)} />)}
      {mood === "waiting" && <g fill={theme.colors.amber}><rect x={13} y={-3.8} width={1} height={2.4} /><rect x={13} y={-0.9} width={1} height={0.9} /></g>}
      {mood === "paused" && <text x={11.5} y={-1} fontSize={3.2} fontWeight={700} fill="#fff" opacity={blink} fontFamily="Inter">z</text>}
      {mood === "done" && <g fill={theme.colors.green} opacity={blink}><rect x={-0.6} y={-2.6} width={1} height={1} /><rect x={13.4} y={-3} width={1} height={1} /><rect x={6.6} y={-3.6} width={0.9} height={0.9} /></g>}
    </svg>
  );
};

export const Spark: React.FC<{ size: number; color?: string }> = ({ size, color = theme.colors.clay }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <g stroke={color} strokeWidth={2.4} strokeLinecap="round">
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={12} y1={12} x2={12} y2={12 - (i % 2 ? 7 : 9)} transform={`rotate(${i * 30} 12 12)`} />)}
    </g>
  </svg>
);

export const Ring: React.FC<{ size: number; p: number; color: string; sw?: number }> = ({ size, p, color, sw = 2.6 }) => {
  const r = 12 - sw / 2 - 0.5;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={12} cy={12} r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={sw} />
      <circle cx={12} cy={12} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - p} />
    </svg>
  );
};
