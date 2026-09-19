import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Sparkles,
  Crosshair,
  User,
  ArrowRight,
  Cpu,
  Lock,
  Terminal,
  ShieldCheck,
  Eye,
  BarChart2,
  Radio,
  Activity,
  ChevronRight,
  Shield,
  Layers,
  CheckCircle2,
  Zap
} from 'lucide-react';
import cyberMechImg from '../../assets/cyber_mech_hero.jpg';
import SplashCursor from '../../components/visuals/SplashCursor';

// -------------------------------------------------------------
// Animated Number with IntersectionObserver & Cubic Easing
// Easing: 1 - Math.pow(1 - progress, 3)
// -------------------------------------------------------------
interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;

          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Cubic ease-out: 1 - Math.pow(1 - progress, 3)
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentNumber = easeOutProgress * value;

            if (decimals > 0) {
              setDisplayValue(currentNumber.toFixed(decimals));
            } else {
              setDisplayValue(Math.floor(currentNumber).toLocaleString());
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              if (decimals > 0) {
                setDisplayValue(value.toFixed(decimals));
              } else {
                setDisplayValue(value.toLocaleString());
              }
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value, decimals, duration, hasAnimated]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// -------------------------------------------------------------
// Interactive Starfield / Ambient Canvas Particle Background
// -------------------------------------------------------------
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulseSpeed: number;
      color: string;
    }> = [];

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        color: Math.random() > 0.4 ? '#7CFF4D' : '#ffffff'
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.opacity += p.pulseSpeed;
        if (p.opacity > 0.6 || p.opacity < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(p.opacity, 1));
        ctx.shadowBlur = p.color === '#7CFF4D' ? 8 : 4;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
    />
  );
};

