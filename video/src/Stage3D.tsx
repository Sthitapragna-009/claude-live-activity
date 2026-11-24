import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { T } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ── Backdrop: soft studio sweep with a slow moving light pool and film grain, all in one shader.
const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uA: { value: new THREE.Color(theme.colors.ground) },
          uB: { value: new THREE.Color(theme.colors.groundDeep) },
          uWarm: { value: new THREE.Color(theme.colors.clay) },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uWarm;
          varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          void main(){
            vec2 p = vUv - vec2(0.5, 0.56);
            p.x *= 1.78;
            float sweep = smoothstep(0.95, 0.05, length(p));          // studio falloff
            vec2 c = vec2(0.18 * sin(uTime * 0.21), 0.08 * cos(uTime * 0.17));
            float pool = smoothstep(0.55, 0.0, length(p - c)) * 0.05; // slow light pool
            vec3 col = mix(uB, uA, sweep) + pool;
            col = mix(col, uWarm, 0.025 * smoothstep(0.6, 0.0, length(p - vec2(0.35, -0.3))));
            col += (hash(vUv * 900.0 + floor(uTime * 24.0)) - 0.5) * 0.018; // grain
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        depthWrite: false,
      }),
    [],
  );
  mat.uniforms.uTime.value = t;
  return (
    <mesh position={[0, 0, -30]} renderOrder={-1}>
      <planeGeometry args={[120, 70]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

// ── Voxel Clawd: same pixel grid as the 2D sprite, extruded.
type B = { x: number; y: number; w: number; h: number; d: number; z?: number; part: string };
const PARTS: B[] = [
  { part: "body", x: 2, y: 0, w: 10, h: 6.6, d: 5 },
  { part: "armL", x: 0, y: 2.8, w: 2.2, h: 1.8, d: 2.2 },
  { part: "armR", x: 11.8, y: 2.8, w: 2.2, h: 1.8, d: 2.2 },
  { part: "legA", x: 3, y: 6.4, w: 1.1, h: 2.4, d: 1.6 },
  { part: "legB", x: 5, y: 6.4, w: 1.1, h: 2.4, d: 1.6 },
  { part: "legA", x: 7.9, y: 6.4, w: 1.1, h: 2.4, d: 1.6 },
  { part: "legB", x: 9.9, y: 6.4, w: 1.1, h: 2.4, d: 1.6 },
  { part: "eye", x: 4, y: 1.6, w: 1.2, h: 1.6, d: 0.3, z: 2.55 },
  { part: "eye", x: 8.8, y: 1.6, w: 1.2, h: 1.6, d: 0.3, z: 2.55 },
];

const VoxelClawd: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const clay = useMemo(() => new THREE.MeshPhysicalMaterial({ color: theme.colors.clay, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color("#ffd2bf") }), []);
  const eye = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b0b0b", roughness: 0.18 }), []);
  const t = frame / fps;

  // Two appearances: intro (asleep while "we've waited", wakes on "Today… that changes",
  // leaps into the island) and outro.
  const inIntro = t < T.clawdLeap + 0.7, inOutro = t >= T.outro - 0.1;
  if (!inIntro && !inOutro) return null;
  const start = inIntro ? 0.15 : T.outro;
  const drop = spring({ frame: frame - Math.round(start * fps), fps, config: theme.spring.bouncy });
  let y = 7 * (1 - drop);
  let s = 1;
  const asleep = inIntro && t < T.clawdWakes;
  if (inIntro) {
    const wake = spring({ frame: frame - Math.round(T.clawdWakes * fps), fps, config: theme.spring.bouncy });
    y += Math.sin(Math.min(1, wake) * Math.PI) * 0.9; // a little startled hop
    const leap = interpolate(t, [T.clawdLeap, T.clawdLeap + 0.6], [0, 1], { ...clamp, easing: theme.ease.in });
    y += leap * 9;
    s = 1 - leap * 0.75;
  }
  const local = t - start;
  const rotY = -0.55 + interpolate(local, [0, 3], [0, 0.75], { ...clamp, easing: theme.ease.out }) + Math.sin(local * 1.3) * 0.08;
  const walking = drop > 0.95 && !asleep;
  const step = walking ? (Math.floor(frame / 5) % 2 ? 1 : 0) : 0;
  const blink = asleep ? 0.15 : (local > 9.3 && local < 9.43) || (local > 3.9 && local < 4.03) ? 0.15 : 1;
  const wave = inOutro && local > 1.2 ? (Math.floor(frame / 8) % 2 ? 1.2 : 0.4) : 0;
  const breathe = 1 + Math.sin(local * (asleep ? 1.4 : 2.4)) * (asleep ? 0.022 : 0.012);

  return (
    <group position={[0, 1.55 + y, 0]} rotation={[0.12, rotY, 0]} scale={0.36 * s * breathe}>
      {PARTS.map((b, i) => {
        let dy = 0;
        if (b.part === "legA") dy = step ? 0.6 : 0;
        if (b.part === "legB") dy = step ? 0 : 0.6;
        if (b.part === "armR") dy = wave;
        const sy = b.part === "eye" ? blink : 1;
        return (
          <mesh key={i} castShadow material={b.part === "eye" ? eye : clay}
            position={[b.x + b.w / 2 - 7, -(b.y + b.h / 2) + 4.4 + dy, b.z ?? 0]} scale={[1, sy, 1]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Stage3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: 30, position: [0, 1.2, 22], near: 0.1, far: 100 }}>
      <Backdrop t={frame / fps} />
      <hemisphereLight args={["#ffffff", "#8f8a84", 0.85]} />
      <directionalLight position={[6, 8, 9]} intensity={3.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <directionalLight position={[-6, 2, 4]} intensity={0.6} color="#cfe0ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.16} />
      </mesh>
      <VoxelClawd frame={frame} fps={fps} />
    </ThreeCanvas>
  );
};
