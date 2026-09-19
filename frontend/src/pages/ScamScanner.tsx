import React, { useState, useMemo, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  FileSearch,
  Zap,
  Info,
  ChevronRight,
  Terminal,
  Layers,
  ClipboardPaste,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
  Cpu,
  ArrowRight,
  TrendingUp,
  Award,
  DollarSign,
} from "lucide-react";

interface ScamFinding {
  matched_term: string;
  weight: number;
  rationale: string;
  category: string;
}

interface ParsedSalary {
  currency: string;
  amount?: number;
  min_amount?: number;
  max_amount?: number;
  period: string;
  normalized_annual_min: number;
  normalized_annual_max: number;
  normalized_annual_avg: number;
  raw_text: string;
  is_anomalous: boolean;
  anomaly_reason?: string;
  risk_contribution: number;
}

interface SignalBreakdown {
  category: string;
  score_impact: number;
  description: string;
}

interface AnalysisResult {
  score: number;
  risk_level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  flagged_terms: string[];
  rationale: string[];
  findings: ScamFinding[];
  signal_breakdown?: SignalBreakdown[];
  legitimacy_signals?: string[];
  parsed_salary?: ParsedSalary;
  analyzed_at: string;
  word_count: number;
  source: "DIRECT_TEXT" | "IMAGE_OCR";
  ocr_confidence?: number;
  image_preview?: string;
}

const SAMPLE_TEXT_PRESETS = [
  {
    title: "💵 US High-Salary Task Scam (USD)",
    tag: "USD Task Scam",
    content: `Urgent Hiring! Work from Home Data Entry Operator.
Earn $100,000/year with no experience required.
Guaranteed direct placement without interview.
Candidates must pay a refundable onboarding security deposit of $350 before kit delivery.
Contact HR on Telegram: @us_recruitment_hub`,
  },
  {
    title: "🚨 Fake Job with Upfront Fee",
    tag: "Advance Fee Job",
    content: `Urgent Requirement! International Data Corp is hiring candidates immediately.
Position: Operations Lead.
No experience required for manager role! Work from home ₹50,000 per month guaranteed.
To proceed with onboarding and background check, candidates must deposit a refundable registration fee of ₹2,500.
Please pay upfront through our portal. Contact HR on telegram: @hr_recruit_direct to get your employee kit.`,
  },
  {
    title: "⚠️ Marketplace Fraud Listing",
    tag: "Marketplace Scam",
    content: `Selling brand new iPhone 15 Pro Max 256GB sealed in box for just ₹35,000 due to urgent relocation.
Free shipping across India.
Due to bank server maintenance, do not use the app checkout.
Send money to this alternate number (+91 9876543210) via GPay to confirm booking immediately.
Once sent, share screenshot on whatsapp for tracking ID dispatch.`,
  },
  {
    title: "✅ Legitimate Corporate Job",
    tag: "Legitimate Job",
    content: `Senior Frontend Engineer - VeriSure Core Team
We are seeking an experienced React and TypeScript developer with 3+ years of production experience.
Key Responsibilities:
- Build accessible, high-performance dashboards and data visualization tools.
- Collaborate with backend engineers developing Go microservices.
- Write unit and integration tests, conduct code reviews.
Requirements: Strong proficiency in modern JavaScript/TypeScript, Tailwind CSS, and REST API integrations. Bachelor's degree in Computer Science.
Apply through our official careers portal at careers.company.com.
Note: We never ask for any money or registration fee at any stage of our interview process.`,
  },
];

