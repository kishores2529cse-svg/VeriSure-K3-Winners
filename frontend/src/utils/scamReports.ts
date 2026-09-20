export interface ScamReport {
  id: string;
  analyzedAt: string;
  score: number;
  riskLevel: string;
  flaggedTerms: string[];
  findings: Array<{ matchedTerm: string; category: string; rationale: string; weight: number }>;
  wordCount: number;
  source: "DIRECT_TEXT" | "IMAGE_OCR";
}

const STORAGE_KEY = "verisure.scam-reports";

export function readScamReports(): ScamReport[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const reports = stored ? JSON.parse(stored) : [];
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

export function saveScamReport(report: ScamReport) {
  if (typeof window === "undefined") return;
  const reports = [report, ...readScamReports().filter((item) => item.id !== report.id)].slice(0, 25);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  window.dispatchEvent(new CustomEvent("verisure:scam-report-updated"));
}

export function clearScamReports() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("verisure:scam-report-updated"));
}
