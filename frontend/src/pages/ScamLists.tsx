import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink, ShieldAlert, Trash2 } from "lucide-react";
import { clearScamReports, readScamReports, type ScamReport } from "../utils/scamReports";

const scamPatterns = [
  { title: "Urgent account warnings", description: "Messages that pressure you to act immediately to prevent a block, penalty, or missed refund.", signal: "Pressure tactic" },
  { title: "Fake support requests", description: "Impersonators asking for OTPs, remote access, payment details, or a small verification transfer.", signal: "Impersonation" },
  { title: "Prize and cashback claims", description: "Unexpected rewards that require a fee, a link click, or payment approval before you can receive them.", signal: "Advance-fee scam" },
];

export default function ScamLists() {
  const [reports, setReports] = useState<ScamReport[]>([]);

  useEffect(() => {
    const refresh = () => setReports(readScamReports());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("verisure:scam-report-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("verisure:scam-report-updated", refresh);
    };
  }, []);

  const stats = useMemo(() => ({
    total: reports.length,
    risks: reports.reduce((count, report) => count + report.flaggedTerms.length + report.findings.length, 0),
    highRisk: reports.filter((report) => ["HIGH", "CRITICAL"].includes(report.riskLevel)).length,
  }), [reports]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#7CFF4D]/25 bg-neutral-950/75 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex items-start gap-4"><div className="rounded-2xl border border-[#FFD84D]/30 bg-[#FFD84D]/10 p-3 text-[#FFD84D]"><BookOpen className="h-7 w-7" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7CFF4D]">Threat intelligence</p><h1 className="mt-2 text-3xl font-semibold text-white">Scam Lists</h1><p className="mt-3 max-w-2xl leading-7 text-neutral-400">A quick reference for common scam patterns and the warning signs that deserve a closer look.</p></div></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Verified scans" value={stats.total} detail="Completed analyses" icon={<CheckCircle2 />} />
        <MetricCard label="Risks found" value={stats.risks} detail="Flagged signals and findings" icon={<ShieldAlert />} />
        <MetricCard label="High-risk reports" value={stats.highRisk} detail="High or critical assessments" icon={<AlertTriangle />} />
      </section>
      <section className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div><h2 className="text-lg font-semibold text-white">Verified scan activity</h2><p className="mt-1 text-sm text-neutral-500">Reports appear here after Scam Scanner completes an analysis.</p></div>
          {reports.length > 0 && <button type="button" onClick={() => { clearScamReports(); setReports([]); }} className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 transition hover:text-red-400"><Trash2 className="h-4 w-4" /> Clear activity</button>}
        </div>
        {reports.length === 0 ? <div className="py-12 text-center text-sm text-neutral-500">No verified scans yet. Run an analysis in Scam Scanner to populate this list.</div> : <div className="mt-4 space-y-3">{reports.map((report) => <ReportRow key={report.id} report={report} />)}</div>}
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {scamPatterns.map((pattern) => <article key={pattern.title} className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-6 shadow-xl backdrop-blur-md"><div className="flex items-center justify-between"><AlertTriangle className="h-5 w-5 text-[#FFD84D]" /><span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{pattern.signal}</span></div><h2 className="mt-8 text-xl font-semibold text-white">{pattern.title}</h2><p className="mt-3 text-sm leading-6 text-neutral-400">{pattern.description}</p><button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#7CFF4D] hover:text-white">Open reference <ExternalLink className="h-4 w-4" /></button></article>)}
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-[#7CFF4D]/20 bg-neutral-950/70 p-5 shadow-xl backdrop-blur-md"><div className="flex items-center justify-between text-[#7CFF4D]"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</span>{icon}</div><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-neutral-500">{detail}</p></div>;
}

function ReportRow({ report }: { report: ScamReport }) {
  const riskClass = ["HIGH", "CRITICAL"].includes(report.riskLevel) ? "text-red-400 border-red-500/30 bg-red-500/10" : report.riskLevel === "MEDIUM" ? "text-[#FFD84D] border-[#FFD84D]/30 bg-[#FFD84D]/10" : "text-[#7CFF4D] border-[#7CFF4D]/30 bg-[#7CFF4D]/10";
  return <article className="rounded-xl border border-neutral-800 bg-black/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-neutral-500">{new Date(report.analyzedAt).toLocaleString()} · {report.source === "IMAGE_OCR" ? "Image OCR" : "Direct text"}</p><p className="mt-1 text-sm font-semibold text-white">{report.flaggedTerms.length} flagged terms · {report.findings.length} findings · {report.wordCount} words</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${riskClass}`}>{report.riskLevel} · {report.score}/100</span></div>{report.flaggedTerms.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{report.flaggedTerms.slice(0, 6).map((term) => <span key={term} className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-300">{term}</span>)}</div>}</article>;
}