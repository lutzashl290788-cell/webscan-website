"use client";

import { useState } from "react";
import { Bot, Sparkles, FileJson, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ReportLoader } from "./report-loader";
import { FindingsExplorer } from "./findings-explorer";
import { ChatWithReport } from "./chat-with-report";
import { SettingsDialog } from "./settings-dialog";
import { loadGLMConfig } from "@/lib/glm-client";
import {
  type ScanReport,
  computeStats,
  SEVERITY_STYLES,
  SEVERITY_ICON,
  type Severity,
} from "@/lib/webscan-report";

export function Analyzer() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [filename, setFilename] = useState<string>("");
  const { toast } = useToast();

  function handleReport(r: ScanReport, name: string) {
    setReport(r);
    setFilename(name);
    if (!loadGLMConfig().apiKey) {
      toast({
        title: "Tip: connect AI",
        description: "Click 'AI Settings' (top right) to enable GLM-powered triage and chat.",
      });
    }
  }

  function handleClear() {
    setReport(null);
    setFilename("");
  }

  return (
    <section id="analyzer" className="border-b border-border/60 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-powered analyzer
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Upload a scan. Get AI verdicts.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Run WebScan locally against any target, upload the JSON report here,
            and let <strong className="text-foreground">GLM 5.2</strong> triage each finding for
            false positives — then chat with the model about remediation.
          </p>
        </div>

        {/* How it works */}
        <div className="mx-auto mb-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              n: 1,
              icon: ArrowDownToLine,
              title: "Run WebScan",
              desc: "pip install webscan-security && webscan -t https://yoursite.com --format json -o scan",
            },
            {
              n: 2,
              icon: FileJson,
              title: "Upload report",
              desc: "Drop the scan.json file below. Parsing happens in your browser — the file never leaves your device.",
            },
            {
              n: 3,
              icon: Bot,
              title: "AI triage + chat",
              desc: "GLM 5.2 reviews each finding (false positive / real / uncertain). Chat with the model about anything in the report.",
            },
          ].map((s) => (
            <Card key={s.n} className="border-border/60 bg-card/40">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary ring-1 ring-primary/30">
                    {s.n}
                  </div>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{s.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loader */}
        <div className="mx-auto mb-6 max-w-4xl">
          <ReportLoader
            onReport={handleReport}
            onClear={handleClear}
            hasReport={!!report}
          />
        </div>

        {/* Stats + findings + chat */}
        {report && (
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Stats overview */}
            <ReportStatsCard report={report} filename={filename} />

            {/* Tabs: Findings / Chat */}
            <Tabs defaultValue="findings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="findings">
                  <FileJson className="mr-1.5 h-4 w-4" />
                  Findings &amp; AI triage
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <Bot className="mr-1.5 h-4 w-4" />
                  Chat with GLM
                </TabsTrigger>
              </TabsList>
              <TabsContent value="findings" className="mt-4">
                <FindingsExplorer report={report} />
              </TabsContent>
              <TabsContent value="chat" className="mt-4">
                <ChatWithReport report={report} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* No report hint */}
        {!report && (
          <div className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
            <p>
              No report loaded yet. Drop a JSON file above or{" "}
              <button
                className="text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  const el = document.querySelector('input[type="file"]') as HTMLInputElement | null;
                  el?.click();
                }}
              >
                try the sample report
              </button>{" "}
              to explore the AI features.
            </p>
            <p className="mt-3">
              Don&apos;t have an API key yet?{" "}
              <SettingsDialog />
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ReportStatsCard({
  report,
  filename,
}: {
  report: ScanReport;
  filename: string;
}) {
  const stats = computeStats(report);
  return (
    <Card className="border-border/60 bg-card/40">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">
              {filename || "report.json"} · {report.targets.length} target(s)
            </div>
            <div className="text-2xl font-bold">
              {stats.total} {stats.total === 1 ? "finding" : "findings"}
            </div>
            {report.scan_started && (
              <div className="text-xs text-muted-foreground">
                scanned at {new Date(report.scan_started).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["critical", "high", "medium", "low", "info"] as Severity[])
              .filter((s) => stats.bySeverity[s] > 0)
              .map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className={`${SEVERITY_STYLES[s]} uppercase`}
                >
                  {SEVERITY_ICON[s]} {stats.bySeverity[s]} {s}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
