import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { Clawd, Ring, Spark } from "./Clawd";
import { DURATION_S, Pres, STEP_NAMES, T, TOUCHES, laOpenAt, presAt, viewAt } from "./timeline";

const within = (t: number, [a, b]: [number, number]) => t > a && t < b;

const C = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const DIMS: Record<Pres, [number, number, number]> = {
  base: [126, 37, 18.5], compact: [222, 37, 18.5], minimal: [150, 37, 18.5], limited: [166, 37, 18.5], expanded: [371, 156, 44],
};

const Btn: React.FC<{ label: string; bg: string; color: string }> = ({ label, bg, color }) => (
  <div style={{ flex: 1, height: 36, borderRadius: 18, background: bg, color, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 600 }}>{label}</div>
);
const PauseGlyph = ({ s = 14, c = "#fff" }) => (
  <svg width={s} height={s * 1.14} viewBox="0 0 14 16"><rect x={1} y={1} width={4} height={14} rx={1.2} fill={c} /><rect x={9} y={1} width={4} height={14} rx={1.2} fill={c} /></svg>
);
const PlayGlyph = ({ s = 14, c = "#fff" }) => (
  <svg width={s} height={s * 1.14} viewBox="0 0 14 16"><path d="M2 1.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L3.5.74A1 1 0 0 0 2 1.6z" fill={c} /></svg>
);
const Check = ({ c = "#04150a" }) => (
  <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const Track: React.FC<{ p: number; accent: string; f: number; mood: any; run: boolean; walker: number; ticks?: boolean }> = ({ p, accent, f, mood, run, walker, ticks }) => (
  <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,.16)" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: accent, transformOrigin: "left", transform: `scaleX(${p / 100})` }} />
    {ticks && [12, 30, 68, 95].map((x) => <span key={x} style={{ position: "absolute", top: 1, left: `${x}%`, width: 4, height: 4, marginLeft: -2, borderRadius: 2, background: "rgba(0,0,0,.45)" }} />)}
    <span style={{ position: "absolute", right: -3, top: -3, width: 12, height: 12, borderRadius: 6, border: "2px solid rgba(255,255,255,.5)", background: "#000" }} />
    <div style={{ position: "absolute", left: `${p}%`, bottom: 2, transform: "translateX(-50%)" }}><Clawd w={walker} mood={mood} run={run} f={f} /></div>
  </div>
);

