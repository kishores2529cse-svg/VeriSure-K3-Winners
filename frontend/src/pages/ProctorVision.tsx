import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Sparkles,
  Cpu,
  Clock,
  Award,
  ArrowLeft
} from 'lucide-react';
import { MonacoWrapper } from '../components/compiler/MonacoWrapper';
import { ConsoleOutput } from '../components/compiler/ConsoleOutput';
import { AICameraWidget } from '../components/monitoring/AICameraWidget';
import { ExamProvider } from '../contexts/ExamContext';
import { MonitoringProvider } from '../contexts/MonitoringContext';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { useCopyPasteProtection } from '../hooks/useCopyPasteProtection';
import type { MonitoringEvent } from '../types';

// -------------------------------------------------------------
// Left Pane: Problem Description / Studio Brief
// -------------------------------------------------------------
const StudioBriefPane: React.FC = () => {
  const [problemDropdownOpen, setProblemDropdownOpen] = useState(false);

  return (
    <aside className="flex h-full w-[400px] lg:w-[440px] xl:w-[460px] shrink-0 flex-col gap-5 overflow-y-auto rounded-[24px] border border-slate-800/80 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl scrollbar-thin scrollbar-thumb-slate-800 select-text">
      {/* Top Selector Bar & Badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <button
            onClick={() => setProblemDropdownOpen(!problemDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 font-mono text-xs font-semibold text-slate-200 shadow-sm transition hover:border-slate-700 hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>101. Two Sum (Easy)</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {problemDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-2xl">
              <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Assessment Questions
              </div>
              <button
                onClick={() => setProblemDropdownOpen(false)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-500/10 flex items-center justify-between"
              >
                <span>101. Two Sum</span>
                <span className="text-[10px] text-emerald-400">Easy</span>
              </button>
              <button
                onClick={() => setProblemDropdownOpen(false)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/60 flex items-center justify-between"
              >
                <span>102. Valid Palindrome</span>
                <span className="text-[10px] text-emerald-400">Easy</span>
              </button>
              <button
                onClick={() => setProblemDropdownOpen(false)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/60 flex items-center justify-between"
              >
                <span>201. LRU Cache</span>
                <span className="text-[10px] text-amber-400">Medium</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-400">
            Easy
          </span>
          <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 font-semibold text-cyan-300">
            <Award className="h-3 w-3" />
            100 pts
          </span>
        </div>
      </div>

      {/* Studio Brief Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-cyan-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>STUDIO BRIEF</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Two Sum</h1>
      </div>

      {/* Problem Statement */}
      <div className="space-y-3 font-sans text-xs leading-relaxed text-slate-300">
        <p>
          Given an array of integers <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-cyan-300 border border-slate-800">nums</code> and an integer <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-cyan-300 border border-slate-800">target</code>, return <em>indices of the two numbers such that they add up to <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-cyan-300 border border-slate-800">target</code></em>.
        </p>
        <p>
          You may assume that each input would have <strong><em>exactly one solution</em></strong>, and you may not use the <em>same</em> element twice.
        </p>
        <p className="text-slate-400">
          You can return the answer in any order.
        </p>
      </div>

      {/* Pill Tags */}
      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
        <span className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1 text-slate-300 shadow-sm">
          Algorithms
        </span>
        <span className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1 text-slate-300 shadow-sm">
          Data Structures
        </span>
      </div>

      {/* Runtime & Time Budget Cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            <Cpu className="h-3.5 w-3.5" />
            <span>RUNTIME FOCUS</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
            Optimize for clarity and efficient execution under the given limits.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            <Clock className="h-3.5 w-3.5" />
            <span>TIME BUDGET</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
            Use the built-in console to iterate quickly and verify edge cases.
          </p>
        </div>
      </div>

      {/* Sample Examples */}
      <div className="space-y-3 pt-2">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
          SAMPLE EXAMPLES
        </h3>

        {/* Example 1 */}
        <div className="space-y-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 font-mono text-xs shadow-inner">
          <div className="text-[11px] font-bold text-slate-400">Example #1</div>
          <div className="text-slate-200">
            <span className="text-cyan-300 font-semibold">Input:</span> nums = [2,7,11,15], target = 9
          </div>
          <div className="text-slate-200">
            <span className="text-emerald-300 font-semibold">Output:</span> [0,1]
          </div>
          <p className="font-sans text-[11px] text-slate-400 italic pt-1">
            Because nums[0] + nums[1] == 9, we return [0, 1].
          </p>
        </div>

        {/* Example 2 */}
        <div className="space-y-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 font-mono text-xs shadow-inner">
          <div className="text-[11px] font-bold text-slate-400">Example #2</div>
          <div className="text-slate-200">
            <span className="text-cyan-300 font-semibold">Input:</span> nums = [3,2,4], target = 6
          </div>
          <div className="text-slate-200">
            <span className="text-emerald-300 font-semibold">Output:</span> [1,2]
          </div>
        </div>

        {/* Example 3 */}
        <div className="space-y-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 font-mono text-xs shadow-inner">
          <div className="text-[11px] font-bold text-slate-400">Example #3</div>
          <div className="text-slate-200">
            <span className="text-cyan-300 font-semibold">Input:</span> nums = [3,3], target = 6
          </div>
          <div className="text-slate-200">
            <span className="text-emerald-300 font-semibold">Output:</span> [0,1]
          </div>
        </div>
      </div>

      {/* Return to Dashboard Footer Link */}
      <div className="mt-auto pt-4 border-t border-slate-800/60">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit Assessment to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
};

// -------------------------------------------------------------
// Main Proctor Studio Interface
// -------------------------------------------------------------
const ProctorInner: React.FC = () => {
  // Wire up client-side anti-cheating and copy/paste protection
  useAntiCheating(true);
  useCopyPasteProtection({ enabled: true });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] p-3 gap-3">
      {/* Left Column: Problem Statement & Test Brief */}
      <StudioBriefPane />

      {/* Right Column: Code Editor with Floating AI Proctor + Console Output */}
      <main className="flex flex-1 flex-col gap-3 overflow-hidden min-w-0 h-full">
        {/* Top: Monaco Editor with Top-Right Floating AI Proctor Camera Widget */}
        <div className="relative flex-1 overflow-hidden rounded-[24px]">
          {/* Editor */}
          <div className="h-full w-full">
            <MonacoWrapper />
          </div>

          {/* Floating AI Vision Proctor HUD Widget (Docked Top-Right matching Image 2) */}
          <div className="pointer-events-auto absolute top-2 right-2 z-30 scale-90 origin-top-right transition-transform hover:scale-95">
            <div className="rounded-2xl border border-emerald-500/35 bg-slate-950/95 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <AICameraWidget />
            </div>
          </div>
        </div>

        {/* Bottom: Console Output Viewport */}
        <div className="h-56 shrink-0 overflow-hidden rounded-[20px]">
          <ConsoleOutput />
        </div>
      </main>
    </div>
  );
};

export default function ProctorVision() {
  const handleViolation = useCallback(async (violation: MonitoringEvent) => {
    try {
      await fetch('http://localhost:8080/api/v1/proctor/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          time: violation.timestamp,
          reason: violation.event,
          severity: violation.severity
        })
      });
    } catch (err) {
      console.error('Failed to log malpractice to backend:', err);
    }
  }, []);

  return (
    <MonitoringProvider onViolation={handleViolation}>
      <ExamProvider>
        <ProctorInner />
      </ExamProvider>
    </MonitoringProvider>
  );
}
