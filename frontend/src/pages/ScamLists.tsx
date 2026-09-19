import { AlertTriangle, BookOpen, ExternalLink } from "lucide-react";

const scamPatterns = [
  { title: "Urgent account warnings", description: "Messages that pressure you to act immediately to prevent a block, penalty, or missed refund.", signal: "Pressure tactic" },
  { title: "Fake support requests", description: "Impersonators asking for OTPs, remote access, payment details, or a small verification transfer.", signal: "Impersonation" },
  { title: "Prize and cashback claims", description: "Unexpected rewards that require a fee, a link click, or payment approval before you can receive them.", signal: "Advance-fee scam" },
];

export default function ScamLists() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300"><BookOpen className="h-7 w-7" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Threat intelligence</p><h1 className="mt-2 text-3xl font-semibold text-slate-100">Scam Lists</h1><p className="mt-3 max-w-2xl leading-7 text-slate-400">A quick reference for common scam patterns and the warning signs that deserve a closer look.</p></div></div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {scamPatterns.map((pattern) => <article key={pattern.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between"><AlertTriangle className="h-5 w-5 text-amber-300" /><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{pattern.signal}</span></div><h2 className="mt-8 text-xl font-semibold text-slate-100">{pattern.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{pattern.description}</p><button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200">Open reference <ExternalLink className="h-4 w-4" /></button></article>)}
      </section>
    </div>
  );
}