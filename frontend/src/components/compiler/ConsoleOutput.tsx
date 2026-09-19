import React, { useState } from 'react';
import { Terminal, CheckCircle2, XCircle, Clock, Cpu, SlidersHorizontal, AlertTriangle, Layers } from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';

export const ConsoleOutput: React.FC = () => {
  const {
    activeConsoleTab,
    setActiveConsoleTab,
    compilerResult,
    customInput,
    setCustomInput,
    isRunning,
    isSubmitting
  } = useExam();

  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);

  const isAccepted = compilerResult?.status === 'Accepted';
  const isWrongAnswer = compilerResult?.status === 'Wrong Answer';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[#FFD84D]/25 bg-neutral-950/90 shadow-2xl backdrop-blur-xl hover:border-[#7CFF4D]/35 transition-colors">
      {/* Top Header & Bar Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={() => setActiveConsoleTab('testcases')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeConsoleTab === 'testcases'
                ? 'border border-[#7CFF4D]/40 bg-[#7CFF4D]/15 text-[#7CFF4D] font-semibold shadow-[0_0_12px_rgba(124,255,77,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#7CFF4D]" />
            Test Result
            {compilerResult && (
              <span className="ml-1 rounded-full bg-neutral-900 border border-[#7CFF4D]/30 px-2 py-0.5 font-mono text-[10px] text-[#7CFF4D]">
                {compilerResult.passedTests}/{compilerResult.totalTests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveConsoleTab('output')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeConsoleTab === 'output'
                ? 'border border-[#FFD84D]/40 bg-[#FFD84D]/15 text-[#FFD84D] font-semibold shadow-[0_0_12px_rgba(255,216,77,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-[#FFD84D]" />
            Terminal Output
          </button>

          <button
            onClick={() => setActiveConsoleTab('input')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeConsoleTab === 'input'
                ? 'border border-[#A3FF1A]/40 bg-[#A3FF1A]/15 text-[#A3FF1A] font-semibold shadow-[0_0_12px_rgba(163,255,26,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#A3FF1A]" />
            Custom Testcase
          </button>
        </div>

        {/* Execution Metrics (Runtime & Memory) - 50% Green, 50% Yellow */}
        {compilerResult && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-[#7CFF4D]">
              <Clock className="h-3 w-3 text-[#7CFF4D]" /> {compilerResult.executionTimeMs} ms
            </span>
            <span className="flex items-center gap-1 text-[#FFD84D]">
              <Cpu className="h-3 w-3 text-[#FFD84D]" /> {(compilerResult.memoryKb / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      {/* Main Terminal Viewport */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-200">
        {isRunning || isSubmitting ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center font-sans text-slate-400">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7CFF4D] border-t-transparent" />
            <span className="text-sm font-medium text-slate-300">
              {isSubmitting ? 'Evaluating code against testcases in sandbox…' : 'Compiling code…'}
            </span>
          </div>
        ) : activeConsoleTab === 'testcases' ? (
          <div className="space-y-4 font-sans">
            {compilerResult ? (
              <>
                {/* LeetCode Result Verdict Banner */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-sm font-bold tracking-wide shadow-sm ${
                        isAccepted
                          ? 'border border-[#7CFF4D]/30 bg-[#7CFF4D]/15 text-[#7CFF4D]'
                          : isWrongAnswer
                          ? 'border border-rose-500/30 bg-rose-500/15 text-rose-300'
                          : 'border border-[#FFD84D]/30 bg-[#FFD84D]/15 text-[#FFD84D]'
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 className="h-4 w-4 text-[#7CFF4D]" />
                      ) : isWrongAnswer ? (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-[#FFD84D]" />
                      )}
                      {compilerResult.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Passed {compilerResult.passedTests} of {compilerResult.totalTests} test cases
                    </span>
                  </div>
                </div>

                {/* Test Case Selector Tabs */}
                {compilerResult.testDetails && compilerResult.testDetails.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                      {compilerResult.testDetails.map((t: any, idx: number) => (
                        <button
                          key={t.testId}
                          onClick={() => setSelectedTestCaseIndex(idx)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                            selectedTestCaseIndex === idx
                              ? 'bg-neutral-800 text-white shadow-sm border border-[#7CFF4D]/40 text-[#7CFF4D]'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              t.passed ? 'bg-[#7CFF4D]' : 'bg-rose-400'
                            }`}
                          />
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Selected Test Case Details */}
                    {compilerResult.testDetails[selectedTestCaseIndex] && (
                      <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                        <div>
                          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Input
                          </div>
                          <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 font-mono text-xs text-slate-200">
                            {compilerResult.testDetails[selectedTestCaseIndex].input}
                          </pre>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Output
                            </div>
                            <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 font-mono text-xs text-[#7CFF4D]">
                              {compilerResult.testDetails[selectedTestCaseIndex].actualOutput}
                            </pre>
                          </div>
                          <div>
                            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Expected
                            </div>
                            <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 font-mono text-xs text-[#FFD84D]">
                              {compilerResult.testDetails[selectedTestCaseIndex].expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 text-center text-slate-400">
                <Layers className="h-8 w-8 text-[#7CFF4D]/40" />
                <span className="text-sm font-medium text-slate-200">No test results yet</span>
                <p className="max-w-xs text-xs text-slate-400">
                  Click <strong className="text-[#7CFF4D]">Run</strong> or <strong className="text-[#FFD84D]">Submit</strong> to execute your code in the sandbox.
                </p>
              </div>
            )}
          </div>
        ) : activeConsoleTab === 'output' ? (
          <div className="space-y-3 font-mono">
            {compilerResult ? (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Standard Console Output (stdout / stderr)
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-[#7CFF4D] shadow-inner">
                  {compilerResult.stdout || compilerResult.stderr || 'Code executed with no output streams.'}
                </pre>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-center text-slate-400">
                Console output and execution logs will appear here after running code.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 font-sans">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Custom Input Buffer
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              rows={5}
              placeholder="Enter custom input parameters..."
              className="w-full resize-none rounded-2xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-slate-100 shadow-inner focus:border-[#7CFF4D] focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

