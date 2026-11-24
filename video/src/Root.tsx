import React from "react";
import { Composition } from "remotion";
import { ClaudeLiveActivity } from "./Video";
import { DURATION_S } from "./timeline";

const FPS = 30;

export const Root: React.FC = () => (
  <Composition id="ClaudeLiveActivity" component={ClaudeLiveActivity} durationInFrames={DURATION_S * FPS} fps={FPS} width={1920} height={1080} />
);
