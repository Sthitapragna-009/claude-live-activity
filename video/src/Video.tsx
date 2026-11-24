import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import { theme } from "./theme";
import { Stage3D } from "./Stage3D";
import { PhoneScreen } from "./Phone";
import { Spark } from "./Clawd";
import { CAPTIONS, T, VO_START } from "./timeline";

loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadSerif("normal", { weights: ["400", "500"], subsets: ["latin"] });
const SERIF = `"${theme.fonts.display}", Georgia, serif`;
const SANS = `"${theme.fonts.body}", system-ui, sans-serif`;
const C = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Word-by-word rise; exits faster than it enters.
const Words: React.FC<{ text: string; start: number; end: number; size: number; weight: number; color: string; stagger?: number; track?: string; lh?: number; align?: "left" | "center"; font?: string }> = ({ text, start, end, size, weight, color, stagger = 0.06, track = "-0.02em", lh = 1.05, align = "left", font = SERIF }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame / fps, [end - 0.33, end], [1, 0], { ...clamp, easing: theme.ease.in });
  return (
    <div style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, letterSpacing: track, lineHeight: lh, textAlign: align, display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.24 + "px" }}>
      {text.split(" ").map((w, i) => {
        if (w === "|") return <span key={i} style={{ flexBasis: "100%", height: 0 }} />;
        const s = spring({ frame: frame - Math.round((start + i * stagger) * fps), fps, config: theme.spring.smooth });
        return (
          <span key={i} style={{ display: "inline-block", opacity: s * out, filter: `blur(${(1 - s) * 6}px)`, transform: `translateY(${(1 - s) * size * 0.35 + (1 - out) * -size * 0.2}px)` }}>{w}</span>
        );
      })}
    </div>
  );
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < T.phoneIn - 0.1 || t > T.phoneOut + 0.8) return null;
  const enter = spring({ frame: frame - Math.round(T.phoneIn * fps), fps, config: theme.spring.smooth });
  const exit = interpolate(t, [T.phoneOut, T.phoneOut + 0.6], [0, 1], { ...clamp, easing: theme.ease.in });
  const breathe = Math.sin(t * 0.9);
  const rotY = -14 + 8 * enter + breathe * 1.2 + exit * 18;
  const rotX = 6 - 3 * enter + Math.cos(t * 0.7) * 0.8;
  // Camera push-in on the island moments: grow from the island so it lands near frame centre.
  const zoom = T.zooms.reduce((acc, [a, b]) => Math.max(acc,
    interpolate(t, [a, a + 0.6, b - 0.5, b], [0, 1, 1, 0], { ...clamp, easing: theme.ease.inOut })), 0);
  const scale = 1.12 + zoom * 0.5;
  return (
    <div style={{ position: "absolute", left: 1060, top: 40 + zoom * 230, width: 417, height: 876, perspective: 2600,
      transform: `scale(${scale})`, transformOrigin: "50% 3%" }}>
      <div style={{ width: 417, height: 876, opacity: Math.min(1, enter * 1.4) * (1 - exit),
        transform: `translateY(${(1 - enter) * 260 + exit * -40}px) translateX(${exit * 160}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${0.92 + 0.08 * enter})`,
        transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: -36, height: 40, borderRadius: "50%", background: "rgba(20,20,19,.2)", filter: "blur(22px)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 68, background: "linear-gradient(140deg,#5d5e62 0%,#2a2b2e 22%,#1d1e20 60%,#4a4b4f 100%)", padding: 3 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 65, background: "#050505", padding: 9 }}>
            <PhoneScreen />
          </div>
        </div>
        <div style={{ position: "absolute", left: -3, top: 170, width: 4, height: 32, borderRadius: 2, background: "#3b3c40" }} />
        <div style={{ position: "absolute", left: -3, top: 230, width: 4, height: 62, borderRadius: 2, background: "#3b3c40" }} />
        <div style={{ position: "absolute", right: -3, top: 250, width: 4, height: 96, borderRadius: 2, background: "#3b3c40" }} />
      </div>
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = CAPTIONS.find((x) => t >= x.t - 0.05 && t <= x.end);
  if (!c) return null;
  const subIn = spring({ frame: frame - Math.round((c.t + 0.3) * fps), fps, config: theme.spring.smooth });
  const out = interpolate(t, [c.end - 0.3, c.end], [1, 0], { ...clamp, easing: theme.ease.in });
  return (
    <div style={{ position: "absolute", left: 150, top: 380, width: 760 }}>
      <Words text={c.title} start={c.t} end={c.end} size={92} weight={400} color={C.ink} track="-0.025em" lh={1.02} />
      {c.sub && <div style={{ fontFamily: SANS, marginTop: 32, fontSize: 28, lineHeight: 1.4, fontWeight: 400, color: C.inkDim, maxWidth: 560, opacity: subIn * out, transform: `translateY(${(1 - subIn) * 16}px)` }}>{c.sub}</div>}
    </div>
  );
};

const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = spring({ frame: frame - Math.round((T.phoneIn + 0.4) * fps), fps, config: theme.spring.smooth });
  const out = interpolate(t, [T.phoneOut - 0.2, T.phoneOut + 0.2], [1, 0], { ...clamp, easing: theme.ease.in });
  return (
    <div style={{ position: "absolute", left: 150, top: 96, display: "flex", alignItems: "center", gap: 12, fontFamily: SANS, fontSize: 22, fontWeight: 500, color: C.ink, opacity: s * out, transform: `translateY(${(1 - s) * 12}px)` }}>
      <Spark size={24} />Claude · Live Activities
    </div>
  );
};

// Floating z's over the sleeping 3D Clawd while the narrator says "we've waited".
const Zzz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t > T.clawdWakes + 0.3) return null;
  const fade = interpolate(t, [1.2, 1.8, T.clawdWakes - 0.1, T.clawdWakes + 0.2], [0, 1, 1, 0], clamp);
  return (
    <>
      {[0, 1, 2].map((i) => {
        const cyc = ((t - 1.2 + i * 0.9) % 2.7) / 2.7;
        return (
          <div key={i} style={{ position: "absolute", left: 1130 + cyc * 70, top: 300 - cyc * 120, fontFamily: SERIF, fontSize: 40 + i * 6, color: C.ink,
            opacity: fade * Math.sin(Math.max(0, cyc) * Math.PI) * 0.75 }}>z</div>
        );
      })}
    </>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t > T.phoneIn) return null;
  const intro = spring({ frame: frame - Math.round((T.introText2 - 0.05) * fps), fps, config: theme.spring.smooth });
  const introOut = interpolate(t, [T.clawdLeap + 0.1, T.clawdLeap + 0.5], [1, 0], { ...clamp, easing: theme.ease.in });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 660, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 1500, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 30 }}>
          <Words text="We've waited." start={4.55} end={6.6} size={76} weight={400} color={C.ink} align="center" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
          <Words text="From waiting for a response | to watching progress unfold." start={T.introText1} end={T.introText2 - 0.15} size={76} weight={400} color={C.ink} align="center" stagger={0.17} lh={1.12} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 500, color: C.inkDim, opacity: intro * introOut, transform: `translateY(${(1 - intro) * 12}px)` }}>Introducing</div>
          <div style={{ marginTop: 18 }}>
            <Words text="Live Activities for Claude" start={T.introText2 + 0.55} end={T.clawdLeap + 0.5} size={104} weight={400} color={C.ink} align="center" stagger={0.12} track="-0.03em" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < T.outro) return null;
  const sub = spring({ frame: frame - Math.round(T.outroSub * fps), fps, config: theme.spring.smooth });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Words text="Live Activities for Claude" start={T.outro + 0.3} end={999} size={104} weight={400} color={C.ink} align="center" stagger={0.12} track="-0.03em" />
      <div style={{ marginTop: 26, fontFamily: SANS, fontSize: 30, fontWeight: 400, color: C.inkDim, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>Stop waiting. Start watching.</div>
    </div>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.08 }}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const ClaudeLiveActivity: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ground, fontFamily: SANS }}>
      <Sequence from={Math.round(VO_START * fps)}>
        <Audio src={staticFile("voiceover.mp3")} />
      </Sequence>
      <Stage3D />
      <Zzz />
      <Intro />
      <Wordmark />
      <Captions />
      <Phone />
      <Outro />
      {/* grade: warm paper tone */}
      <AbsoluteFill style={{ background: "rgba(204,120,92,.03)", mixBlendMode: "soft-light", pointerEvents: "none" }} />
      <Grain />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 48%, transparent 60%, rgba(20,20,19,.12) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
