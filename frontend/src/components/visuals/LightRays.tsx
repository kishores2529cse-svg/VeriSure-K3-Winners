import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import "./LightRays.css";

type RaysOrigin = "top-center" | "top-left" | "top-right" | "left" | "right" | "bottom-left" | "bottom-center" | "bottom-right";

interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
}

const vertexShader = `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;
const fragmentShader = `precision highp float;
uniform float iTime, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, mouseInfluence, noiseAmount, distortion;
uniform vec2 iResolution, rayPos, rayDir, mousePos; uniform vec3 raysColor; varying vec2 vUv;
float noise(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float strength(vec2 source, vec2 direction, vec2 coord, float a, float b, float speed) {
  vec2 delta = coord - source; float distanceToSource = length(delta); float angle = dot(normalize(delta), direction);
  angle += distortion * sin(iTime * 2.0 + distanceToSource * 0.01) * 0.2;
  float spread = pow(max(angle, 0.0), 1.0 / max(lightSpread, 0.001));
  float lengthFade = clamp((iResolution.x * rayLength - distanceToSource) / (iResolution.x * rayLength), 0.0, 1.0);
  float fade = clamp((iResolution.x * fadeDistance - distanceToSource) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? 0.8 + 0.2 * sin(iTime * speed * 3.0) : 1.0;
  float pattern = clamp((0.45 + 0.15 * sin(angle * a + iTime * speed)) + (0.3 + 0.2 * cos(-angle * b + iTime * speed)), 0.0, 1.0);
  return pattern * lengthFade * fade * spread * pulse;
}
void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y); vec2 direction = rayDir;
  if (mouseInfluence > 0.0) direction = normalize(mix(rayDir, normalize(mousePos * iResolution - rayPos), mouseInfluence));
  vec3 color = raysColor * (strength(rayPos, direction, coord, 36.2, 21.1, 1.5 * raysSpeed) * 0.5 + strength(rayPos, direction, coord, 22.4, 18.0, 1.1 * raysSpeed) * 0.4);
  if (noiseAmount > 0.0) color *= 1.0 - noiseAmount + noiseAmount * noise(coord * 0.01 + iTime * 0.1);
  float brightness = 1.0 - coord.y / iResolution.y; color *= vec3(0.1 + brightness * 0.8, 0.3 + brightness * 0.6, 0.5 + brightness * 0.5);
  float gray = dot(color, vec3(0.299, 0.587, 0.114)); color = mix(vec3(gray), color, saturation); gl_FragColor = vec4(color, 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255] : [1, 1, 1];
}

function anchorAndDirection(origin: RaysOrigin, width: number, height: number) {
  const outside = 0.2;
  if (origin === "top-left") return { anchor: [0, -outside * height], direction: [0, 1] };
  if (origin === "top-right") return { anchor: [width, -outside * height], direction: [0, 1] };
  if (origin === "left") return { anchor: [-outside * width, height * 0.5], direction: [1, 0] };
  if (origin === "right") return { anchor: [(1 + outside) * width, height * 0.5], direction: [-1, 0] };
  if (origin === "bottom-left") return { anchor: [0, (1 + outside) * height], direction: [0, -1] };
  if (origin === "bottom-right") return { anchor: [width, (1 + outside) * height], direction: [0, -1] };
  if (origin === "bottom-center") return { anchor: [width * 0.5, (1 + outside) * height], direction: [0, -1] };
  return { anchor: [width * 0.5, -outside * height], direction: [0, 1] };
}

export default function LightRays({ raysOrigin = "top-center", raysColor = "#7CFF4D", raysSpeed = 1.2, lightSpread = 0.8, rayLength = 1.2, pulsating = true, fadeDistance = 1, saturation = 1, followMouse = true, mouseInfluence = 0.1, noiseAmount = 0.08, distortion = 0.05, className = "" }: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !visible) return;
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: true });
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    container.replaceChildren(gl.canvas);
    const uniforms = {
      iTime: { value: 0 }, iResolution: { value: [1, 1] }, rayPos: { value: [0, 0] }, rayDir: { value: [0, 1] },
      raysColor: { value: hexToRgb(raysColor) }, raysSpeed: { value: raysSpeed }, lightSpread: { value: lightSpread }, rayLength: { value: rayLength },
      pulsating: { value: pulsating ? 1 : 0 }, fadeDistance: { value: fadeDistance }, saturation: { value: saturation }, mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: mouseInfluence }, noiseAmount: { value: noiseAmount }, distortion: { value: distortion },
    };
    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex: vertexShader, fragment: fragmentShader, uniforms });
    const mesh = new Mesh(gl, { geometry, program });
    let frame = 0;
    const resize = () => { const width = container.clientWidth || 1; const height = container.clientHeight || 1; renderer.setSize(width, height); uniforms.iResolution.value = [width * renderer.dpr, height * renderer.dpr]; const placement = anchorAndDirection(raysOrigin, width * renderer.dpr, height * renderer.dpr); uniforms.rayPos.value = placement.anchor; uniforms.rayDir.value = placement.direction; };
    const move = (event: MouseEvent) => { const rect = container.getBoundingClientRect(); mouseRef.current = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }; };
    const render = (time: number) => { uniforms.iTime.value = time * 0.001; uniforms.mousePos.value = [mouseRef.current.x, mouseRef.current.y]; renderer.render({ scene: mesh }); frame = requestAnimationFrame(render); };
    resize(); window.addEventListener("resize", resize); if (followMouse) window.addEventListener("mousemove", move); frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); if (followMouse) window.removeEventListener("mousemove", move); renderer.gl.getExtension("WEBGL_lose_context")?.loseContext(); renderer.gl.canvas.remove(); };
  }, [distortion, fadeDistance, followMouse, lightSpread, mouseInfluence, noiseAmount, pulsating, rayLength, raysColor, raysOrigin, raysSpeed, saturation, visible]);

  return <div ref={containerRef} className={`light-rays-container ${className}`.trim()} aria-hidden="true" />;
}
