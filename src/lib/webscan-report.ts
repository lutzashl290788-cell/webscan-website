/**
 * WebScan JSON report types + parser.
 *
 * Matches the shape produced by `webscan --format json -o report` (v2.5.x).
 * The parser is defensive — it accepts slightly older / newer shapes and
 * degrades gracefully when fields are missing.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Confidence = "firm" | "tentative" | "informational";

export interface ScanFinding {
  plugin: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  description: string;
  url: string;
  evidence?: Record<string, unknown> | string;
  remediation?: string;
}

export interface ScanTargetResult {
  target: string;
  findings: ScanFinding[];
  errors?: string[];
  scanned_at?: string;
}

export interface ScanReport {
  scan_started?: string;
  scan_finished?: string;
  total_findings?: number;
  targets: ScanTargetResult[];
}

/**
 * Parse a WebScan JSON report. Throws Error with a user-readable message
 * if the input is not a valid WebScan report.
 */
export function parseWebScanReport(input: string): ScanReport {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    throw new Error("File is not valid JSON.");
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("JSON root must be an object.");
  }
  const obj = data as Record<string, unknown>;
  const targetsRaw = obj.targets;
  if (!Array.isArray(targetsRaw)) {
    throw new Error(
      "Not a WebScan report — expected a top-level `targets` array."
    );
  }

  const targets: ScanTargetResult[] = targetsRaw.map((t, i) => {
    if (typeof t !== "object" || t === null) {
      throw new Error(`targets[${i}] is not an object.`);
    }
    const tr = t as Record<string, unknown>;
    const target = typeof tr.target === "string" ? tr.target : `target-${i}`;
    const findingsRaw = Array.isArray(tr.findings) ? tr.findings : [];
    const findings: ScanFinding[] = findingsRaw.map((f, j) => {
      if (typeof f !== "object" || f === null) {
        throw new Error(`targets[${i}].findings[${j}] is not an object.`);
      }
      const fo = f as Record<string, unknown>;
      return {
        plugin: String(fo.plugin ?? "unknown"),
        title: String(fo.title ?? "Untitled finding"),
        severity: normaliseSeverity(fo.severity),
        confidence: normaliseConfidence(fo.confidence),
        description: String(fo.description ?? ""),
        url: String(fo.url ?? ""),
        evidence: fo.evidence as ScanFinding["evidence"],
        remediation: typeof fo.remediation === "string" ? fo.remediation : undefined,
      };
    });
    return {
      target,
      findings,
      errors: Array.isArray(tr.errors) ? tr.errors.map(String) : undefined,
      scanned_at: typeof tr.scanned_at === "string" ? tr.scanned_at : undefined,
    };
  });

  return {
    scan_started: typeof obj.scan_started === "string" ? obj.scan_started : undefined,
    scan_finished: typeof obj.scan_finished === "string" ? obj.scan_finished : undefined,
    total_findings:
      typeof obj.total_findings === "number"
        ? obj.total_findings
        : targets.reduce((sum, t) => sum + t.findings.length, 0),
    targets,
  };
}

function normaliseSeverity(v: unknown): Severity {
  const s = String(v ?? "").toLowerCase();
  if (s === "critical" || s === "high" || s === "medium" || s === "low" || s === "info") {
    return s;
  }
  return "info";
}

function normaliseConfidence(v: unknown): Confidence {
  const s = String(v ?? "").toLowerCase();
  if (s === "firm" || s === "tentative" || s === "informational") return s;
  return "informational";
}

// ─── stats + display helpers ──────────────────────────────────────────────

export interface ReportStats {
  total: number;
  bySeverity: Record<Severity, number>;
  byConfidence: Record<Confidence, number>;
  byPlugin: Record<string, number>;
  targetsCount: number;
}

export function computeStats(report: ScanReport): ReportStats {
  const stats: ReportStats = {
    total: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    byConfidence: { firm: 0, tentative: 0, informational: 0 },
    byPlugin: {},
    targetsCount: report.targets.length,
  };
  for (const t of report.targets) {
    for (const f of t.findings) {
      stats.total++;
      stats.bySeverity[f.severity]++;
      stats.byConfidence[f.confidence]++;
      stats.byPlugin[f.plugin] = (stats.byPlugin[f.plugin] ?? 0) + 1;
    }
  }
  return stats;
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-500 border-red-500/30",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  info: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const SEVERITY_ICON: Record<Severity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "⚪",
};

export const CONFIDENCE_STYLES: Record<Confidence, string> = {
  firm: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  tentative: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  informational: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
};