export default function ScamScanner() {
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXT_PRESETS[0].content);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStage, setOcrStage] = useState<string>("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"highlighted" | "breakdown" | "findings" | "image_preview">("highlighted");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => {
    const textToCount = inputMode === "text" ? inputText : ocrExtractedText;
    return textToCount.trim() ? textToCount.trim().split(/\s+/).length : 0;
  }, [inputMode, inputText, ocrExtractedText]);

  const charCount = useMemo(() => {
    return inputMode === "text" ? inputText.length : ocrExtractedText.length;
  }, [inputMode, inputText, ocrExtractedText]);

  const executeScamAnalysis = async (
    textToAnalyze: string,
    source: "DIRECT_TEXT" | "IMAGE_OCR",
    confidence?: number,
    previewImg?: string
  ) => {
    const cleaned = textToAnalyze.trim();
    if (!cleaned) {
      setError("No readable text provided for analysis.");
      return;
    }

    setLoading(true);
    setAnalysisStage("Analyzing signals with Multi-Signal Detection Engine...");
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/api/v1/scams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: cleaned }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
      }

      setAnalysisStage("Aggregating threat scores and evidence...");
      const rawData = await response.json();

      const normalizedResult: AnalysisResult = {
        score: rawData.score ?? 0,
        risk_level: rawData.risk_level ?? "SAFE",
        flagged_terms: Array.isArray(rawData.flagged_terms) ? rawData.flagged_terms : [],
        rationale: Array.isArray(rawData.rationale) ? rawData.rationale : [],
        findings: Array.isArray(rawData.findings) ? rawData.findings : [],
        signal_breakdown: Array.isArray(rawData.signal_breakdown) ? rawData.signal_breakdown : [],
        legitimacy_signals: Array.isArray(rawData.legitimacy_signals) ? rawData.legitimacy_signals : [],
        parsed_salary: rawData.parsed_salary ?? undefined,
        analyzed_at: rawData.analyzed_at ?? new Date().toISOString(),
        word_count: rawData.word_count ?? 0,
        source,
        ocr_confidence: confidence,
        image_preview: previewImg,
      };

      setResult(normalizedResult);
      setActiveTab("highlighted");
    } catch (err: any) {
      console.error("Scam analysis error:", err);
      setError(
        err.message || "Failed to reach backend server. Please verify backend is running on :8080"
      );
    } finally {
      setLoading(false);
      setAnalysisStage("");
    }
  };

  const processImageOCR = useCallback(async (imageFile: File | string, previewUrl: string) => {
    setOcrLoading(true);
    setOcrProgress(0);
    setOcrStage("Initializing OCR Engine...");
    setError(null);
    setResult(null);

    try {
      const ocrResult = await Tesseract.recognize(imageFile, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null) {
            const pct = Math.round(m.progress * 100);
            setOcrProgress(pct);
            setOcrStage(`Extracting text from image (${pct}%)...`);
          } else if (m.status) {
            const formatted = m.status.replace(/_/g, " ");
            setOcrStage(`${formatted.charAt(0).toUpperCase() + formatted.slice(1)}...`);
          }
        },
      });

      const extracted = (ocrResult.data.text || "").trim();
      const confidence = Math.round(ocrResult.data.confidence || 0);

      if (!extracted || extracted.length < 5) {
        throw new Error(
          "No readable text was detected in this image. Please upload a clearer screenshot with visible text."
        );
      }

      setOcrExtractedText(extracted);
      setOcrConfidence(confidence);
      setOcrStage("Text extracted successfully");

      await executeScamAnalysis(extracted, "IMAGE_OCR", confidence, previewUrl);
    } catch (err: any) {
      console.error("OCR Extraction failed:", err);
      setError(err.message || "Failed to extract text from image. Please try a different screenshot.");
    } finally {
      setOcrLoading(false);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image file is too large (max 10MB). Please select a smaller screenshot.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreviewUrl(previewUrl);
    processImageOCR(file, previewUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setOcrExtractedText("");
    setOcrConfidence(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLoadDemoScamScreenshot = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 460;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#dc2626";
    ctx.fillRect(40, 30, 280, 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("URGENT JOB OPPORTUNITY!", 50, 54);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Work From Home - Operations Lead", 40, 110);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("No Experience Required for Manager Role", 40, 150);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Earn ₹50,000 per month guaranteed.", 40, 195);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "18px sans-serif";
    ctx.fillText("To complete registration, candidates must pay", 40, 245);
    ctx.fillText("a refundable registration fee of ₹2,500.", 40, 275);
    ctx.fillText("Please pay upfront through portal.", 40, 305);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 19px sans-serif";
    ctx.fillText("Contact HR on Telegram immediately: @hr_direct_recruitment", 40, 360);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "demo_fake_job_screenshot.png", { type: "image/png" });
        const previewUrl = URL.createObjectURL(file);
        setSelectedImage(file);
        setImagePreviewUrl(previewUrl);
        setInputMode("image");
        processImageOCR(file, previewUrl);
      }
    }, "image/png");
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (inputMode === "text") {
          setInputText(text);
        } else {
          setOcrExtractedText(text);
        }
        setResult(null);
        setError(null);
      }
    } catch {
      // Clipboard fallback
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const findings = result.findings || [];
    const flagged = result.flagged_terms || [];
    const breakdowns = result.signal_breakdown || [];
    const sourceLabel =
      result.source === "IMAGE_OCR"
        ? `🖼️ Image → OCR → Text Analysis (OCR Confidence: ${result.ocr_confidence ?? "N/A"}%)`
        : "📝 Direct Text Input";

    const summary = `🛡️ VeriSure Multi-Signal Scam Audit Report
Source: ${sourceLabel}
Risk Score: ${result.score}/100 [${result.risk_level} RISK]
Flagged Terms: ${flagged.join(", ") || "None"}

Risk Signal Breakdown:
${breakdowns.map((b) => `• ${b.category}: ${b.score_impact > 0 ? `+${b.score_impact}` : b.score_impact} pts - ${b.description}`).join("\n")}

Detailed Findings & Rationales:
${
  findings.length > 0
    ? findings
        .map(
          (f, i) =>
            `${i + 1}. [${f.category}] "${f.matched_term}" (+${f.weight} pts) - ${f.rationale}`
        )
        .join("\n")
    : "No malicious phrases or scam indicators detected."
}
Timestamp: ${new Date(result.analyzed_at).toLocaleString()}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedDocument = () => {
    const currentText = inputMode === "text" ? inputText : ocrExtractedText;
    const flagged = result?.flagged_terms || [];

    if (!result || flagged.length === 0) {
      return (
        <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
          {currentText}
        </div>
      );
    }

    const escapedTerms = flagged
      .filter((term) => term && term.trim().length > 0)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);

    if (escapedTerms.length === 0) {
      return (
        <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
          {currentText}
        </div>
      );
    }

    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const parts = currentText.split(regex);

    return (
      <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap select-text">
        {parts.map((part, index) => {
          const isFlagged = flagged.some(
            (term) => term.toLowerCase() === part.toLowerCase()
          );

          if (isFlagged) {
            return (
              <mark
                key={index}
                className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded font-bold text-red-100 bg-red-500/40 border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all hover:bg-red-500/60"
                title={`Flagged Trigger Phrase: "${part}"`}
              >
                <span>{part}</span>
                <span className="ml-1 text-[9px] bg-red-600 text-white rounded px-1 uppercase tracking-wider font-sans font-semibold">
                  FLAGGED
                </span>
              </mark>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const getScoreTheme = (score: number) => {
    if (score >= 75) {
      return {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        badge: "bg-red-500/20 text-red-300 border-red-500/40",
        bar: "bg-gradient-to-r from-orange-500 to-red-500",
      };
    }
    if (score >= 50) {
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        bar: "bg-gradient-to-r from-yellow-500 to-amber-500",
      };
    }
    if (score >= 25) {
      return {
        text: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
        bar: "bg-gradient-to-r from-teal-500 to-yellow-500",
      };
    }
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      bar: "bg-gradient-to-r from-teal-500 to-emerald-500",
    };
  };

  const findingsCount = result?.findings?.length || 0;
  const isBusy = loading || ocrLoading;

  return (
    <div className="space-y-6 flex flex-col">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Scam Scanner & Listing Audit</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                  Multi-Signal Heuristic Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generalizing fraud analysis using semantic category extraction, combinatorial scoring, and legitimacy dampeners
              </p>
            </div>
          </div>
        </div>

        {/* Input Mode Switcher & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setInputMode("text");
                setError(null);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                inputMode === "text"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
            <button
              onClick={() => {
                setInputMode("image");
                setError(null);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                inputMode === "image"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Image (OCR)</span>
            </button>
          </div>

          {inputMode === "text" ? (
            SAMPLE_TEXT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(preset.content);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition active:scale-95 cursor-pointer"
              >
                {preset.tag}
              </button>
            ))
          ) : (
            <button
              onClick={handleLoadDemoScamScreenshot}
              className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-amber-500/20 hover:from-red-500/30 hover:to-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95 flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Scam Screenshot</span>
            </button>
          )}
        </div>
      </div>

      {/* Analysis Pipeline Flow Visualizer */}
      {result && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">SOURCE:</span>
            {result.source === "IMAGE_OCR" ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <ImageIcon className="w-3 h-3 mr-1" />
                <span>Image → OCR → Multi-Signal Engine</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                <FileText className="w-3 h-3 mr-1" />
                <span>Direct Text Analysis</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="text-slate-300 font-semibold">Engine:</span>
            <span>Feature Extraction</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-amber-300">Semantic Signals</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400">Combinatorial Aggregator</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-red-400 font-bold">Threat: {result.score}/100</span>
          </div>
        </div>
      )}

      {/* Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Input (Text or Image Dropzone) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <div className="flex items-center text-xs font-mono text-slate-400">
                  <Terminal className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <span>
                    {inputMode === "text"
                      ? "job_or_listing_input.txt"
                      : "ocr_extracted_document.txt"}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {inputMode === "text" ? (
                  <>
                    <button
                      onClick={handlePasteClipboard}
                      title="Paste from clipboard"
                      className="px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Paste</span>
                    </button>
                    <button
                      onClick={() => {
                        setInputText("");
                        setResult(null);
                        setError(null);
                      }}
                      title="Clear input"
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  selectedImage && (
                    <button
                      onClick={handleRemoveImage}
                      title="Remove image"
                      className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Input Content Area */}
            {inputMode === "text" ? (
              <div className="relative flex min-h-[380px] bg-slate-950/60">
                <div className="w-10 py-4 bg-slate-950/90 border-r border-slate-800/60 text-slate-600 font-mono text-xs select-none text-right pr-2 hidden sm:block">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste any job posting, recruitment message, social media ad, or freelance listing here..."
                  className="flex-1 w-full bg-transparent p-4 font-mono text-sm leading-6 text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="p-4 space-y-4 bg-slate-950/60 min-h-[380px] flex flex-col justify-between">
                {!selectedImage ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[260px] ${
                      isDragOver
                        ? "border-amber-400 bg-amber-500/10 scale-[0.99]"
                        : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelection(e.target.files[0]);
                        }
                      }}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 mb-3 shadow-inner">
                      <Upload className="w-8 h-8 animate-bounce" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      Click to upload or drag & drop screenshot
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PNG, JPG, JPEG, or WEBP (Max 10MB)
                    </p>
                    <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      <span>Automatic In-Browser OCR Text Extraction</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center space-x-3">
                        {imagePreviewUrl && (
                          <img
                            src={imagePreviewUrl}
                            alt="Screenshot Preview"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                            {selectedImage.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {(selectedImage.size / 1024).toFixed(1)} KB • Image OCR Ready
                          </p>
                        </div>
                      </div>

                      {ocrConfidence !== null && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            OCR Confidence: {ocrConfidence}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-1">
                        <span className="font-mono text-[11px] text-amber-300 flex items-center">
                          <FileText className="w-3 h-3 mr-1" /> OCR EXTRACTED TEXT (EDITABLE):
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Edit text if needed before re-analyzing
                        </span>
                      </div>
                      <textarea
                        value={ocrExtractedText}
                        onChange={(e) => setOcrExtractedText(e.target.value)}
                        placeholder="OCR extracted text will appear here..."
                        className="w-full flex-1 min-h-[160px] p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs leading-relaxed text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Metrics */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
              <div className="flex space-x-4">
                <span>WORDS: {wordCount}</span>
                <span>CHARS: {charCount}</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                {inputMode === "text" ? "UTF-8 Direct Input" : "Tesseract.js OCR Layer"}
              </span>
            </div>
          </div>

          {/* OCR Progress Status Bar */}
          {ocrLoading && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center">
                  <Cpu className="w-4 h-4 mr-1.5 animate-spin text-amber-400" />
                  {ocrStage || "Extracting text from image..."}
                </span>
                <span className="font-mono font-bold">{ocrProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Analyze Button */}
          <button
            onClick={() => {
              if (inputMode === "text") {
                executeScamAnalysis(inputText, "DIRECT_TEXT");
              } else {
                executeScamAnalysis(
                  ocrExtractedText,
                  "IMAGE_OCR",
                  ocrConfidence ?? undefined,
                  imagePreviewUrl ?? undefined
                );
              }
            }}
            disabled={
              isBusy ||
              (inputMode === "text" ? !inputText.trim() : !ocrExtractedText.trim())
            }
            className="w-full relative group overflow-hidden rounded-xl p-0.5 font-semibold text-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.99] cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-500 to-amber-600 rounded-xl" />
            <div className="relative px-6 py-3.5 rounded-[10px] bg-slate-950/60 group-hover:bg-slate-950/30 transition duration-200 flex items-center justify-center space-x-2 text-sm font-medium">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{analysisStage || "Evaluating Multi-Signal Matrix..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {inputMode === "text"
                      ? "Analyze Posting for Fraud Signals"
                      : "Analyze Extracted Text with Multi-Signal Engine"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition" />
                </>
              )}
            </div>
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Analysis Notice</p>
                <p className="mt-0.5 text-slate-400 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Audit Report, Signal Breakdown & Document Highlighter */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {result ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden flex flex-col">
              {/* Calculated Score Banner */}
              {(() => {
                const theme = getScoreTheme(result.score);
                return (
                  <div className={`p-6 border-b border-slate-800 ${theme.bg}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs uppercase font-mono font-semibold tracking-wider text-slate-400">
                          Multi-Signal Threat Score
                        </span>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span
                            className={`text-5xl font-black font-mono tracking-tight ${theme.text}`}
                          >
                            {result.score}
                          </span>
                          <span className="text-slate-500 font-mono text-sm">/ 100</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${theme.badge}`}
                        >
                          {result.risk_level} RISK
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {findingsCount} Flagged Term(s)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-slate-950/80 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${theme.bar}`}
                          style={{ width: `${Math.max(result.score, 4)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-0.5">
                        <span>0 Safe</span>
                        <span>25 Low</span>
                        <span>50 Moderate</span>
                        <span>75 Critical Fraud</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              
              {/* Structured Compensation Audit Banner (if detected) */}
              {result.parsed_salary && (
                <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">
                          Extracted Salary: {result.parsed_salary.raw_text}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                          {result.parsed_salary.currency} • {result.parsed_salary.period}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Annualized: {result.parsed_salary.currency}{" "}
                        {result.parsed_salary.normalized_annual_avg.toLocaleString()} / year
                      </p>
                    </div>
                  </div>

                  <div>
                    {result.parsed_salary.is_anomalous ? (
                      <span className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>Anomaly (+{result.parsed_salary.risk_contribution} pts)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Market Aligned (0 pts)</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* View Switcher Tabs */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setActiveTab("highlighted")}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
                      activeTab === "highlighted"
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>Highlighter</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("breakdown")}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
                      activeTab === "breakdown"
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Signal Breakdown</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("findings")}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
                      activeTab === "findings"
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Rationales ({findingsCount})</span>
                  </button>
                  {result.image_preview && (
                    <button
                      onClick={() => setActiveTab("image_preview")}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
                        activeTab === "image_preview"
                          ? "bg-slate-800 text-white border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Screenshot</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCopyReport}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 hover:bg-slate-800 px-2 py-1 rounded-md transition cursor-pointer flex-shrink-0"
                  title="Copy Audit Report"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[460px]">
                {activeTab === "highlighted" ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {result.flagged_terms && result.flagged_terms.length > 0
                            ? "Suspicious semantic terms highlighted with glowing markers:"
                            : "Clean text: No high-risk scam patterns detected."}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 shadow-inner">
                      {renderHighlightedDocument()}
                    </div>
                  </div>
                ) : activeTab === "breakdown" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Multi-Signal Contribution Breakdown:</span>
                      <span className="font-mono text-slate-300 font-semibold">Total: {result.score}/100</span>
                    </div>

                    <div className="space-y-2">
                      {result.signal_breakdown && result.signal_breakdown.length > 0 ? (
                        result.signal_breakdown.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                              item.score_impact < 0
                                ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-300"
                                : item.score_impact >= 35
                                ? "bg-red-950/20 border-red-800/50 text-red-200"
                                : "bg-amber-950/20 border-amber-800/50 text-amber-200"
                            }`}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold">{item.category}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                            </div>
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                item.score_impact < 0
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : item.score_impact >= 35
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {item.score_impact > 0 ? `+${item.score_impact}` : item.score_impact} pts
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No active risk signals triggered.
                        </div>
                      )}
                    </div>

                    {/* Legitimacy Dampeners Section */}
                    {result.legitimacy_signals && result.legitimacy_signals.length > 0 && (
                      <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold mb-2">
                          <Award className="w-4 h-4" />
                          <span>Legitimacy Indicators & Dampeners Detected:</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                          {result.legitimacy_signals.map((sig, i) => (
                            <li key={i}>{sig}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : activeTab === "image_preview" && result.image_preview ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Source Screenshot (OCR Target):</span>
                      <span className="font-mono text-amber-400">
                        OCR Confidence: {result.ocr_confidence ?? 90}%
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex justify-center">
                      <img
                        src={result.image_preview}
                        alt="Scanned Screenshot"
                        className="max-h-[360px] object-contain rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {findingsCount === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">
                        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                        <p className="text-emerald-300 font-semibold mb-1">Safe Content Verified</p>
                        <p className="text-xs text-slate-500">
                          No recognized scam indicators or advance-fee patterns were detected in this content.
                        </p>
                      </div>
                    ) : (
                      (result.findings || []).map((finding, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                                "{finding.matched_term}"
                              </span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                {finding.category}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-red-400 flex-shrink-0">
                              +{finding.weight} Risk
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                            {finding.rationale}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[460px] flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-4 shadow-inner">
                <FileSearch className="w-10 h-10" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">Ready for Multi-Signal Audit</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Paste any job posting or upload a screenshot on the left to extract text and evaluate multi-signal fraud patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