export const PhoneScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const v = viewAt(t);
  const run = v.st === "running";
  const doneSince = Math.round(T.done * fps);

  // ── Island morph: spring from the previous shape to the current one
  const pr = presAt(t);
  const k = spring({ frame: frame - Math.round(pr.since * fps), fps, config: theme.spring.island });
  const a = DIMS[pr.prev], b = DIMS[pr.value];
  const [W, H, R] = [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * k);
  const layerIn = (p: Pres) => (pr.value === p ? interpolate(frame - Math.round(pr.since * fps), [4, 10], [0, 1], { ...clamp, easing: theme.ease.out }) : 0);

  // ── Lock card. One activity, one place: while the island is expanded, the card steps aside.
  const exNow = pr.value === "expanded" ? k : pr.prev === "expanded" ? 1 - k : 0;
  const cardIn = spring({ frame: frame - Math.round(T.cardIn * fps), fps, config: theme.spring.smooth }) * (1 - exNow);
  const open = laOpenAt(t);
  const inputRow = v.st === "input" ? 52 : 0;
  const cardH = 150 + inputRow + 280 * open;
  const cardY = 262 + (1 - cardIn) * 40;
  const cardS = 0.96 + 0.04 * cardIn;

  // ── Detached minimal bubble
  const det = pr.value === "minimal" ? spring({ frame: frame - Math.round((pr.since + 0.15) * fps), fps, config: theme.spring.island }) : 0;

  // iOS blurs and dims everything behind an expanded Live Activity.
  const focus = Math.max(exNow, open);
  const bgBlur = { filter: `blur(${focus * 18}px)`, transform: `scale(${1 + focus * 0.03})` };
  const wall = interpolate(frame, [0, DURATION_S * fps], [1.0, 1.08], { ...clamp, easing: theme.ease.inOut });

  return (
    <div style={{ position: "relative", width: 393, height: 852, borderRadius: 56, overflow: "hidden", fontFamily: theme.fonts.body, color: "#fff" }}>
      <Img src={staticFile("wallpaper.webp")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: bgBlur.filter, transform: `scale(${wall + focus * 0.04}) translateY(${(wall - 1) * -60}px)` }} />
      {/* status bar */}
      <div style={{ position: "absolute", top: 18, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 28px 0 40px", fontSize: 15, fontWeight: 600 }}>
        <span>9:41</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width={18} height={12} viewBox="0 0 18 12"><g fill="#fff"><rect x={0} y={8} width={3} height={4} rx={1} /><rect x={5} y={5.5} width={3} height={6.5} rx={1} /><rect x={10} y={3} width={3} height={9} rx={1} /><rect x={15} y={0} width={3} height={12} rx={1} /></g></svg>
          <svg width={27} height={13} viewBox="0 0 27 13"><rect x={0.5} y={0.5} width={23} height={12} rx={3.5} stroke="rgba(255,255,255,.5)" fill="none" /><rect x={2} y={2} width={17} height={9} rx={2} fill="#fff" /></svg>
        </span>
      </div>
      {/* clock, set like the calendar reference: big, left, tight */}
      <div style={{ position: "absolute", top: 92, left: 30, right: 30, ...bgBlur, opacity: 1 - focus * 0.4 }}>
        <div style={{ fontSize: 19, fontWeight: 600, opacity: 0.85 }}>Tuesday, 24 November</div>
        <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 0.95, marginTop: 2 }}>9:41</div>
      </div>

      {/* dim behind the focused activity */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.38)", opacity: focus }} />

      {/* ── Lock Screen Live Activity ── */}
      <div style={{ position: "absolute", left: 11, right: 11, top: 262, height: cardH, borderRadius: 26, background: C.cardBg, backdropFilter: "blur(24px)", overflow: "hidden",
        opacity: cardIn, transform: `translateY(${(1 - cardIn) * 40}px) scale(${cardS})` }}>
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 22, fontSize: 13, fontWeight: 600, color: C.islandText2 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Spark size={16} />Claude Code · Refactor auth middleware</span>
            <span style={{ color: v.accent }}>{v.elapsed}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, height: 50 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.2 }}>{v.verb}</div>
              <div style={{ fontSize: 15, color: C.islandText2, marginTop: 2 }}>{v.detail}</div>
            </div>
            {(v.st === "running" || v.st === "paused") && (
              <div style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}>{v.st === "running" ? <PauseGlyph /> : <PlayGlyph />}</div>
            )}
          </div>
          <div style={{ margin: "20px 6px 0 4px" }}><Track p={v.p} accent={v.accent} f={frame} mood={v.mood} run={run} walker={30} ticks /></div>
          {v.st === "input" && <div style={{ display: "flex", gap: 8, marginTop: 16 }}><Btn label="Deny" bg="rgba(255,255,255,.14)" color="#fff" /><Btn label="Allow" bg={C.amber} color="#1a0f0b" /></div>}
          <div style={{ width: 36, height: 5, borderRadius: 3, background: "rgba(255,255,255,.32)", margin: "18px auto 0" }} />
        </div>
        {/* pulled-down details */}
        <div style={{ padding: "4px 14px 14px", opacity: interpolate(open, [0.25, 0.9], [0, 1], clamp), transform: `translateY(${(1 - open) * -16}px)` }}>
          <div style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,.1)" }}>
            {STEP_NAMES.map((name, i) => {
              const done = i < v.i, now = i === v.i;
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, height: 36, fontSize: 15, color: now ? "#fff" : done ? "rgba(235,235,245,.8)" : C.islandText2, fontWeight: now ? 600 : 400 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 10, display: "grid", placeItems: "center", border: `1.5px solid ${done ? C.green : now ? v.accent : "rgba(255,255,255,.28)"}`, background: done ? C.green : "transparent" }}>
                    {done ? <Check /> : now ? <span style={{ width: 8, height: 8, borderRadius: 4, background: v.accent }} /> : null}
                  </span>
                  <span>{name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: "rgba(235,235,245,.45)" }}>{now ? (v.st === "paused" ? "Paused" : v.detail) : ""}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
            {[
              [v.st === "paused" ? "Resume" : "Pause", v.st === "paused" ? <PlayGlyph /> : <PauseGlyph />, "#fff"],
              ["Output", <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M4 5h16v14H4z" /><path d="M8 10l3 2-3 2M13 15h3" /></svg>, "#fff"],
              ["Open", <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>, "#fff"],
              ["Cancel", <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>, C.red],
            ].map(([label, icon, color], i) => {
              const pressed = within(t, T.pausePress) || within(t, T.resumePress);
              return (
                <div key={i} style={{ height: 64, borderRadius: 16, background: i === 0 && pressed ? "rgba(255,255,255,.24)" : "rgba(255,255,255,.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 600, color: color as string, transform: i === 0 && pressed ? "scale(.95)" : "none" }}>
                  {icon as React.ReactNode}{label as string}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* quick actions + home indicator */}
      {[46, 297].map((x, i) => (
        <div key={i} style={{ position: "absolute", bottom: 44, left: x, width: 50, height: 50, borderRadius: 25, background: "rgba(0,0,0,.3)", display: "grid", placeItems: "center", ...bgBlur, opacity: 1 - focus * 0.5 }}>
          {i ? <svg width={26} height={20} viewBox="0 0 26 20"><path d="M3 4h4l2-3h8l2 3h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#fff" /><circle cx={13} cy={11.5} r={4.5} fill="#333" /></svg>
            : <svg width={16} height={26} viewBox="0 0 16 26"><path d="M3 1h10v4l-2 4v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9L3 5z" fill="#fff" /></svg>}
        </div>
      ))}
      <div style={{ position: "absolute", bottom: 8, left: 126, width: 140, height: 5, borderRadius: 3, background: "#fff" }} />

      {/* ── Dynamic Island ── */}
      <div style={{ position: "absolute", top: 11, left: 196.5 - W / 2, width: W, height: H, borderRadius: R, background: C.island, overflow: "hidden", boxShadow: `0 0 0 0.5px ${v.accent}55` }}>
        {/* compact */}
        <div style={{ position: "absolute", inset: 0, opacity: layerIn("compact") }}>
          <div style={{ position: "absolute", left: 12, top: 7 }}><Clawd w={26} mood={v.mood} run={run} f={frame} since={doneSince} /></div>
          <div style={{ position: "absolute", right: 9, top: 7.5 }}>
            {v.st === "running" && <Ring size={22} p={v.p} color={v.accent} />}
            {v.st !== "running" && (
              <div style={{ width: 22, height: 22, borderRadius: 11, display: "grid", placeItems: "center", background: v.st === "paused" ? "rgba(255,255,255,.22)" : v.accent, color: "#000", fontSize: 14, fontWeight: 800 }}>
                {v.st === "input" ? "!" : v.st === "done" ? <Check /> : <PauseGlyph s={8} />}
              </div>
            )}
          </div>
        </div>
        {/* expanded */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 371, height: 156, padding: "12px 20px 16px", opacity: layerIn("expanded"), boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 28 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: C.islandText2 }}><Clawd w={28} mood={v.mood} run={run} f={frame} since={doneSince} />Claude Code</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: v.accent }}>{v.elapsed}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, height: 43 }}>
            <div><div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2 }}>{v.verb}</div><div style={{ fontSize: 14, color: C.islandText2 }}>{v.detail}</div></div>
            {v.st === "running" && <div style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><PauseGlyph /></div>}
            {v.st === "done" && <div style={{ height: 36, padding: "0 18px", borderRadius: 18, background: C.green, color: "#04150a", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 600 }}>View</div>}
          </div>
          {v.st === "input" ? (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn label="Deny" bg="rgba(255,255,255,.14)" color="#fff" />
              <div style={{ flex: 1, transform: within(t, T.allowPress) ? "scale(.95)" : "none" }}><Btn label="Allow" bg={C.amber} color="#1a0f0b" /></div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22 }}>
              <div style={{ flex: 1 }}><Track p={v.p} accent={v.accent} f={frame} mood={v.mood} run={run} walker={22} /></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.islandText2, width: 36, textAlign: "right" }}>{Math.round(v.p)}%</span>
            </div>
          )}
        </div>
        {/* minimal: another app's activity holds the island */}
        <div style={{ position: "absolute", left: 9, top: 9.5, opacity: layerIn("minimal") }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth={2.4} strokeLinecap="round"><circle cx={12} cy={13} r={8} /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
        </div>
        {/* limited width */}
        <div style={{ position: "absolute", left: 6, top: 4.5, width: 28, height: 28, opacity: layerIn("limited") }}>
          <div style={{ position: "absolute", inset: 0 }}><Ring size={28} p={v.p} color={v.accent} sw={2.4} /></div>
          <div style={{ position: "absolute", left: 6, top: 7 }}><Clawd w={16} mood={v.mood} run={run} f={frame} /></div>
        </div>
      </div>
      {/* detached minimal bubble */}
      <div style={{ position: "absolute", top: 11, left: 196.5 + 75 + 6, width: 37, height: 37, borderRadius: 19, background: "#000", opacity: det, transform: `scale(${0.5 + 0.5 * det})` }}>
        <div style={{ position: "absolute", left: 3.5, top: 3.5 }}><Ring size={30} p={v.p} color={v.accent} sw={2.4} /></div>
        <div style={{ position: "absolute", left: 10, top: 12 }}><Clawd w={17} mood={v.mood} run={run} f={frame} /></div>
      </div>

      <Touches />
    </div>
  );
};