// -------------------------------------------------------------
// Interactive 3D HUD / Robot Overlay Component with Mouse Tilt
// -------------------------------------------------------------
const HeroVisualHUD: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blink, setBlink] = useState(false);

  // Mouse tilt animation via Framer Motion springs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Fast periodic cybernetic eye blink / sudden bright pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center p-4 lg:p-8"
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        className="relative flex h-[480px] w-[480px] max-w-full items-center justify-center sm:h-[540px] sm:w-[540px] lg:h-[600px] lg:w-[600px]"
      >
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7CFF4D]/15 via-[#7CFF4D]/5 to-transparent blur-3xl" />

        {/* Outer Circular Tech Border Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Ring 1: Prominent Thick Rotating Tech Radar Arc with Neon Nodes */}
          <div className="relative h-[92%] w-[92%] rounded-full border-[3.5px] sm:border-[4px] border-[#7CFF4D] border-dashed shadow-[0_0_30px_rgba(124,255,77,0.55)] animate-radar">
            {/* Thick Glowing Accent Beads on Rotating Ring */}
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-[#7CFF4D] ring-4 ring-[#7CFF4D]/40 shadow-[0_0_20px_#7CFF4D]" />
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-[#7CFF4D] ring-4 ring-[#7CFF4D]/40 shadow-[0_0_20px_#7CFF4D]" />
            <span className="absolute top-1/2 -left-2.5 -translate-y-1/2 h-4 w-4 rounded-full bg-[#FFD84D] ring-4 ring-[#FFD84D]/40 shadow-[0_0_20px_#FFD84D]" />
            <span className="absolute top-1/2 -right-2.5 -translate-y-1/2 h-4 w-4 rounded-full bg-[#7CFF4D] ring-4 ring-[#7CFF4D]/40 shadow-[0_0_20px_#7CFF4D]" />
          </div>

          {/* Ring 2: Counter-Rotating Thick Neon Segmented Arc */}
          <div
            className="absolute h-[86%] w-[86%] rounded-full border-[3px] border-t-[#7CFF4D] border-r-[#7CFF4D]/80 border-b-transparent border-l-transparent shadow-[0_0_25px_rgba(124,255,77,0.5)] animate-radar"
            style={{ animationDirection: 'reverse', animationDuration: '8s' }}
          />

          {/* Ring 3: Solid Tech Boundary */}
          <div className="absolute h-[80%] w-[80%] rounded-full border-[2.5px] border-neutral-700/90 shadow-[0_0_25px_rgba(124,255,77,0.2)]">
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[#7CFF4D] shadow-[0_0_12px_#7CFF4D]" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[#FFD84D] shadow-[0_0_12px_#FFD84D]" />
          </div>

          {/* Ring 4: Conic Gradient Radar Sweep */}
          <div
            className="absolute h-[76%] w-[76%] rounded-full opacity-50 animate-radar pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(124,255,77,0.6) 45deg, transparent 90deg)'
            }}
          />

          {/* Crosshair Corner Brackets */}
          <div className="absolute h-[88%] w-[88%] pointer-events-none border border-transparent">
            <span className="absolute top-0 left-0 h-5 w-5 border-t-[3px] border-l-[3px] border-[#7CFF4D] shadow-[0_0_10px_#7CFF4D]" />
            <span className="absolute top-0 right-0 h-5 w-5 border-t-[3px] border-r-[3px] border-[#7CFF4D] shadow-[0_0_10px_#7CFF4D]" />
            <span className="absolute bottom-0 left-0 h-5 w-5 border-b-[3px] border-l-[3px] border-[#7CFF4D] shadow-[0_0_10px_#7CFF4D]" />
            <span className="absolute bottom-0 right-0 h-5 w-5 border-b-[3px] border-r-[3px] border-[#7CFF4D] shadow-[0_0_10px_#7CFF4D]" />
          </div>
        </div>

        {/* Center Cyber Mech Robot Visual */}
        <div className="relative z-10 h-[80%] w-[80%] overflow-hidden rounded-full border-[3px] border-[#7CFF4D]/50 bg-[#090909] shadow-[0_0_50px_rgba(0,0,0,0.95)]">
          <img
            src={cyberMechImg}
            alt="Cybernetic Sentinel Mech"
            className={`h-full w-full object-cover object-center transition-all duration-100 ${
              blink
                ? 'brightness-[1.9] contrast-[1.35] drop-shadow-[0_0_35px_#7CFF4D]'
                : 'brightness-100 contrast-100'
            }`}
          />
          {/* Sudden Visor Flash Glow Overlay */}
          <div
            className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-100 ${
              blink ? 'opacity-90' : 'opacity-0'
            }`}
            style={{
              background:
                'radial-gradient(circle at 45% 45%, rgba(124,255,77,0.55) 0%, rgba(124,255,77,0.2) 40%, transparent 70%)',
              mixBlendMode: 'screen'
            }}
          />

          {/* Subtle Cyber Gradient Overlay Mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent opacity-60" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#090909]/20 to-[#090909]/80" />

          {/* Scanning Line Animation */}
          <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#7CFF4D]/80 to-transparent shadow-[0_0_12px_#7CFF4D] animate-scanline" />
        </div>

        {/* Dynamic Telemetry Floating Badges (Preserve-3D Popout) */}
        {/* Top-Right: SYSTEM STATUS ONLINE */}
        <div
          style={{ transform: 'translateZ(40px)' }}
          className="absolute top-10 right-4 sm:right-10 z-20 flex items-center gap-2 rounded-xl border border-neutral-800/90 bg-[#090909]/90 px-3 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7CFF4D] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7CFF4D]" />
          </span>
          <div className="text-left font-mono">
            <span className="block text-[10px] tracking-widest text-neutral-400">SYSTEM STATUS</span>
            <span className="text-xs font-bold text-[#7CFF4D]">ONLINE</span>
          </div>
        </div>

        {/* Middle-Right: STREAMING ACTIVE */}
        <div
          style={{ transform: 'translateZ(30px)' }}
          className="absolute top-1/2 -right-2 sm:right-4 -translate-y-1/2 z-20 flex items-center gap-2.5 rounded-xl border border-neutral-800/90 bg-[#090909]/90 px-3 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <Activity className="h-4 w-4 text-[#7CFF4D] animate-pulse" />
          <div className="text-left font-mono">
            <span className="block text-[10px] tracking-widest text-neutral-400">STREAMING</span>
            <span className="text-xs font-bold text-[#7CFF4D]">ACTIVE</span>
          </div>
        </div>

        {/* Bottom-Right: THREAT MONITORING */}
        <div
          style={{ transform: 'translateZ(45px)' }}
          className="absolute bottom-10 right-6 sm:right-14 z-20 flex flex-col gap-1.5 rounded-xl border border-neutral-800/90 bg-[#090909]/90 px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] tracking-widest text-neutral-400">
            <span>THREAT MONITORING</span>
            <span className="text-[#7CFF4D] font-bold">SECURE</span>
          </div>
          {/* Segmented LED Threat Level Bars */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3.5 rounded-sm bg-[#7CFF4D] shadow-[0_0_8px_#7CFF4D]" />
            <span className="h-2 w-3.5 rounded-sm bg-[#7CFF4D] shadow-[0_0_8px_#7CFF4D]" />
            <span className="h-2 w-3.5 rounded-sm bg-[#7CFF4D] shadow-[0_0_8px_#7CFF4D]" />
            <span className="h-2 w-3.5 rounded-sm bg-[#7CFF4D] shadow-[0_0_8px_#7CFF4D]" />
            <span className="h-2 w-3.5 rounded-sm bg-[#7CFF4D] shadow-[0_0_8px_#7CFF4D]" />
          </div>
        </div>

        {/* Bottom-Left: LATENCY TELEMETRY */}
        <div
          style={{ transform: 'translateZ(25px)' }}
          className="absolute bottom-12 left-4 sm:left-8 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-neutral-800/90 bg-[#090909]/90 px-3 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <Radio className="h-3.5 w-3.5 text-[#FFD84D]" />
          <div className="text-left font-mono">
            <span className="block text-[9px] tracking-widest text-neutral-400">TELEMETRY LATENCY</span>
            <span className="text-[11px] font-bold text-[#FFD84D]">11.4 ms // SYNCED</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------
// Sequential Animated Letters for Titles (Framer Motion)
// -------------------------------------------------------------
interface AnimatedLetterTitleProps {
  text: string;
  className?: string;
  hoverColorClass?: string;
  staggerDelay?: number;
}

const AnimatedLetterTitle: React.FC<AnimatedLetterTitleProps> = ({
  text,
  className = '',
  hoverColorClass = 'hover:text-[#7CFF4D]',
  staggerDelay = 0.04
}) => {
  const letters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 25, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        damping: 14,
        stiffness: 220
      }
    }
  };

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`inline-flex flex-wrap select-none font-black tracking-tighter ${className}`}
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={letterVariants}
          className={`inline-block transition-colors duration-200 cursor-default ${hoverColorClass}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// -------------------------------------------------------------
// Interactive Ripple Button
// Tracks mouse click coordinates to spawn an expanding ripple
// -------------------------------------------------------------
interface RippleButtonProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}

const RippleButton: React.FC<RippleButtonProps> = ({ children, to, onClick, className = '' }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };

    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 700);

    if (onClick) onClick();
  };

  const content = (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 140,
            height: 140
          }}
        />
      ))}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} onClick={handleClick} className={`relative overflow-hidden ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={`relative overflow-hidden ${className}`}>
      {content}
    </button>
  );
};

// -------------------------------------------------------------
// Main Landing Page Component
// -------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#090909] text-slate-100 overflow-x-hidden font-sans selection:bg-[#7CFF4D]/20 selection:text-[#7CFF4D]">
      {/* Background Particle Canvas */}
      <ParticleBackground />

      {/* Professional Fluid Cursor Splash Effect */}
      <SplashCursor
        DENSITY_DISSIPATION={8}
        VELOCITY_DISSIPATION={12}
        PRESSURE={0.5}
        SPLAT_RADIUS={0.1}
        SPLAT_FORCE={4000}
        COLOR_UPDATE_SPEED={10}
        COLOR="#7CFF4D"
        RAINBOW_MODE={false}
      />

      {/* Atmospheric Background Glow Lights */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#7CFF4D]/5 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[600px] w-[600px] rounded-full bg-[#FFD84D]/5 blur-[160px]" />

      {/* -------------------------------------------------------------
          Sticky Top Navigation Bar
      ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-[#090909]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Telemetry Indicator */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D] shadow-[0_0_15px_rgba(124,255,77,0.2)] transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-black tracking-widest text-white">
                VERISURE<span className="text-[#7CFF4D]">.AI</span>
              </span>
              <span className="font-mono text-[9px] tracking-wider text-neutral-400">
                EXAM MALPRACTICE PROCTORING
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs tracking-wider text-neutral-300">
            <a href="#features" className="transition-colors hover:text-[#7CFF4D]">
              FEATURES
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-[#7CFF4D]">
              HOW IT WORKS
            </a>
            <a href="#metrics" className="transition-colors hover:text-[#7CFF4D]">
              TELEMETRY
            </a>
            <Link to="/about" className="transition-colors hover:text-[#7CFF4D]">
              ABOUT US
            </Link>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 font-mono text-[10px] text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-[#7CFF4D] animate-pulse" />
              SYSTEM ONLINE
            </div>

            <Link
              to="/login"
              className="group flex items-center gap-1.5 rounded-xl border border-[#7CFF4D]/40 bg-[#7CFF4D]/10 px-4 py-2 font-mono text-xs font-semibold text-[#7CFF4D] transition-all hover:bg-[#7CFF4D] hover:text-black hover:shadow-[0_0_20px_rgba(124,255,77,0.3)]"
            >
              <span>CONSOLE</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          Hero Section
      ------------------------------------------------------------- */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-8 pb-16 lg:py-16">
        {/* Ghosted Giant Watermark in the background */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -translate-y-1/2 flex select-none flex-col items-center justify-center text-center font-black tracking-tighter opacity-[0.035] sm:opacity-[0.04]">
          <span className="text-[9.5vw] leading-none text-white">EXAM MALPRACTICE</span>
          <span className="text-[9.5vw] leading-none text-white">PROCTORING</span>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
              {/* Top Pill Badge */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-widest text-[#7CFF4D] shadow-[0_0_15px_rgba(124,255,77,0.15)] backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#7CFF4D] animate-spin" style={{ animationDuration: '4s' }} />
                <span>FACULTY COMMAND CENTER</span>
              </motion.div>

              {/* Sequential Staggered Animated Title */}
              <div className="flex flex-col leading-[0.95]">
                <AnimatedLetterTitle
                  text="EXAM MALPRACTICE"
                  className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl text-white"
                  hoverColorClass="hover:text-[#7CFF4D] hover:drop-shadow-[0_0_20px_#7CFF4D]"
                  staggerDelay={0.03}
                />
                <AnimatedLetterTitle
                  text="PROCTORING"
                  className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl text-[#7CFF4D] drop-shadow-[0_0_25px_rgba(124,255,77,0.3)]"
                  hoverColorClass="hover:text-[#FFD84D] hover:drop-shadow-[0_0_20px_#FFD84D]"
                  staggerDelay={0.04}
                />
              </div>

              {/* Hero Description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-2xl text-base sm:text-lg text-neutral-300 font-normal leading-relaxed"
              >
                An exam malpractice proctoring tool (running on Windows) which would help the faculty to sit
                in a single system and monitor all student desktops in his/her desktop. All student
                screens should be continuously streamed to the server and the faculty system should
                be able to see all the screens in parallel.
              </motion.p>

              {/* Highlighted Callout Box */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex items-start gap-3.5 rounded-2xl border border-neutral-800/90 bg-neutral-900/60 p-4 sm:p-5 backdrop-blur-md shadow-2xl max-w-xl transition-all hover:border-[#7CFF4D]/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FFD84D]/30 bg-[#FFD84D]/10 text-[#FFD84D] shadow-[0_0_12px_rgba(255,216,77,0.2)]">
                  <Crosshair className="h-5 w-5 animate-pulse" />
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  Additional points would be given to the software which is also able to report{' '}
                  <span className="font-semibold text-[#FFD84D] underline decoration-[#FFD84D]/50 underline-offset-2">
                    un-usual behaviour
                  </span>{' '}
                  by any individual system and bring it automatically as full screen to the main
                  faculty system.
                </p>
              </motion.div>

              {/* Interactive CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                {/* Primary Button: LOGIN with dynamic ripple & hover nudge */}
                <RippleButton
                  to="/login"
                  className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#7CFF4D] via-[#A3FF1A] to-[#FFD84D] px-7 py-3.5 font-mono text-sm font-bold text-black shadow-[0_0_25px_rgba(124,255,77,0.35)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(124,255,77,0.55)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <User className="h-4 w-4" />
                  <span>LOGIN</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                </RippleButton>

                {/* Secondary Button: ABOUT US */}
                <Link
                  to="/about"
                  className="group flex items-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-900/40 px-6 py-3.5 font-mono text-sm font-semibold text-neutral-200 backdrop-blur-md transition-all duration-200 hover:border-[#7CFF4D]/60 hover:text-[#7CFF4D] hover:shadow-[0_0_20px_rgba(124,255,77,0.2)] hover:scale-[1.02]"
                >
                  <Sparkles className="h-4 w-4 text-[#7CFF4D] transition-transform group-hover:rotate-12" />
                  <span>ABOUT US</span>
                </Link>
              </motion.div>
            </div>

            {/* Right Column: Interactive 3D HUD / Robot overlay */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroVisualHUD />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Features Section ("Built for Uncompromising Integrity")
      ------------------------------------------------------------- */}
      <section id="features" className="relative py-24 border-t border-neutral-800/80 bg-[#090909]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[#7CFF4D]">
              <Zap className="h-3 w-3" />
              INTELLIGENCE PROTOCOLS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Built for Uncompromising Integrity
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#7CFF4D] to-transparent mx-auto rounded-full shadow-[0_0_12px_#7CFF4D]" />
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Enterprise-grade anti-cheating, hardware virtualization guards, and low-latency
              telemetry pipeline designed for massive synchronous testing halls.
            </p>
          </div>

          {/* 3 Glassmorphic Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Neural Face & Eye Mesh */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-8 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-[#7CFF4D]/50 hover:shadow-[0_0_30px_rgba(124,255,77,0.15)]"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D] shadow-[0_0_15px_rgba(124,255,77,0.2)] transition-transform group-hover:scale-110">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#7CFF4D] transition-colors">
                  Neural Face & Eye Mesh
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                  68-point facial landmark tracking with continuous gaze angle analysis — detecting
                  off-screen glances and dual-person presence.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between font-mono text-xs text-[#7CFF4D]">
                <span>VISION ENGINE V4</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>

            {/* Card 2: Safe Exam Lockdown */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-8 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-[#7CFF4D]/50 hover:shadow-[0_0_30px_rgba(124,255,77,0.15)]"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D] shadow-[0_0_15px_rgba(124,255,77,0.2)] transition-transform group-hover:scale-110">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#7CFF4D] transition-colors">
                  Safe Exam Lockdown
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                  Intercepts tab switches, right-clicks, copy/paste, DevTools shortcuts, and
                  secondary monitor setups with instant lockout triggers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between font-mono text-xs text-[#7CFF4D]">
                <span>SANDBOX LOCK</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>

            {/* Card 3: Monaco Compiler */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-8 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-[#7CFF4D]/50 hover:shadow-[0_0_30px_rgba(124,255,77,0.15)]"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D] shadow-[0_0_15px_rgba(124,255,77,0.2)] transition-transform group-hover:scale-110">
                  <Terminal className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#7CFF4D] transition-colors">
                  Monaco Compiler
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                  Full Monaco Editor with Go starter code, custom test runners, memory profiling,
                  and real-time execution in an isolated sandbox.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between font-mono text-xs text-[#7CFF4D]">
                <span>GO RUNTIME v1.23</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          "How It Works" Section
      ------------------------------------------------------------- */}
      <section id="how-it-works" className="relative py-24 border-t border-neutral-800/80 bg-[#090909]/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[#7CFF4D]">
              <Layers className="h-3 w-3" />
              4-PHASE INTEGRATION LIFECYCLE
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              How It Works
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#7CFF4D] to-transparent mx-auto rounded-full shadow-[0_0_12px_#7CFF4D]" />
            <p className="text-neutral-400 text-sm sm:text-base">
              Autonomous proctoring workflows orchestrating verification, lockdown, continuous ML
              telemetry, and faculty audit dashboards.
            </p>
          </div>

          {/* 4-column Step Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-lg transition-all hover:border-[#7CFF4D]/40">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-neutral-700 select-none">
                    01
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">Identity Check</h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Webcam, mic, screen, and biometric verification before exam start with strict
                  multi-factor validation.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-lg transition-all hover:border-[#7CFF4D]/40">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FFD84D]/30 bg-[#FFD84D]/10 text-[#FFD84D]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-neutral-700 select-none">
                    02
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">Viewport Lock</h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Fullscreen enforced, DevTools blocked, clipboard protected, and second monitor
                  signals quarantined.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-lg transition-all hover:border-[#7CFF4D]/40">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D]">
                    <Eye className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-neutral-700 select-none">
                    03
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">AI Telemetry</h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Continuous face mesh, voice detection, confidence scoring, and background noise
                  classification in real time.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-6 backdrop-blur-md shadow-lg transition-all hover:border-[#7CFF4D]/40">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FFD84D]/30 bg-[#FFD84D]/10 text-[#FFD84D]">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-neutral-700 select-none">
                    04
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">Audit Log</h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Flagged incident timeline, confidence integrity graphs, and automated video snapshot
                  evidence for admin review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Animated Metrics & Telemetry (Stats Section)
      ------------------------------------------------------------- */}
      <section id="metrics" className="relative py-20 border-t border-neutral-800/80 bg-[#090909]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Cyber HUD Container with Decorative Corner Brackets */}
          <div className="relative rounded-3xl border border-[#7CFF4D]/35 bg-neutral-950/80 p-8 sm:p-12 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            {/* Tech Corner Decorative Brackets */}
            <span className="absolute -top-1 -left-1 h-5 w-5 border-t-2 border-l-2 border-[#7CFF4D]" />
            <span className="absolute -top-1 -right-1 h-5 w-5 border-t-2 border-r-2 border-[#7CFF4D]" />
            <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-[#7CFF4D]" />
            <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-[#7CFF4D]" />

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4 font-mono text-xs">
              <span className="tracking-widest text-neutral-400">
                LIVE TELEMETRY // GLOBAL INSTANCES
              </span>
              <span className="flex items-center gap-2 text-[#7CFF4D]">
                <span className="h-2 w-2 rounded-full bg-[#7CFF4D] animate-ping" />
                SYSTEM LATENCY OPTIMIZED
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
              {/* Stat 1: 100000+ Exams */}
              <div className="space-y-2">
                <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-[#7CFF4D] drop-shadow-[0_0_15px_rgba(124,255,77,0.3)]">
                  <AnimatedNumber value={100000} suffix="+" duration={2200} />
                </div>
                <div className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                  Exams Supervised
                </div>
              </div>

              {/* Stat 2: 99.8% Accuracy */}
              <div className="space-y-2">
                <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                  <AnimatedNumber value={99.8} suffix="%" decimals={1} duration={2000} />
                </div>
                <div className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                  Detection Accuracy
                </div>
              </div>

              {/* Stat 3: <15ms Latency */}
              <div className="space-y-2">
                <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-[#FFD84D] drop-shadow-[0_0_15px_rgba(255,216,77,0.3)]">
                  <AnimatedNumber value={15} prefix="<" suffix="ms" duration={1800} />
                </div>
                <div className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                  Real-time Latency
                </div>
              </div>

              {/* Stat 4: 500+ Clients */}
              <div className="space-y-2">
                <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                  <AnimatedNumber value={500} suffix="+" duration={2000} />
                </div>
                <div className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                  Enterprise Partners
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Tech Stack & Footer
      ------------------------------------------------------------- */}
      <footer className="border-t border-neutral-800/80 bg-[#090909] text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-800/60">
            {/* Brand Column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 text-[#7CFF4D]">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="font-mono text-sm font-black tracking-widest text-white">
                  VERISURE<span className="text-[#7CFF4D]">.AI</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-400">
                Next-generation Windows system surveillance & multi-candidate proctoring command
                center.
              </p>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#7CFF4D]">
                <CheckCircle2 className="h-3 w-3" />
                <span>ALL SYSTEMS OPERATIONAL</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 font-mono text-xs">
              <h5 className="font-bold tracking-wider text-white uppercase">NAVIGATION</h5>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="hover:text-[#7CFF4D] transition-colors">
                    Faculty Login
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#7CFF4D] transition-colors">
                    About Project
                  </Link>
                </li>
                <li>
                  <Link to="/proctor" className="hover:text-[#7CFF4D] transition-colors">
                    Proctor Vision
                  </Link>
                </li>
                <li>
                  <Link to="/upi" className="hover:text-[#7CFF4D] transition-colors">
                    UPI Fraud Guard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Protocols */}
            <div className="space-y-3 font-mono text-xs">
              <h5 className="font-bold tracking-wider text-white uppercase">SECURITY</h5>
              <ul className="space-y-2">
                <li className="hover:text-neutral-200 transition-colors">Zero-Trust Telemetry</li>
                <li className="hover:text-neutral-200 transition-colors">Biometric Facial Mesh</li>
                <li className="hover:text-neutral-200 transition-colors">Hardware Display Locker</li>
                <li className="hover:text-neutral-200 transition-colors">Audit Trail Verification</li>
              </ul>
            </div>

            {/* Telemetry Status Box */}
            <div className="space-y-3 font-mono text-xs">
              <h5 className="font-bold tracking-wider text-white uppercase">SYSTEM STATUS</h5>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400">SEC-GATEWAY</span>
                  <span className="text-[#7CFF4D]">200 OK</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400">STREAM PIPELINE</span>
                  <span className="text-[#7CFF4D]">60 FPS</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400">INSPECTION ENGINE</span>
                  <span className="text-[#7CFF4D]">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 font-mono text-xs text-neutral-500 gap-4">
            <p>© {new Date().getFullYear()} VeriSure AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-neutral-300 cursor-pointer">PRIVACY POLICY</span>
              <span className="hover:text-neutral-300 cursor-pointer">SECURITY DISCLOSURE</span>
              <span className="hover:text-neutral-300 cursor-pointer">API DOCS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
