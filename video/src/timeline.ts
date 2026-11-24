// Every time here is in seconds of video. Components convert with frame / fps.
// Scene times are locked to the voiceover (public/voiceover.mp3, which starts at VO_START).
import { interpolate } from "remotion";
import { theme } from "./theme";

export const DURATION_S = 66;
export const VO_START = 0.4;

export type Pres = "base" | "compact" | "expanded" | "minimal" | "limited";
export type TaskState = "running" | "paused" | "input" | "done";
export type Mood = "thinking" | "reading" | "writing" | "testing" | "waiting" | "paused" | "done";

// Scene markers (video seconds), from the pauses in the narration
export const T = {
  introText1: 8.2,    // "From waiting for a response… to watching progress unfold."
  introText2: 12.45,  // "Introducing Live Activities… for Claude."
  clawdWakes: 6.8,    // "Today… that changes."
  clawdLeap: 14.9,
  phoneIn: 15.5,
  compact: 16.2,
  cardIn: 17.2,
  phoneOut: 59.0,
  outro: 59.3,
  outroSub: 61.6,     // "Stop waiting. Start watching."
  done: 55.4,
  pausePress: [36.68, 36.8] as [number, number],
  resumePress: [37.45, 37.6] as [number, number],
  allowPress: [47.3, 47.45] as [number, number],
  zooms: [[26.6, 32.6], [43.5, 48.0], [55.3, 57.6]] as [number, number][],
};

// Task progress is data, so it moves at a constant rate between keys (Clawd walks evenly).
const PROGRESS: [number, number][] = [
  [0, 0], [16.2, 4], [26.4, 22], [33.2, 45], [36.7, 58], [37.5, 58], [43.6, 68], [47.6, 68], [54.8, 95], [55.4, 100],
];
export const progressAt = (t: number) =>
  interpolate(t, PROGRESS.map((k) => k[0]), PROGRESS.map((k) => k[1]), {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

const step = <T,>(keys: [number, T][], t: number): { value: T; since: number; prev: T } => {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (t >= keys[k][0]) i = k;
  return { value: keys[i][1], since: keys[i][0], prev: keys[Math.max(0, i - 1)][1] };
};

export const PRES_KEYS: [number, Pres][] = [
  [0, "base"], [16.2, "compact"], [27.9, "expanded"], [32.5, "compact"], [43.6, "expanded"],
  [47.9, "compact"], [52.1, "minimal"], [53.2, "limited"], [54.4, "compact"], [55.4, "expanded"], [57.4, "base"],
];
export const presAt = (t: number) => step(PRES_KEYS, t);

const STATE_KEYS: [number, TaskState][] = [
  [0, "running"], [36.75, "paused"], [37.55, "running"], [43.6, "input"], [47.5, "running"], [55.4, "done"],
];
export const stateAt = (t: number) => step(STATE_KEYS, t);

const STEPS = [
  { verb: "Planning", until: 12, mood: "thinking" as Mood, d: () => "Mapping the repo" },
  { verb: "Reading files", until: 30, mood: "reading" as Mood, d: (s: number) => `${Math.max(1, Math.round(s * 14))} of 14 files` },
  { verb: "Writing code", until: 68, mood: "writing" as Mood, d: (s: number) => ["middleware.ts", "session.ts", "tokens.ts", "guards.ts"][Math.min(3, Math.floor(s * 4))] },
  { verb: "Running tests", until: 95, mood: "testing" as Mood, d: (s: number) => `${Math.round(s * 48)} of 48 passing` },
  { verb: "Wrapping up", until: 100, mood: "thinking" as Mood, d: () => "Summarizing changes" },
];
export const STEP_NAMES = STEPS.map((s) => s.verb);

export const viewAt = (t: number) => {
  const p = progressAt(t);
  const st = stateAt(t).value;
  let i = STEPS.findIndex((s) => p < s.until);
  if (i < 0) i = STEPS.length - 1;
  const s = STEPS[i];
  const from = i ? STEPS[i - 1].until : 0;
  const sub = Math.min(1, (p - from) / (s.until - from));
  let verb = s.verb, detail = s.d(sub), mood: Mood = s.mood;
  if (st === "paused") { verb = "Paused"; detail = `During ${s.verb.toLowerCase()}`; mood = "paused"; }
  if (st === "input") { verb = "Run npm test?"; detail = "Claude needs your OK"; mood = "waiting"; }
  if (st === "done") { verb = "Ready for review"; detail = "6 files changed · 48/48 tests pass"; mood = "done"; }
  const elapsed = Math.max(0, t - T.compact) * 4.2;
  const m = Math.floor(elapsed / 60), sec = Math.floor(elapsed % 60);
  const accent = { running: theme.colors.clay, paused: theme.colors.paused, input: theme.colors.amber, done: theme.colors.green }[st];
  return { p, st, i, verb, detail, mood, accent, elapsed: `${m}:${String(sec).padStart(2, "0")}` };
};

const ease = (t: number, a: number, b: number, from: number, to: number) =>
  interpolate(t, [a, b], [from, to], { easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Lock Screen card: 0 = collapsed, 1 = pulled fully open. Follows the finger.
export const laOpenAt = (t: number) => (t < 40.5 ? ease(t, 33.4, 35.0, 0, 1) : ease(t, 40.5, 41.0, 1, 0));

// Touches, in phone-screen points (393 × 852).
export type Touch = { appear: number; press: number; release: number; gone: number; from: [number, number]; to?: [number, number]; move?: [number, number]; hold?: [number, number] };
export const TOUCHES: Touch[] = [
  { appear: 26.6, press: 27.0, release: 28.3, gone: 28.6, from: [196, 30], hold: [27.0, 27.9] },
  { appear: 32.0, press: 32.25, release: 32.4, gone: 32.6, from: [300, 560] },
  { appear: 33.1, press: 33.35, release: 35.15, gone: 35.4, from: [196, 400], to: [196, 600], move: [33.4, 35.0] },
  { appear: 36.4, press: 36.68, release: 36.8, gone: 37.05, from: [65, 646] },
  { appear: 37.2, press: 37.45, release: 37.6, gone: 37.85, from: [65, 646] },
  { appear: 40.1, press: 40.35, release: 41.05, gone: 41.3, from: [196, 600], to: [196, 420], move: [40.5, 41.0] },
  { appear: 46.9, press: 47.3, release: 47.45, gone: 47.7, from: [281, 138] },
];

export const CAPTIONS = [
  { t: 16.6, end: 25.9, title: "Glance at the island", sub: "Clawd walks the track while Claude Code works in the background." },
  { t: 26.4, end: 32.6, title: "Touch and hold to expand", sub: "The island opens to the full status, with one control: Pause." },
  { t: 33.0, end: 41.3, title: "Pull down for the details", sub: "Every step of the task, plus Pause, Output, Open and Cancel." },
  { t: 41.7, end: 43.3, title: "One more thing.", sub: "" },
  { t: 43.5, end: 49.2, title: "Claude asks before it acts", sub: "A permission request is the one update that opens the island by itself." },
  { t: 49.5, end: 54.8, title: "Fits every presentation", sub: "Compact, minimal beside another activity, and 28pt limited width." },
  { t: 54.9, end: 59.0, title: "Done, then gone", sub: "The island clears. The Lock Screen keeps a summary for 30 minutes." },
];
