import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, CircleAlert, Clock3, FileWarning, Loader2, LockKeyhole, Search, ShieldCheck, Sparkles, XCircle } from 'lucide-react';

interface UpiResponse {
  upi_id: string;
  format_valid: boolean;
  upi_valid: boolean;
  beneficiary_name: string;
  reported: boolean;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_factors: string[];
  provider: string;
}

const upiPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{1,254}@[A-Za-z0-9][A-Za-z0-9.-]{1,63}$/;
const steps = ['Format check', 'UPI address lookup', 'Risk report'];

function riskColor(level: UpiResponse['risk_level']) {
  if (level === 'HIGH') return { text: 'text-rose-700', fill: 'bg-rose-500', soft: 'bg-rose-50', border: 'border-rose-200' };
  if (level === 'MEDIUM') return { text: 'text-amber-700', fill: 'bg-amber-400', soft: 'bg-amber-50', border: 'border-amber-200' };
  return { text: 'text-emerald-700', fill: 'bg-emerald-500', soft: 'bg-emerald-50', border: 'border-emerald-200' };
}

export default function UpiGuard() {
  const [upiId, setUpiId] = useState('');
  const [result, setResult] = useState<UpiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [error, setError] = useState('');

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = upiId.trim();
    setError('');
    setResult(null);
    if (!upiPattern.test(normalized)) {
      setError('Enter a valid UPI ID in the format name@bank.');
      return;
    }
    setLoading(true);
    setActiveStep(0);
    const stepTimer = window.setInterval(() => setActiveStep((step) => Math.min(step + 1, steps.length - 1)), 650);
    try {
      const response = await fetch('/api/verify-upi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ upi_id: normalized }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Verification could not be completed.');
      setResult(payload);
      setActiveStep(steps.length);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Verification could not be completed.');
    } finally {
      window.clearInterval(stepTimer);
      setLoading(false);
    }
  };

  const colors = result ? riskColor(result.risk_level) : null;
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#102a43] px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[32px] border-cyan-300/10" /><div className="relative max-w-2xl"><div className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-wide text-cyan-200"><ShieldCheck size={17} /> UPI TRUST CHECK</div><h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">Know who is on the other side of your payment.</h1><p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Check a UPI address against available verification and fraud-report signals before you pay.</p></div></section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.18em] text-slate-400">START HERE</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Verify a UPI ID</h2></div><div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Search size={22} /></div></div><form onSubmit={handleVerify}><label htmlFor="upi-id" className="text-sm font-semibold text-slate-700">UPI address</label><div className={`mt-2 flex items-center rounded-2xl border bg-slate-50 px-4 transition focus-within:ring-4 focus-within:ring-cyan-100 ${error ? 'border-rose-300' : 'border-slate-200'}`}><span className="text-slate-400">@</span><input id="upi-id" value={upiId} onChange={(event) => { setUpiId(event.target.value); setError(''); }} placeholder="example@bank" className="w-full bg-transparent px-3 py-4 text-base text-slate-900 outline-none placeholder:text-slate-400" autoComplete="off" /></div>{error && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-700"><XCircle size={16} /> {error}</p>}<button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-4 font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-70">{loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}{loading ? 'Checking address...' : 'Verify UPI ID'}{!loading && <ArrowUpRight size={17} />}</button></form><div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><div className="flex items-center gap-2 font-bold"><LockKeyhole size={16} /> We never ask for your UPI PIN or OTP.</div><p className="mt-1 text-amber-800/80">Only enter the public UPI address. Never share payment credentials here.</p></div>{loading && <div className="mt-8 space-y-4" aria-live="polite">{steps.map((step, index) => <div key={step} className={`flex items-center gap-3 text-sm ${index <= activeStep ? 'text-slate-800' : 'text-slate-400'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full ${index < activeStep ? 'bg-emerald-100 text-emerald-700' : index === activeStep ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100'}`}>{index < activeStep ? <Check size={15} /> : index === activeStep ? <Loader2 size={15} className="animate-spin" /> : <Clock3 size={15} />}</span>{step}</div>)}</div>}</section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-live="polite">{!result && !loading && <div className="flex min-h-[430px] flex-col items-center justify-center text-center"><div className="rounded-3xl bg-slate-100 p-5 text-slate-400"><Sparkles size={32} /></div><h2 className="mt-6 text-xl font-semibold text-slate-800">Your verification report will appear here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">We will show the address status, beneficiary name, reports, and the reasons behind the risk level.</p></div>}{loading && <div className="flex min-h-[430px] flex-col items-center justify-center text-center"><Loader2 size={38} className="animate-spin text-cyan-600" /><p className="mt-5 font-semibold text-slate-800">Building your report</p><p className="mt-2 text-sm text-slate-500">Checking multiple trust signals...</p></div>}{result && colors && <div><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6"><div><p className="text-xs font-bold tracking-[0.18em] text-slate-400">VERIFICATION REPORT</p><h2 className="mt-2 break-all text-2xl font-semibold text-slate-900">{result.upi_id}</h2></div><div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${colors.soft} ${colors.text}`}><span className={`h-2.5 w-2.5 rounded-full ${colors.fill}`} /> {result.risk_level} RISK</div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><StatusRow ok={result.format_valid && result.upi_valid} icon={<CheckCircle2 size={19} />} title="UPI address validated" detail={result.upi_valid ? 'Provider accepted this address.' : 'Provider could not validate it.'} /><StatusRow ok={Boolean(result.beneficiary_name)} icon={<ShieldCheck size={19} />} title={result.beneficiary_name ? `Beneficiary: ${result.beneficiary_name}` : 'Beneficiary unavailable'} detail="Bank-registered name when returned by provider." /><StatusRow ok={!result.reported} icon={result.reported ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />} title={result.reported ? 'Reports found' : 'No available reports found'} detail="Report databases are not exhaustive." /><div className={`rounded-2xl border p-4 ${colors.soft} ${colors.border}`}><p className="text-xs font-bold tracking-wide text-slate-500">RISK SCORE</p><div className="mt-2 flex items-end gap-2"><span className={`text-4xl font-bold ${colors.text}`}>{result.risk_score}</span><span className="mb-1 text-sm text-slate-500">/ 100</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80"><div className={`h-full rounded-full ${colors.fill}`} style={{ width: `${result.risk_score}%` }} /></div></div></div><div className="mt-7 rounded-2xl bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileWarning size={17} className="text-cyan-700" /> Why this result?</div><ul className="mt-4 space-y-3">{result.risk_factors.map((factor) => <li key={factor} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />{factor}</li>)}</ul></div><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-400">Source: {result.provider}</p><a href={`mailto:reports@verisure.local?subject=Suspicious UPI ID ${encodeURIComponent(result.upi_id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700"><AlertTriangle size={16} /> Report Suspicious UPI ID</a></div><p className="mt-5 text-xs leading-5 text-slate-400">A validated address is not proof that a payment is safe. No available reports does not guarantee that a UPI ID is genuine.</p></div>}</section>
      </div>
    </div>
  );
}

function StatusRow({ ok, icon, title, detail }: { ok: boolean; icon: ReactNode; title: string; detail: string }) { return <div className={`rounded-2xl border p-4 ${ok ? 'border-emerald-100 bg-emerald-50/70' : 'border-rose-100 bg-rose-50/70'}`}><div className={`flex items-center gap-2 text-sm font-semibold ${ok ? 'text-emerald-800' : 'text-rose-800'}`}>{icon}{title}</div><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>; }