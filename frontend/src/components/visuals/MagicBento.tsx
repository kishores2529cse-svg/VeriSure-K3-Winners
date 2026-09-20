import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./MagicBento.css";

interface MagicBentoCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
}

interface MagicBentoGridProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  spotlightRadius?: number;
}

export function MagicBentoCard({ children, className = "", glowColor = "124, 255, 77", enableTilt = true, enableMagnetism = true, clickEffect = true }: MagicBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const particles = Array.from({ length: 12 }, (_, index) => {
      const particle = document.createElement("span");
      particle.className = "magic-bento-particle";
      particle.style.left = `${8 + ((index * 37) % 84)}%`;
      particle.style.top = `${12 + ((index * 53) % 76)}%`;
      particle.style.setProperty("--particle-color", `rgb(${glowColor})`);
      return particle;
    });
    const enter = () => {
      particles.forEach((particle, index) => {
        const timeout = window.setTimeout(() => { card.appendChild(particle); particlesRef.current.push(particle); gsap.fromTo(particle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.8, duration: 0.3 }); gsap.to(particle, { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, duration: 1.8 + Math.random(), repeat: -1, yoyo: true, ease: "sine.inOut" }); }, index * 45);
        timeoutsRef.current.push(timeout);
      });
    };
    const leave = () => { timeoutsRef.current.forEach(window.clearTimeout); timeoutsRef.current = []; particlesRef.current.forEach((particle) => { gsap.to(particle, { scale: 0, opacity: 0, duration: 0.2, onComplete: () => particle.remove() }); }); particlesRef.current = []; gsap.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: "power2.out" }); };
    const move = (event: MouseEvent) => { const rect = card.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; card.style.setProperty("--glow-x", `${(x / rect.width) * 100}%`); card.style.setProperty("--glow-y", `${(y / rect.height) * 100}%`); if (enableTilt) gsap.to(card, { rotateX: ((y - rect.height / 2) / (rect.height / 2)) * -4, rotateY: ((x - rect.width / 2) / (rect.width / 2)) * 4, duration: 0.15, transformPerspective: 900 }); if (enableMagnetism) gsap.to(card, { x: (x - rect.width / 2) * 0.018, y: (y - rect.height / 2) * 0.018, duration: 0.25 }); };
    const click = (event: MouseEvent) => { if (!clickEffect) return; const rect = card.getBoundingClientRect(); const ripple = document.createElement("span"); const size = Math.max(rect.width, rect.height) * 1.8; ripple.className = "magic-bento-ripple"; ripple.style.width = `${size}px`; ripple.style.height = `${size}px`; ripple.style.left = `${event.clientX - rect.left - size / 2}px`; ripple.style.top = `${event.clientY - rect.top - size / 2}px`; ripple.style.setProperty("--particle-color", `rgb(${glowColor})`); card.appendChild(ripple); gsap.fromTo(ripple, { scale: 0, opacity: 0.7 }, { scale: 1, opacity: 0, duration: 0.7, onComplete: () => ripple.remove() }); };
    card.addEventListener("mouseenter", enter); card.addEventListener("mouseleave", leave); card.addEventListener("mousemove", move); card.addEventListener("click", click);
    return () => { card.removeEventListener("mouseenter", enter); card.removeEventListener("mouseleave", leave); card.removeEventListener("mousemove", move); card.removeEventListener("click", click); leave(); };
  }, [clickEffect, enableMagnetism, enableTilt, glowColor]);
  return <div ref={cardRef} className={`magic-bento-card ${className}`} style={{ "--glow-color": `rgb(${glowColor})` } as React.CSSProperties}>{children}</div>;
}

export default function MagicBentoGrid({ children, className = "", glowColor = "124, 255, 77", spotlightRadius = 300 }: MagicBentoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const grid = gridRef.current; if (!grid) return; const move = (event: MouseEvent) => { const rect = grid.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return; const cards = grid.querySelectorAll<HTMLElement>(".magic-bento-card"); cards.forEach((card) => { const cardRect = card.getBoundingClientRect(); const distance = Math.hypot(event.clientX - (cardRect.left + cardRect.width / 2), event.clientY - (cardRect.top + cardRect.height / 2)); const intensity = Math.max(0, 1 - distance / spotlightRadius); card.style.setProperty("--spotlight-opacity", intensity.toString()); }); }; document.addEventListener("mousemove", move); return () => document.removeEventListener("mousemove", move); }, [spotlightRadius]);
  return <div ref={gridRef} className={`magic-bento-grid ${className}`} style={{ "--grid-glow": `rgb(${glowColor})` } as React.CSSProperties}>{children}</div>;
}
