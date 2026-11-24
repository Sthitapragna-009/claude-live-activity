// Phone-screen renderer: the wallpaper plus a slow aurora gradient, and real Liquid Glass lenses
// (refraction, chromatic dispersion, frost, specular rim, caustic) drawn in one three.js shader.
// Recipe follows liqui-hig/liquid-glass-web: convex bevel displacement + body zoom, RGB split,
// saturate 1.6, dark regular tint, edge thickness, caustic opposite the light, top sheen, rim.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { continueRender, delayRender, staticFile } from "remotion";

export type Lens = { x: number; y: number; w: number; h: number; r: number; mat: number; clear?: boolean };

const W = 393, H = 852;

const frag = /* glsl */ `
uniform sampler2D uWall;
uniform float uTime, uFocus, uKB;
uniform vec4 uRect[3];   // x, y, w, h  (points, y down)
uniform vec3 uMeta[3];   // radius, materialize 0..1, clear flag
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<3;i++){ s += a*noise(p); p *= 2.03; a *= .5; } return s; }

// The content layer: the user's blue gradient wallpaper with a slow, domain-warped aurora on top,
// so the glass has structure to bend.
vec3 scene(vec2 px){
  vec2 uv = px / vec2(${W}., ${H}.);
  vec2 t = vec2(0.5 + (uv.x - 0.5) * 0.82 / uKB, 0.5 + (uv.y - 0.5) / uKB - (uKB - 1.) * 0.06);
  // soft base: the wallpaper is a compressed upscale, so read it from a blurred mip to keep it smooth
  vec3 c = textureLod(uWall, vec2(t.x, 1. - t.y), 2.2).rgb;
  float tm = uTime * 0.11;
  vec2 q = uv * vec2(2.2, 3.4);
  float w = fbm(q + vec2(tm, -tm * .7) + vec2(1.6 * sin(q.y * 1.3 - tm), 1.2 * cos(q.x * 1.1 + tm * .8)));
  float y1 = .40 + .07 * sin(uv.x * 3.1 + tm * 2.3) + .13 * (w - .5);
  float y2 = .56 + .05 * sin(uv.x * 4.3 - tm * 1.7) + .10 * (w - .5);
  float b1 = exp(-pow((uv.y - y1) / .075, 2.));
  float b2 = exp(-pow((uv.y - y2) / .05, 2.));
  vec3 a1 = mix(vec3(.10, .32, 1.0), vec3(.42, .22, .95), smoothstep(.3, .7, w));
  vec3 a2 = mix(vec3(.10, .75, 1.0), vec3(.25, .45, 1.0), w);
  c += a1 * b1 * .55 + a2 * b2 * .35;
  // soft light pools give the glass smooth structure to bend (no fine noise = no pixel crawl)
  c += vec3(.35, .5, 1.) * exp(-dot(uv - vec2(.25 + .1 * sin(tm * 1.3), .33), uv - vec2(.25 + .1 * sin(tm * 1.3), .33)) / .02) * .35;
  c += vec3(.6, .35, 1.) * exp(-dot(uv - vec2(.78, .47 + .05 * cos(tm)), uv - vec2(.78, .47 + .05 * cos(tm))) / .015) * .3;
  return c;
}
vec3 sceneBlur(vec2 px, float r){
  if (r < .4) return scene(px);
  vec3 s = scene(px); float n = 1.;
  for (int i = 0; i < 16; i++){
    float a = float(i) * 2.39996, rr = r * sqrt((float(i) + .5) / 16.);
    s += scene(px + vec2(cos(a), sin(a)) * rr); n += 1.;
  }
  return s / n;
}
float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }

void main(){
  vec2 px = vec2(vUv.x * ${W}., (1. - vUv.y) * ${H}.);
  float bgBlur = uFocus * 18.;
  vec3 col = sceneBlur(px, bgBlur) * (1. - .38 * uFocus);
  vec2 L = normalize(vec2(-1., -1.));   // light from top-left

  for (int i = 0; i < 3; i++){
    float mat = uMeta[i].y;
    if (mat < .002) continue;
    vec2 hs = uRect[i].zw * .5, ctr = uRect[i].xy + hs;
    vec2 pl = px - ctr;
    float r = uMeta[i].x;
    float d = sdRR(pl, hs, r);
    // float + contact shadow
    float sh = sdRR(pl - vec2(0., 8.), hs, r);
    col *= 1. - .32 * mat * smoothstep(22., -6., sh);
    if (d > 1.) continue;
    vec2 e = vec2(.5, 0.);
    vec2 n = normalize(vec2(sdRR(pl + e.xy, hs, r) - sdRR(pl - e.xy, hs, r), sdRR(pl + e.yx, hs, r) - sdRR(pl - e.yx, hs, r)));
    bool clear = uMeta[i].z > .5;
    float minS = min(uRect[i].z, uRect[i].w);
    float edgeW = min(30., .5 * minS);
    float k = clamp(-d / edgeW, 0., 1.);
    float m = 1. - sqrt(1. - (1. - k) * (1. - k));          // convex bevel
    float zoom = clear ? .16 : .12;
    vec2 off = -n * m - (pl / hs) * zoom;                  // rim pull + body magnification
    float S = min(38., .36 * minS) * mat;
    vec2 disp = off * S * .5;
    float frost = (clear ? 2.5 : 9.) * mat;   // heavier frost, per request
    float rb = max(frost, bgBlur);
    // one frosted sample, then chromatic dispersion as a cheap fringe from three sharp samples
    vec3 g = sceneBlur(px + disp * 1.05, rb);
    vec3 s1 = scene(px + disp * 1.05);
    g.r += scene(px + disp).r - s1.r;
    g.b += scene(px + disp * 1.10).b - s1.b;
    g *= 1. - .38 * uFocus;
    float lum = dot(g, vec3(.299, .587, .114));
    g = mix(vec3(lum), g, 1.6) * 1.08;                      // saturate + brightness
    // regular: dark luminosity wash for text legibility; clear: HIG 35% dim over bright content
    g = clear ? mix(g, vec3(1.), .015) * .65 : mix(g, vec3(18., 18., 24.) / 255., .5);
    g *= 1. - .2 * smoothstep(10., 0., -d);                  // edge thickness
    g += .05 * smoothstep(28., 0., -d);
    g += vec3(.9, .95, 1.) * smoothstep(16., 0., -d) * max(0., dot(n, -L)) * .22;   // caustic
    g += .07 * exp(-pow((pl.y + hs.y) / (hs.y * .9 + 1.), 2.));                  // top sheen
    float lit = .35 + .65 * pow(max(0., dot(n, L)), 2.) + .35 * pow(max(0., dot(n, -L)), 3.);
    g += vec3(1.) * smoothstep(1.6, 0., abs(d + .8)) * lit * .85;                      // specular rim
    g += vec3(1.) * smoothstep(5., 0., abs(d + 1.5)) * lit * .18;                      // rim glow
    float a = smoothstep(.75, -.75, d) * clamp(mat * 1.4, 0., 1.);
    col = mix(col, g, a);
  }
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.) - .5) / 255.;   // dither: no gradient banding
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;

const Quad: React.FC<{ tex: THREE.Texture; t: number; focus: number; kb: number; lenses: Lens[] }> = ({ tex, t, focus, kb, lenses }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uWall: { value: tex }, uTime: { value: 0 }, uFocus: { value: 0 }, uKB: { value: 1 },
          uRect: { value: [0, 1, 2].map(() => new THREE.Vector4()) },
          uMeta: { value: [0, 1, 2].map(() => new THREE.Vector3()) },
        },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
        fragmentShader: frag,
        depthTest: false,
      }),
    [tex],
  );
  mat.uniforms.uTime.value = t;
  mat.uniforms.uFocus.value = focus;
  mat.uniforms.uKB.value = kb;
  lenses.slice(0, 3).forEach((l, i) => {
    mat.uniforms.uRect.value[i].set(l.x, l.y, l.w, l.h);
    mat.uniforms.uMeta.value[i].set(l.r, l.mat, l.clear ? 1 : 0);
  });
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

export const GlassScreen: React.FC<{ t: number; focus: number; kb: number; lenses: Lens[] }> = (props) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender("wallpaper texture"));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile("wallpaper.webp"), (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.minFilter = THREE.LinearMipmapLinearFilter;
      tx.generateMipmaps = true;
      tx.anisotropy = 8;
      setTex(tx);
      continueRender(handle);
    });
  }, [handle]);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ThreeCanvas width={W} height={H} flat dpr={2} orthographic camera={{ position: [0, 0, 1] }}>
        {tex && <Quad tex={tex} {...props} />}
      </ThreeCanvas>
    </div>
  );
};