// Fingertip indicator: appears, presses (scale down + filled), optional drag, optional hold ring.
const Touches: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ev = TOUCHES.find((e) => t >= e.appear && t <= e.gone);
  if (!ev) return null;
  const vis = interpolate(t, [ev.appear, ev.appear + 0.2, ev.gone - 0.12, ev.gone], [0, 1, 1, 0], clamp);
  const pressed = t >= ev.press && t <= ev.release;
  const pk = interpolate(t, [ev.press, ev.press + 0.1], [0, 1], { ...clamp, easing: theme.ease.out }) * (t <= ev.release ? 1 : interpolate(t, [ev.release, ev.release + 0.12], [1, 0], clamp));
  let [x, y] = ev.from;
  if (ev.to && ev.move) {
    const m = interpolate(t, ev.move, [0, 1], { ...clamp, easing: theme.ease.inOut });
    x += (ev.to[0] - x) * m; y += (ev.to[1] - y) * m;
  }
  const hold = ev.hold ? interpolate(t, ev.hold, [0, 1], clamp) : 0;
  return (
    <div style={{ position: "absolute", left: x - 28, top: y - 28, width: 56, height: 56, opacity: vis, transform: `scale(${(0.7 + 0.3 * vis) * (1 - 0.12 * pk)})`, zIndex: 50 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: `rgba(255,255,255,${0.28 + 0.3 * pk})`, border: "2px solid rgba(255,255,255,.85)", boxShadow: "0 6px 18px rgba(0,0,0,.25)" }} />
      {ev.hold && pressed && (
        <svg width={72} height={72} viewBox="0 0 72 72" style={{ position: "absolute", left: -8, top: -8, transform: "rotate(-90deg)" }}>
          <circle cx={36} cy={36} r={33} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - hold * 100} />
        </svg>
      )}
    </div>
  );
};
