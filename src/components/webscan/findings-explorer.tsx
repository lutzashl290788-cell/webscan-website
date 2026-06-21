"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  type ScanReport,
  type ScanFinding,
  type Severity,
  type Confidence,
  SEVERITY_ORDER,
  SEVERITY_STYLES,
  SEVERITY_ICON,
  CONFIDENCE_STYLES,
  computeStats,
} from "@/lib/webscan-report";
import {
  loadGLMConfig,
  chatComplete,
  TRIAGE_SYSTEM_PROMPT,
  parseTriageVerdict,
  type TriageVerdict,
  type GLMError,
} from "@/lib/glm-client";

interface FindingsExplorerProps {
  report: ScanReport;
}

type SeverityFilter = "all" | Severity;
type ConfidenceFilter = "all" | Confidence;
type TriageFilter = "all" | "triaged" | "untriaged" | "tp" | "fp";

// Finding index key — `targetIdx:findingIdx`.
type FindingKey = string;

interface TriageState {
  [key: FindingKey]: {
    verdict?: TriageVerdict;
    loading: boolean;
    error?: string;
  };
}

export function FindingsExplorer({ report }: FindingsExplorerProps) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const [triageFilter, setTriageFilter] = useState<TriageFilter>("all");
  const [triage, setTriage] = useState<TriageState>({});
  const [expanded, setExpanded] = useState<Set<FindingKey>>(new Set());
  const { toast } = useToast();

  const stats = useMemo(() => computeStats(report), [report]);

  // Flatten findings into a keyed list for filtering.
  const allFindings = useMemo(() => {
    const list: Array<{ key: FindingKey; finding: ScanFinding; targetIdx: number; findingIdx: number }> = [];
    report.targets.forEach((t, ti) => {
      t.findings.forEach((f, fi) => {
        list.push({ key: `${ti}:${fi}`, finding: f, targetIdx: ti, findingIdx: fi });
      });
    });
    return list;
  }, [report]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFindings
      .filter(({ key, finding }) => {
        if (severity !== "all" && finding.severity !== severity) return false;
        if (confidence !== "all" && finding.confidence !== confidence) return false;
        if (triageFilter !== "all") {
          const t = triage[key];
          if (triageFilter === "untriaged" && t?.verdict) return false;
          if (triageFilter === "triaged" && !t?.verdict) return false;
          if (triageFilter === "tp" && t?.verdict?.assessment !== "likely_true_positive") return false;
          if (triageFilter === "fp" && t?.verdict?.assessment !== "likely_false_positive") return false;
        }
        if (q) {
          const hay = `${finding.plugin} ${finding.title} ${finding.description} ${finding.url}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => SEVERITY_ORDER[b.finding.severity] - SEVERITY_ORDER[a.finding.severity]);
  }, [allFindings, search, severity, confidence, triageFilter, triage]);

  const triagedCount = Object.values(triage).filter((t) => t.verdict).length;
  const tpCount = Object.values(triage).filter((t) => t.verdict?.assessment === "likely_true_positive").length;
  const fpCount = Object.values(triage).filter((t) => t.verdict?.assessment === "likely_false_positive").length;

  const triageFinding = useCallback(
    async (key: FindingKey, finding: ScanFinding) => {
      const config = loadGLMConfig();
      if (!config.apiKey) {
        toast({
          title: "No API key",
          description: "Open AI Settings (top right) and paste your GLM API key.",
          variant: "destructive",
        });
        return;
      }
      setTriage((prev) => ({ ...prev, [key]: { ...prev[key], loading: true, error: undefined } }));
      // Auto-expand so the verdict is visible when it arrives.
      setExpanded((prev) => new Set(prev).add(key));

      // Compose the scanner-output payload for the LLM.
      const payload = {
        plugin: finding.plugin,
        title: finding.title,
        severity: finding.severity,
        confidence: finding.confidence,
        description: finding.description,
        url: finding.url,
        evidence: finding.evidence,
        remediation: finding.remediation,
      };

      try {
        const raw = await chatComplete(
          config,
          [
            { role: "system", content: TRIAGE_SYSTEM_PROMPT },
            {
              role: "user",
              content:
                `<scanner_output>\n${JSON.stringify(payload, null, 2)}\n</scanner_output>\n\n` +
                `Assess this finding and return the JSON verdict.`,
            },
          ],
          { temperature: 0.2, maxTokens: 400 }
        );
        const verdict = parseTriageVerdict(raw);
        setTriage((prev) => ({ ...prev, [key]: { verdict, loading: false } }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        setTriage((prev) => ({
          ...prev,
          [key]: { ...prev[key], loading: false, error: msg },
        }));
        toast({
          title: "Triage failed",
          description: msg,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const triageAll = useCallback(async () => {
    // Sequential to avoid rate-limits; the user sees progress as each verdict arrives.
    for (const { key, finding } of filtered) {
      if (!triage[key]?.verdict && !triage[key]?.loading) {
        await triageFinding(key, finding);
      }
    }
    toast({
      title: "Triage complete",
      description: `${filtered.length} findings reviewed.`,
    });
  }, [filtered, triage, triageFinding, toast]);

  const clearTriage = useCallback(() => {
    setTriage({});
    toast({ title: "Triage cleared" });
  }, [toast]);

  function toggleExpanded(key: FindingKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Triage summary + actions */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">AI Triage:</span>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {tpCount} true positive
            </Badge>
            <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
              <XCircle className="mr-1 h-3 w-3" />
              {fpCount} false positive
            </Badge>
            <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
              <HelpCircle className="mr-1 h-3 w-3" />
              {triagedCount - tpCount - fpCount} uncertain
            </Badge>
            <span className="text-muted-foreground">
              / {stats.total} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={triageAll} size="sm" className="glow-primary">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Triage all
            </Button>
            {triagedCount > 0 && (
              <Button onClick={clearTriage} size="sm" variant="ghost">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search findings by plugin, title, URL, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center font-medium uppercase tracking-wider text-muted-foreground">
            <Filter className="mr-1 h-3 w-3" />
            Severity:
          </span>
          {(["all", "critical", "high", "medium", "low", "info"] as SeverityFilter[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={severity === s ? "default" : "outline"}
              onClick={() => setSeverity(s)}
            >
              {s === "all" ? "All" : s} ({s === "all" ? stats.total : stats.bySeverity[s as Severity]})
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center font-medium uppercase tracking-wider text-muted-foreground">
            Confidence:
          </span>
          {(["all", "firm", "tentative", "informational"] as ConfidenceFilter[]).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={confidence === c ? "default" : "outline"}
              onClick={() => setConfidence(c)}
            >
              {c === "all" ? "All" : c} ({c === "all" ? stats.total : stats.byConfidence[c as Confidence]})
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center font-medium uppercase tracking-wider text-muted-foreground">
            Triage:
          </span>
          {([
            ["all", "All"],
            ["untriaged", "Untriaged"],
            ["triaged", "Triaged"],
            ["tp", "True positives"],
            ["fp", "False positives"],
          ] as const).map(([v, label]) => (
            <Button
              key={v}
              size="sm"
              variant={triageFilter === v ? "default" : "outline"}
              onClick={() => setTriageFilter(v)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <strong className="text-foreground">{filtered.length}</strong> of {stats.total} findings
      </div>

      {/* Findings list */}
      <ScrollArea className="max-h-[1200px] pr-3">
        <div className="space-y-2">
          {filtered.map(({ key, finding }) => {
            const t = triage[key];
            const isExpanded = expanded.has(key);
            return (
              <Collapsible
                key={key}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(key)}
                className="rounded-md border border-border/60 bg-card/40"
              >
                <CardHeader className="p-3">
                  <div className="flex items-start gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-0.5 h-6 w-6 p-0"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <span className="mt-0.5 text-base leading-none">
                      {SEVERITY_ICON[finding.severity]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-xs font-semibold text-primary">
                          {finding.plugin}
                        </code>
                        <Badge
                          variant="outline"
                          className={`${SEVERITY_STYLES[finding.severity]} text-[10px] uppercase`}
                        >
                          {finding.severity}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${CONFIDENCE_STYLES[finding.confidence]} text-[10px]`}
                        >
                          {finding.confidence}
                        </Badge>
                        {t?.verdict && (
                          <TriageBadge verdict={t.verdict} />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {finding.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {finding.url}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        triageFinding(key, finding);
                      }}
                      disabled={t?.loading}
                      className="flex-shrink-0"
                    >
                      {t?.loading ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">
                        {t?.verdict ? "Re-triage" : "AI triage"}
                      </span>
                      <span className="sm:hidden">AI</span>
                    </Button>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-3 border-t border-border/60 p-3 pt-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description
                      </div>
                      <p className="mt-1 leading-relaxed text-foreground">
                        {finding.description}
                      </p>
                    </div>
                    {finding.evidence && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Evidence
                        </div>
                        <pre className="mt-1 overflow-x-auto rounded-md border border-border/60 bg-[#0a0d12] p-2 font-mono text-xs text-foreground">
                          {typeof finding.evidence === "string"
                            ? finding.evidence
                            : JSON.stringify(finding.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                    {finding.remediation && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                          Remediation
                        </div>
                        <p className="mt-1 leading-relaxed text-foreground">
                          {finding.remediation}
                        </p>
                      </div>
                    )}
                    {t?.error && (
                      <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-500">
                        <strong>Triage error:</strong> {t.error}
                      </div>
                    )}
                    {t?.verdict && (
                      <TriageVerdictCard verdict={t.verdict} />
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function TriageBadge({ verdict }: { verdict: TriageVerdict }) {
  const config: {
    style: string;
    Icon: LucideIcon;
    label: string;
  } = verdict.assessment === "likely_true_positive"
    ? { style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500", Icon: CheckCircle2, label: "real" }
    : verdict.assessment === "likely_false_positive"
      ? { style: "border-red-500/30 bg-red-500/10 text-red-500", Icon: XCircle, label: "false positive" }
      : { style: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500", Icon: HelpCircle, label: "uncertain" };
  return (
    <Badge variant="outline" className={`${config.style} text-[10px]`}>
      <config.Icon className="mr-1 h-2.5 w-2.5" />
      AI: {config.label}
    </Badge>
  );
}

function TriageVerdictCard({ verdict }: { verdict: TriageVerdict }) {
  const styles = {
    likely_true_positive: "border-emerald-500/30 bg-emerald-500/5",
    likely_false_positive: "border-red-500/30 bg-red-500/5",
    uncertain: "border-yellow-500/30 bg-yellow-500/5",
  } as const;
  return (
    <div className={`rounded-md border p-3 ${styles[verdict.assessment]}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider">
          AI Verdict · {verdict.assessment.replace(/_/g, " ")}
        </div>
        <Badge variant="outline" className="text-[10px]">
          {Math.round(verdict.confidence * 100)}% confidence
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-foreground">
        {verdict.rationale}
      </p>
      <p className="mt-2 text-xs">
        <span className="font-semibold text-emerald-500">Recommended action: </span>
        <span className="text-foreground">{verdict.recommended_action}</span>
      </p>
    </div>
  );
}
