import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import "./FloatingLines.css";

type WaveName = "top" | "middle" | "bottom";
type WavePosition = { x: number; y: number; rotate: number };
type CountSetting = number | number[];

interface FloatingLinesProps {
  linesGradient?: string[];
  enabledWaves?: WaveName[];
  lineCount?: CountSetting;
  lineDistance?: CountSetting;
  topWavePosition?: Partial<WavePosition>;
  middleWavePosition?: Partial<WavePosition>;
  bottomWavePosition?: Partial<WavePosition>;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  backgroundColor?: string;
  lightMode?: boolean;
}

const vertexShader = `
precision highp float;
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const fragmentShader = `
precision highp float;
uniform float iTime, animationSpeed;
uniform vec3 iResolution, topWavePosition, middleWavePosition, bottomWavePosition;
uniform vec2 iMouse, parallaxOffset;
uniform bool enableTop, enableMiddle, enableBottom, interactive, parallax;
uniform int topLineCount, middleLineCount, bottomLineCount;
uniform float topLineDistance, middleLineDistance, bottomLineDistance, bendRadius, bendStrength, bendInfluence;
uniform vec3 lineGradient[8];
uniform int lineGradientCount;

mat2 rotate(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r)); }
vec3 backgroundColor(vec2 uv) {
  vec3 blue = vec3(47.0, 75.0, 162.0) / 255.0;
  vec3 pink = vec3(233.0, 71.0, 245.0) / 255.0;
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  return (mix(blue, vec3(0.0), smoothstep(0.0, 1.0, abs(m))) + mix(pink, vec3(0.0), smoothstep(0.0, 1.0, abs(m - 0.8)))) * 0.5;
}
vec3 lineColor(float t, vec3 fallback) {
  if (lineGradientCount <= 0) return fallback;
  float scaled = clamp(t, 0.0, 0.9999) * float(lineGradientCount - 1);
  int index = int(floor(scaled));
  return mix(lineGradient[index], lineGradient[min(index + 1, lineGradientCount - 1)], fract(scaled)) * 0.5;
}
float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv) {
  float time = iTime * animationSpeed;
  float y = sin(uv.x + offset + time * 0.1) * (sin(offset + time * 0.2) * 0.3);
  if (interactive) {
    vec2 distanceToMouse = screenUv - mouseUv;
    float influence = exp(-dot(distanceToMouse, distanceToMouse) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }
  float distanceToLine = uv.y - y;
  return 0.0175 / max(abs(distanceToLine) + 0.01, 0.001) + 0.01;
}
void drawWave(inout vec3 color, vec2 uv, vec2 mouseUv, bool enabled, int count, float distance, vec3 position, float offset, float weight, bool flip) {
  if (!enabled) return;
  for (int i = 0; i < 40; i++) {
    if (i >= count) break;
    float index = float(i);
    float t = index / max(float(count - 1), 1.0);
    vec2 rotatedUv = uv * rotate(position.z * log(length(uv) + 1.0));
    if (flip) rotatedUv.x *= -1.0;
    color += lineColor(t, backgroundColor(uv)) * wave(rotatedUv + vec2(distance * index + position.x, position.y), offset + 0.2 * index, uv, mouseUv) * weight;
  }
}
void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  uv.y *= -1.0;
  if (parallax) uv += parallaxOffset;
  vec2 mouseUv = interactive ? (vec2(2.0) * iMouse - iResolution.xy) / iResolution.y : vec2(0.0);
  mouseUv.y *= -1.0;
  vec3 color = vec3(0.0);
  drawWave(color, uv, mouseUv, enableBottom, bottomLineCount, bottomLineDistance, bottomWavePosition, 1.5, 0.2, false);
  drawWave(color, uv, mouseUv, enableMiddle, middleLineCount, middleLineDistance, middleWavePosition, 2.0, 1.0, false);
  drawWave(color, uv, mouseUv, enableTop, topLineCount, topLineDistance, topWavePosition, 1.0, 0.1, true);
  gl_FragColor = vec4(color, 1.0);
}
`;

function hexToVec3(hex: string) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  return new Vector3(parseInt(normalized.slice(0, 2), 16) / 255, parseInt(normalized.slice(2, 4), 16) / 255, parseInt(normalized.slice(4, 6), 16) / 255);
}

export default function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const countFor = (wave: WaveName) => typeof lineCount === "number" ? lineCount : lineCount[enabledWaves.indexOf(wave)] ?? 6;
    const distanceFor = (wave: WaveName) => typeof lineDistance === "number" ? lineDistance * 0.01 : (lineDistance[enabledWaves.indexOf(wave)] ?? 5) * 0.01;
    const position = (value: Partial<WavePosition> | undefined, fallback: WavePosition) => new Vector3(value?.x ?? fallback.x, value?.y ?? fallback.y, value?.rotate ?? fallback.rotate);
    const gradient = Array.from({ length: 8 }, () => new Vector3(1, 1, 1));
    (linesGradient ?? ["#22d3ee", "#818cf8", "#fb7185"]).slice(0, 8).forEach((color, index) => gradient[index].copy(hexToVec3(color)));
    const uniforms = {
      iTime: { value: 0 }, iResolution: { value: new Vector3(1, 1, 1) }, animationSpeed: { value: animationSpeed },
      enableTop: { value: enabledWaves.includes("top") }, enableMiddle: { value: enabledWaves.includes("middle") }, enableBottom: { value: enabledWaves.includes("bottom") },
      topLineCount: { value: countFor("top") }, middleLineCount: { value: countFor("middle") }, bottomLineCount: { value: countFor("bottom") },
      topLineDistance: { value: distanceFor("top") }, middleLineDistance: { value: distanceFor("middle") }, bottomLineDistance: { value: distanceFor("bottom") },
      topWavePosition: { value: position(topWavePosition, { x: 10, y: 0.5, rotate: -0.4 }) }, middleWavePosition: { value: position(middleWavePosition, { x: 5, y: 0, rotate: 0.2 }) }, bottomWavePosition: { value: position(bottomWavePosition, { x: 2, y: -0.7, rotate: 0.4 }) },
      iMouse: { value: new Vector2(-1000, -1000) }, interactive: { value: interactive }, bendRadius: { value: bendRadius }, bendStrength: { value: bendStrength }, bendInfluence: { value: 0 },
      parallax: { value: parallax }, parallaxOffset: { value: new Vector2(0, 0) }, lineGradient: { value: gradient }, lineGradientCount: { value: Math.min(linesGradient?.length ?? 3, 8) },
    };
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));
    const clock = new Clock();
    const mouse = new Vector2(-1000, -1000);
    const targetParallax = new Vector2();
    const currentParallax = new Vector2();
    const resize = () => { const width = container.clientWidth || 1; const height = container.clientHeight || 1; renderer.setSize(width, height, false); uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1); };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const move = (event: PointerEvent) => { const rect = renderer.domElement.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; const dpr = renderer.getPixelRatio(); mouse.set(x * dpr, (rect.height - y) * dpr); uniforms.iMouse.value.copy(mouse); if (parallax) targetParallax.set(((x - rect.width / 2) / rect.width) * parallaxStrength, -((y - rect.height / 2) / rect.height) * parallaxStrength); uniforms.bendInfluence.value = 1; };
    const leave = () => { uniforms.bendInfluence.value = 0; };
    if (interactive) { renderer.domElement.addEventListener("pointermove", move); renderer.domElement.addEventListener("pointerleave", leave); }
    let animationFrame = 0;
    const render = () => { if (!active) return; uniforms.iTime.value = clock.getElapsedTime(); currentParallax.lerp(targetParallax, mouseDamping); uniforms.parallaxOffset.value.copy(currentParallax); renderer.render(scene, camera); animationFrame = requestAnimationFrame(render); };
    render();
    return () => { active = false; cancelAnimationFrame(animationFrame); observer.disconnect(); if (interactive) { renderer.domElement.removeEventListener("pointermove", move); renderer.domElement.removeEventListener("pointerleave", leave); } geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); container.replaceChildren(); };
  }, [animationSpeed, bendRadius, bendStrength, enabledWaves, interactive, lineCount, lineDistance, linesGradient, middleWavePosition, mouseDamping, parallax, parallaxStrength, topWavePosition, bottomWavePosition]);

  return <div ref={containerRef} className="floating-lines-container" style={{ mixBlendMode }} aria-hidden="true" />;
}
