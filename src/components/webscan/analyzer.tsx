"use client";

import { useState } from "react";
import { Bot, Sparkles, FileJson, ArrowDownToLine, Terminal as TerminalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { ReportLoader } from "./report-loader";
import { FindingsExplorer } from "./findings-explorer";
import { ChatWithReport } from "./chat-with-report";
import { Terminal } from "./terminal";
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
  const { t } = useLang();
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
            {t("analyzer.badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("analyzer.title")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("analyzer.subtitle")}
          </p>
        </div>

        {/* How it works */}
        <div className="mx-auto mb-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              n: 1,
              icon: ArrowDownToLine,
              title: t("analyzer.step1.title"),
              desc: t("analyzer.step1.desc"),
            },
            {
              n: 2,
              icon: FileJson,
              title: t("analyzer.step2.title"),
              desc: t("analyzer.step2.desc"),
            },
            {
              n: 3,
              icon: Bot,
              title: t("analyzer.step3.title"),
              desc: t("analyzer.step3.desc"),
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

        {/* Stats + findings + chat + terminal */}
        {report && (
          <div className="mx-auto max-w-5xl space-y-6">
            <ReportStatsCard report={report} filename={filename} />

            <Tabs defaultValue="findings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="findings">
                  <FileJson className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">{t("analyzer.tab.findings")}</span>
                  <span className="sm:hidden">Findings</span>
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <Bot className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">{t("analyzer.tab.chat")}</span>
                  <span className="sm:hidden">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="terminal">
                  <TerminalIcon className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">{t("analyzer.tab.terminal")}</span>
                  <span className="sm:hidden">Term</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="findings" className="mt-4">
                <FindingsExplorer report={report} />
              </TabsContent>
              <TabsContent value="chat" className="mt-4">
                <ChatWithReport report={report} />
              </TabsContent>
              <TabsContent value="terminal" className="mt-4">
                <Terminal onReport={handleReport} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Terminal always available (even without a report loaded) */}
        {!report && (
          <div className="mx-auto max-w-5xl space-y-6">
            <Tabs defaultValue="terminal" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="terminal">
                  <TerminalIcon className="mr-1.5 h-4 w-4" />
                  {t("analyzer.tab.terminal")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="terminal" className="mt-4">
                <Terminal onReport={handleReport} />
              </TabsContent>
            </Tabs>

            <div className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              <p>
                {t("analyzer.noReport")}
              </p>
              <p className="mt-3">
                <SettingsDialog />
              </p>
            </div>
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
  const { t } = useLang();
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
              {stats.total} {t("analyzer.findings")}
            </div>
            {report.scan_started && (
              <div className="text-xs text-muted-foreground">
                {t("analyzer.scannedAt")} {new Date(report.scan_started).toLocaleString()}
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
