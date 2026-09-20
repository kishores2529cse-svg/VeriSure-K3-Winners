import React, { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  FileSearch,
  Layers,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { saveScamReport } from "../utils/scamReports";

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
    title: "?? US High-Salary Task Scam (USD)",
    tag: "USD Task Scam",
    content: `Urgent Hiring! Work from Home Data Entry Operator.
Earn $100,000/year with no experience required.
Guaranteed direct placement without interview.
Candidates must pay a refundable onboarding security deposit of $350 before kit delivery.
Contact HR on Telegram: @us_recruitment_hub`,
  },
  {
    title: "?? Fake Job with Upfront Fee",
    tag: "Advance Fee Job",
    content: `Urgent Requirement! International Data Corp is hiring candidates immediately.
Position: Operations Lead.
No experience required for manager role! Work from home ?50,000 per month guaranteed.
To proceed with onboarding and background check, candidates must deposit a refundable registration fee of ?2,500.
Please pay upfront through our portal. Contact HR on telegram: @hr_recruit_direct to get your employee kit.`,
  },
  {
    title: "?? Marketplace Fraud Listing",
    tag: "Marketplace Scam",
    content: `Selling brand new iPhone 15 Pro Max 256GB sealed in box for just ?35,000 due to urgent relocation.
Free shipping across India.
Due to bank server maintenance, do not use the app checkout.
Send money to this alternate number (+91 9876543210) via GPay to confirm booking immediately.
Once sent, share screenshot on whatsapp for tracking ID dispatch.`,
  },
  {
    title: "? Legitimate Corporate Job",
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
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"highlighted" | "breakdown" | "findings" | "image_preview">("highlighted");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      saveScamReport({
        id: `${normalizedResult.analyzed_at}-${normalizedResult.score}-${normalizedResult.word_count}`,
        analyzedAt: normalizedResult.analyzed_at,
        score: normalizedResult.score,
        riskLevel: normalizedResult.risk_level,
        flaggedTerms: normalizedResult.flagged_terms,
        findings: normalizedResult.findings.map((finding) => ({
          matchedTerm: finding.matched_term,
          category: finding.category,
          rationale: finding.rationale,
          weight: finding.weight,
        })),
        wordCount: normalizedResult.word_count,
        source: normalizedResult.source,
      });
      setActiveTab("highlighted");
    } catch (err: any) {
      console.error("Scam analysis error:", err);
      setError(
        err.message || "Failed to reach backend server. Please verify backend is running on :8080"
      );
    } finally {
      setLoading(false);
    }
  };

  const processImageOCR = useCallback(async (imageFile: File | string, previewUrl: string) => {
    setOcrLoading(true);
    setError(null);
    setResult(null);

    try {
      const ocrResult = await Tesseract.recognize(imageFile, "eng", {
        logger: () => {},
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
    ctx.fillText("Earn ?50,000 per month guaranteed.", 40, 195);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "18px sans-serif";
    ctx.fillText("To complete registration, candidates must pay", 40, 245);
    ctx.fillText("a refundable registration fee of ?2,500.", 40, 275);
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

  const handleCopyReport = () => {
    if (!result) return;
    const findings = result.findings || [];
    const flagged = result.flagged_terms || [];
    const breakdowns = result.signal_breakdown || [];
    const sourceLabel =
      result.source === "IMAGE_OCR"
        ? `??? Image ? OCR ? Text Analysis (OCR Confidence: ${result.ocr_confidence ?? "N/A"}%)`
        : "?? Direct Text Input";

    const summary = `??? VeriSure Multi-Signal Scam Audit Report
Source: ${sourceLabel}
Risk Score: ${result.score}/100 [${result.risk_level} RISK]
Flagged Terms: ${flagged.join(", ") || "None"}

Risk Signal Breakdown:
${breakdowns.map((b) => `� ${b.category}: ${b.score_impact > 0 ? `+${b.score_impact}` : b.score_impact} pts - ${b.description}`).join("\n")}

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

  const getScoreTheme = (score: number) => {
    if (score >= 75) {
      return { text: "text-red-500", bg: "bg-red-500/10", badge: "bg-[#2A0808] text-red-400 border-red-900" };
    }
    if (score >= 50) {
      return { text: "text-orange-400", bg: "bg-orange-500/10", badge: "bg-[#2A1808] text-orange-400 border-orange-900" };
    }
    if (score >= 25) {
      return { text: "text-yellow-400", bg: "bg-yellow-500/10", badge: "bg-[#2A2A08] text-yellow-400 border-yellow-900" };
    }
    return { text: "text-[#7CFF4D]", bg: "bg-[#7CFF4D]/10", badge: "bg-[#0A1A0A] text-[#7CFF4D] border-[#7CFF4D]/30" };
  };

  const findingsCount = result?.findings?.length || 0;
  const isBusy = loading || ocrLoading;

  return (
    <div className="flex flex-col h-full bg-[#090909] text-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-[#7CFF4D]" />
            <span>Scam Scanner</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Detect suspicious job postings and fraudulent recruitment content using AI-powered analysis.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
          <div className="w-2 h-2 rounded-full bg-[#7CFF4D] shadow-[0_0_8px_rgba(124,255,77,0.4)] animate-pulse" />
          <span className="text-[#7CFF4D]">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4 border-b border-neutral-800">
        <div className="flex bg-[#0D110D] p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => { setInputMode("text"); setError(null); }}
            className={`text-xs px-4 py-2 rounded-md font-medium transition flex items-center space-x-2 cursor-pointer ${
              inputMode === "text"
                ? "bg-neutral-800 text-white border border-[#7CFF4D]/30 shadow-[0_0_10px_rgba(124,255,77,0.1)]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Text</span>
          </button>
          <button
            onClick={() => { setInputMode("image"); setError(null); }}
            className={`text-xs px-4 py-2 rounded-md font-medium transition flex items-center space-x-2 cursor-pointer ${
              inputMode === "image"
                ? "bg-neutral-800 text-white border border-[#7CFF4D]/30 shadow-[0_0_10px_rgba(124,255,77,0.1)]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Image (OCR)</span>
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {inputMode === "text" ? (
            SAMPLE_TEXT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(preset.content);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs px-3 py-1.5 rounded bg-[#0D110D] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition active:scale-95 cursor-pointer"
              >
                {preset.tag}
              </button>
            ))
          ) : (
            <button
              onClick={handleLoadDemoScamScreenshot}
              className="text-xs px-3 py-1.5 rounded bg-[#0D110D] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Demo Screenshot</span>
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Indicator */}
      <div className="py-4 flex items-center space-x-2 text-[10px] font-mono tracking-widest text-neutral-500 overflow-x-auto">
        <span className={inputMode ? "text-[#7CFF4D]" : ""}>INPUT</span>
        <ArrowRight className="w-3 h-3" />
        <span className={ocrExtractedText ? "text-[#7CFF4D]" : ""}>OCR / TEXT EXTRACTION</span>
        <ArrowRight className="w-3 h-3" />
        <span className={loading ? "text-[#7CFF4D] animate-pulse" : (result ? "text-[#7CFF4D]" : "")}>FEATURE ANALYSIS</span>
        <ArrowRight className="w-3 h-3" />
        <span className={result ? "text-[#7CFF4D]" : ""}>SCAM DETECTION</span>
        <ArrowRight className="w-3 h-3" />
        <span className={result ? "text-[#7CFF4D]" : ""}>RISK ASSESSMENT</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 items-stretch">
        
        {/* LEFT: JOB POSTING INPUT */}
        <div className="flex flex-col bg-[#0B0F0B] border border-neutral-800/80 rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-[#101510] border-b border-neutral-800/80 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-bold tracking-wider text-neutral-300 uppercase">Job Posting Input</h3>
          </div>
          <div className="flex-1 p-4 flex flex-col">
            {inputMode === "text" ? (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste job posting here..."
                className="flex-1 w-full h-full min-h-[300px] bg-[#090909] p-3 rounded-lg border border-neutral-800 font-mono text-xs leading-relaxed text-neutral-300 placeholder-neutral-600 resize-none focus:outline-none focus:border-[#7CFF4D]/40"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 flex flex-col">
                {!selectedImage ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 border border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition min-h-[300px] ${
                      isDragOver ? "border-[#7CFF4D] bg-[#7CFF4D]/5" : "border-neutral-700 hover:border-neutral-500 bg-[#090909]"
                    }`}
                  >
                    <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleFileSelection(e.target.files[0]); }} accept="image/*" className="hidden" />
                    <Upload className="w-8 h-8 text-neutral-500 mb-3" />
                    <p className="text-sm font-medium text-neutral-300 text-center">Upload job posting screenshot</p>
                    <p className="text-xs text-neutral-500 mt-1 text-center">Drag & drop or click to upload</p>
                    <p className="text-[10px] text-neutral-600 mt-4">Supported: PNG, JPG, WEBP</p>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4">
                    <div className="p-3 rounded-lg border border-neutral-800 bg-[#090909] flex items-center space-x-3">
                      {imagePreviewUrl && (
                        <img src={imagePreviewUrl} alt="Preview" className="w-14 h-14 object-cover rounded border border-neutral-700" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-200 truncate">{selectedImage.name}</p>
                        <p className="text-[10px] text-neutral-500">{(selectedImage.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={handleRemoveImage} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: OCR EXTRACTED TEXT & ANALYSIS */}
        <div className="flex flex-col space-y-4">
          <div className="flex-1 flex flex-col bg-[#0B0F0B] border border-neutral-800/80 rounded-xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-[#101510] border-b border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-bold tracking-wider text-neutral-300 uppercase">OCR Extracted Text</h3>
              </div>
              {ocrConfidence !== null && (
                <span className="text-[10px] font-mono text-neutral-400">OCR Confidence: {ocrConfidence}%</span>
              )}
            </div>
            <div className="flex-1 p-4 flex flex-col">
              {inputMode === "image" ? (
                <textarea
                  value={ocrExtractedText}
                  onChange={(e) => setOcrExtractedText(e.target.value)}
                  placeholder="Extracted text will appear here..."
                  className="flex-1 w-full min-h-[150px] bg-[#090909] p-3 rounded-lg border border-neutral-800 font-mono text-xs leading-relaxed text-neutral-300 focus:outline-none focus:border-[#7CFF4D]/40 resize-none"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 text-xs font-mono border border-dashed border-neutral-800 rounded-lg p-6 text-center">
                  Direct Text Input Active.<br/>See left panel.
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0B0F0B] border border-neutral-800/80 rounded-xl overflow-hidden p-4">
            <h3 className="text-xs font-bold tracking-wider text-neutral-400 uppercase mb-3">Analysis Status</h3>
            <div className="space-y-2 text-xs font-mono text-neutral-500 mb-4">
              <div className="flex items-center space-x-2">
                {(inputMode === "text" ? inputText.trim() : ocrExtractedText.trim()) ? <Check className="w-3.5 h-3.5 text-[#7CFF4D]" /> : <div className="w-3.5 h-3.5 border border-neutral-700 rounded-sm" />}
                <span className={(inputMode === "text" ? inputText.trim() : ocrExtractedText.trim()) ? "text-neutral-300" : ""}>Text extracted</span>
              </div>
              <div className="flex items-center space-x-2">
                {result ? <Check className="w-3.5 h-3.5 text-[#7CFF4D]" /> : loading ? <Cpu className="w-3.5 h-3.5 animate-spin text-neutral-400" /> : <div className="w-3.5 h-3.5 border border-neutral-700 rounded-sm" />}
                <span className={result ? "text-neutral-300" : ""}>Features analyzed</span>
              </div>
              <div className="flex items-center space-x-2">
                {result ? <Check className="w-3.5 h-3.5 text-[#7CFF4D]" /> : <div className="w-3.5 h-3.5 border border-neutral-700 rounded-sm" />}
                <span className={result ? "text-neutral-300" : ""}>Scam patterns analyzed</span>
              </div>
              <div className="flex items-center space-x-2">
                {result ? <Check className="w-3.5 h-3.5 text-[#7CFF4D]" /> : <div className="w-3.5 h-3.5 border border-neutral-700 rounded-sm" />}
                <span className={result ? "text-neutral-300" : ""}>Risk assessment generated</span>
              </div>
            </div>

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
              disabled={isBusy || (inputMode === "text" ? !inputText.trim() : !ocrExtractedText.trim())}
              className="w-full py-2.5 rounded border border-[#7CFF4D]/30 bg-[#7CFF4D]/10 hover:bg-[#7CFF4D]/20 text-[#7CFF4D] font-bold tracking-wide uppercase text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
            {error && <div className="mt-2 text-[10px] text-red-400 font-mono text-center">{error}</div>}
          </div>
        </div>

        {/* RIGHT: THREAT ASSESSMENT */}
        <div className="flex flex-col bg-[#0B0F0B] border border-neutral-800/80 rounded-xl overflow-hidden shadow-lg h-full max-h-[800px]">
          <div className="px-4 py-3 bg-[#101510] border-b border-neutral-800/80 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-neutral-300 uppercase">Threat Assessment</h3>
            {result && (
              <span className="text-[10px] font-mono text-neutral-500">SCORE: {result.score}/100</span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-6">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 text-xs font-mono text-center space-y-2">
                <ShieldAlert className="w-8 h-8 opacity-20" />
                <p>Awaiting analysis...</p>
              </div>
            ) : (
              <>
                {/* Score Section */}
                <div className="flex flex-col">
                  {(() => {
                    const theme = getScoreTheme(result.score);
                    return (
                      <>
                        <div className="flex items-end justify-between mb-2">
                          <span className={`text-4xl font-bold font-mono ${theme.text}`}>{result.score}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${theme.badge}`}>
                            {result.risk_level} RISK
                          </span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-sm h-1.5 flex overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-teal-500 via-emerald-500 via-yellow-500 to-red-500" />
                          <div className="absolute top-0 right-0 h-full bg-[#090909] z-0" style={{ width: `${100 - Math.max(result.score, 2)}%` }} />
                          <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" style={{ left: `${Math.max(result.score, 2)}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-1 relative h-3">
                          <span className="absolute left-0">0 Safe</span>
                          <span className="absolute left-1/4 -translate-x-1/2">25</span>
                          <span className="absolute left-1/2 -translate-x-1/2">50 Moderate</span>
                          <span className="absolute left-3/4 -translate-x-1/2">75 High</span>
                          <span className="absolute right-0">100 Critical</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center space-x-2 border-b border-neutral-800 pb-2 mt-4">
                  <button onClick={() => setActiveTab("highlighted")} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${activeTab === 'highlighted' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                    <FileSearch className="w-3.5 h-3.5" /> <span>Document View</span>
                  </button>
                  <button onClick={() => setActiveTab("findings")} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${activeTab === 'findings' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                    <Layers className="w-3.5 h-3.5" /> <span>Rationales ({findingsCount})</span>
                  </button>
                  <button onClick={handleCopyReport} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition flex items-center space-x-1.5 text-neutral-500 hover:text-neutral-300 ml-auto">
                    {copied ? <Check className="w-3.5 h-3.5 text-[#7CFF4D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy Report"}</span>
                  </button>
                </div>

                <div className="mt-2 space-y-6">
                  {activeTab === "highlighted" && (
                    <>
                      {/* Flagged Content */}
                      {result.flagged_terms && result.flagged_terms.length > 0 && (
                        <div className="flex items-center space-x-2 text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-2 rounded">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Suspicious terms highlighted with glowing badges</span>
                        </div>
                      )}
                      
                      {result.flagged_terms && result.flagged_terms.length > 0 && (
                        <div className="p-3 bg-[#090909] border border-neutral-800 rounded font-mono text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap">
                          {(() => {
                            const text = inputMode === "text" ? inputText : ocrExtractedText;
                            const terms = [...result.flagged_terms].sort((a,b)=>b.length - a.length);
                            const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
                            const regex = new RegExp(`(${escaped.join("|")})`, "gi");
                            const parts = text.split(regex);
                            return parts.map((part, i) => {
                              if (terms.some(t => t.toLowerCase() === part.toLowerCase())) {
                                return (
                                  <span key={i} className="inline-flex items-center bg-[#2A0808] border border-red-900/50 text-red-300 px-1 py-0.5 mx-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                    <span>{part}</span> <span className="ml-1 text-[8px] bg-red-900/80 text-red-200 px-1 rounded uppercase">FLAGGED</span>
                                  </span>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            });
                          })()}
                        </div>
                      )}

                      {/* Risk Breakdown */}
                      {result.signal_breakdown && result.signal_breakdown.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-2 flex justify-between items-center">
                            <span>Risk Breakdown</span>
                            <span className="text-cyan-500 hover:text-cyan-400 cursor-pointer">View Details →</span>
                          </h4>
                          <div className="space-y-1">
                            {result.signal_breakdown.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] bg-neutral-900/50 p-1.5 rounded">
                                <span className="text-neutral-300 truncate mr-2" title={item.category}>{item.category}</span>
                                <span className={`font-mono font-bold flex-shrink-0 ${item.score_impact > 0 ? "text-orange-400" : "text-[#7CFF4D]"}`}>
                                  {item.score_impact > 0 ? `+${item.score_impact}` : item.score_impact}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "findings" && (
                    <>
                      {/* Rationales */}
                      {result.findings && result.findings.length > 0 ? (
                        <div>
                          <h4 className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-2">Rationales</h4>
                          <div className="space-y-2">
                            {result.findings.map((finding, idx) => (
                              <div key={idx} className="text-[11px] border-l-2 border-neutral-700 pl-2">
                                <span className="font-bold text-neutral-300 uppercase block mb-0.5">{finding.category}</span>
                                <span className="text-neutral-400 leading-relaxed">{finding.rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-neutral-500 text-xs">No rationales found.</div>
                      )}
                    </>
                  )}
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
