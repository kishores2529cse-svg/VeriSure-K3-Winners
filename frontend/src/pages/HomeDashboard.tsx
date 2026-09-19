import { ArrowUpRight, BookOpen, Bug, Camera, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  {
    title: "Scam Scanner",
    description: "Analyze suspicious messages, links, and code for patterns commonly used in phishing and online fraud.",
    href: "/scam-scanner",
    icon: Bug,
    label: "Investigate a scam",
    accent: "border-[#7CFF4D]/25 bg-neutral-950/60 text-[#7CFF4D] hover:border-[#7CFF4D]/60 hover:shadow-[0_0_30px_rgba(124,255,77,0.12)]",
    iconBackground: "bg-[#7CFF4D]/10 text-[#7CFF4D]",
  },
  {
    title: "Proctor Vision",
    description: "Monitor assessment sessions with computer vision signals designed to highlight unusual activity in real time.",
    href: "/proctor",
    icon: Camera,
    label: "Open proctoring",
    accent: "border-[#7CFF4D]/25 bg-neutral-950/60 text-[#7CFF4D] hover:border-[#7CFF4D]/60 hover:shadow-[0_0_30px_rgba(124,255,77,0.12)]",
    iconBackground: "bg-[#7CFF4D]/10 text-[#7CFF4D]",
  },
  {
    title: "Scam Lists",
    description: "Browse reported scam patterns and known indicators so your team can recognize threats before they spread.",
    href: "/scam-lists",
    icon: BookOpen,
    label: "Browse scam lists",
    accent: "border-[#FFD84D]/30 bg-neutral-950/60 text-[#FFD84D] hover:border-[#FFD84D]/60 hover:shadow-[0_0_30px_rgba(255,216,77,0.12)]",
    iconBackground: "bg-[#FFD84D]/10 text-[#FFD84D]",
  },
];

export default function HomeDashboard() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[#7CFF4D]/25 bg-neutral-950/75 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        <div className="absolute inset-0 bg-[#7CFF4D]/[0.03]" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#7CFF4D] drop-shadow-md">
            <ShieldCheck className="h-5 w-5" /> Security workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-lg sm:text-4xl">Choose a protection tool</h1>
          <p className="mt-3 text-base leading-7 text-slate-200 drop-shadow-md">Start with the workflow that matches the risk in front of you. Each tool opens a focused workspace for investigation, monitoring, or threat intelligence.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} to={tool.href} className={`group flex min-h-[300px] flex-col rounded-2xl border p-6 transition duration-200 hover:-translate-y-1 hover:border-slate-500 hover:shadow-2xl hover:shadow-black/20 ${tool.accent}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tool.iconBackground}`}><Icon className="h-7 w-7 text-red-400" /></div>
              <div className="mt-8 flex-1"><h2 className="text-2xl font-semibold text-black">{tool.title}</h2><p className="mt-3 text-sm leading-6 text-white">{tool.description}</p></div>
              <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-4 text-sm font-semibold text-white"><span>{tool.label}</span><ArrowUpRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
