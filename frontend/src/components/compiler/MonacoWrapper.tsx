import React from 'react';
import Editor from '@monaco-editor/react';
import { Check, RotateCcw, Copy, Sparkles } from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';
import type { SupportedLanguage } from '../../types';

export const MonacoWrapper: React.FC = React.memo(() => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    codeMap,
    setCodeForLang,
    autoSaveStatus
  } = useExam();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
  };

  const languageOptions: Array<{ value: SupportedLanguage; label: string; short: string }> = [
    { value: 'go', label: 'Go (1.22)', short: 'Go' },
    { value: 'python', label: 'Python 3.11', short: 'Py' },
    { value: 'javascript', label: 'JavaScript', short: 'JS' },
    { value: 'typescript', label: 'TypeScript', short: 'TS' },
    { value: 'cpp', label: 'C++20', short: 'C++' },
    { value: 'java', label: 'Java 21', short: 'Java' },
    { value: 'rust', label: 'Rust', short: 'Rust' },
    { value: 'csharp', label: 'C#', short: 'C#' }
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeMap[selectedLanguage]);
  };

  const handleReset = () => {
    const current = codeMap[selectedLanguage];
    if (current && current.trim()) {
      setCodeForLang('');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#7CFF4D]/25 bg-[#050a0e] shadow-[0_24px_100px_rgba(0,0,0,0.75)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-[#7CFF4D]/20 bg-neutral-950/90 px-4 py-2.5 font-sans">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[#7CFF4D]/35 bg-gradient-to-r from-[#7CFF4D]/15 via-[#A3FF1A]/10 to-[#FFD84D]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="h-3.5 w-3.5 text-[#7CFF4D]" />
            <span className="bg-gradient-to-r from-[#7CFF4D] via-[#A3FF1A] to-[#FFD84D] bg-clip-text text-transparent">Studio</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950/90 p-1 text-xs">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleLanguageChange(option.value)}
                className={`rounded-lg px-2.5 py-1 font-mono transition-all ${
                  selectedLanguage === option.value
                    ? 'border border-[#7CFF4D]/50 bg-gradient-to-r from-[#7CFF4D]/20 to-[#FFD84D]/20 text-[#7CFF4D] font-bold shadow-[0_0_12px_rgba(124,255,77,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900/50'
                }`}
              >
                {option.short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-lg border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 px-2.5 py-1 text-[11px] font-mono text-[#7CFF4D]">
            <Check className="h-3.5 w-3.5 text-[#7CFF4D]" />
            {autoSaveStatus}
          </span>
          <button
            onClick={handleCopy}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-slate-400 transition hover:border-[#FFD84D]/40 hover:text-[#FFD84D]"
            title="Copy code"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-slate-400 transition hover:border-[#FFD84D]/40 hover:text-[#FFD84D]"
            title="Reset snippet"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[350px] w-full">
        <Editor
          height="100%"
          language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
          theme="vs-dark"
          value={codeMap[selectedLanguage]}
          onChange={(val) => setCodeForLang(val || '')}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
            wordWrap: 'on'
          }}
        />
      </div>
    </div>
  );
});
