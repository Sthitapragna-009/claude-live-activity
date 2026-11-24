import { Easing } from "remotion";

export const theme = {
  colors: {
    // Claude launch look: ivory paper, slate ink, one clay accent
    ground: "#F0EEE6",
    groundDeep: "#E2DED2",
    ink: "#141413",
    inkDim: "rgba(20,20,19,.6)",
    clay: "#D97757",
    amber: "#F2B544",
    green: "#3FCB6A",
    red: "#FF5F57",
    paused: "#8E8A84",
    island: "#000000",
    islandText2: "rgba(235,235,245,.62)",
    cardBg: "rgba(10,14,30,.72)",
    titanium: "#2A2B2E",
  },
  fonts: { body: "Inter", display: "Source Serif 4" },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
    island: Easing.bezier(0.32, 0.72, 0, 1),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    island: { damping: 24, stiffness: 190, mass: 0.9 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;
