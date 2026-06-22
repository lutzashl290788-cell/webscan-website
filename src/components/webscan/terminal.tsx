"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Trash2,
  Loader2,
  Wifi,
  WifiOff,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { parseWebScanReport, type ScanReport } from "@/lib/webscan-report";

interface TerminalProps {
  onReport: (report: ScanReport, filename: string) => void;
}

interface LogLine {
  type: "stdout" | "stderr" | "error" | "info";
  text: string;
}

// The scan-service runs on port 3030. The Caddy gateway in the sandbox
// forwards requests when we pass XTransformPort=3030 in the query string.
// On GitHub Pages (no backend), the health check fails and we show a fallback.
const SCAN_SERVICE_PORT = 3030;
const SCAN_SERVICE_URL = `/api/scan?XTransformPort=${SCAN_SERVICE_PORT}`;
const HEALTH_URL = `/health?XTransformPort=${SCAN_SERVICE_PORT}`;

export function Terminal({ onReport }: TerminalProps) {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null); // null = checking
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Check scan-service availability on mount.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const resp = await fetch(HEALTH_URL, {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        if (cancelled) return;
        if (resp.ok) {
          const data = await resp.json();
          setConnected(true);
          setLogs([
            {
              type: "info",
              text: `${t("terminal.connected")} · webscan ${data.webscanInstalled ? "✓" : "✗ (not installed on server)"}`,
            },
          ]);
        } else {
          setConnected(false);
        }
      } catch {
        if (cancelled) return;
        setConnected(false);
        setLogs([{ type: "info", text: t("terminal.offline") }]);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Auto-scroll to bottom on new logs.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const run = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || running) return;

    if (connected === false) {
      toast({
        title: t("terminal.offline"),
        description: "Run `webscan serve` locally or upload a JSON report manually.",
        variant: "destructive",
      });
      return;
    }

    setInput("");
    setRunning(true);
    setLogs((prev) => [
      ...prev,
      { type: "info", text: `$ ${cmd}` },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(SCAN_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setLogs((prev) => [...prev, { type: "error", text: `[${resp.status}] ${err.error ?? resp.statusText}` }]);
        setRunning(false);
        return;
      }
      if (!resp.body) {
        setLogs((prev) => [...prev, { type: "error", text: "no response body" }]);
        setRunning(false);
        return;
      }

      // Read the SSE stream.
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let exitCode: number | null = null;
      let reportJson: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split into SSE events (separated by \n\n).
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? ""; // keep the incomplete tail

        for (const evt of events) {
          const lines = evt.split("\n");
          let eventType = "";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) dataStr = line.slice(6);
          }
          if (!eventType || !dataStr) continue;
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }
          if (eventType === "stdout") {
            setLogs((prev) => [...prev, { type: "stdout", text: String(data.line ?? "") }]);
          } else if (eventType === "stderr") {
            setLogs((prev) => [...prev, { type: "stderr", text: String(data.line ?? "") }]);
          } else if (eventType === "start") {
            setLogs((prev) => [...prev, { type: "info", text: `▶ ${data.command ?? ""}` }]);
          } else if (eventType === "error") {
            setLogs((prev) => [...prev, { type: "error", text: String(data.message ?? "unknown error") }]);
          } else if (eventType === "exit") {
            exitCode = (data.code as number | null) ?? null;
            if (data.report && typeof data.report === "object") {
              reportJson = JSON.stringify(data.report);
            }
          }
        }
      }

      setLogs((prev) => [
        ...prev,
        {
          type: exitCode === 0 ? "info" : "error",
          text: `— exit code ${exitCode}`,
        },
      ]);

      // Auto-load the report into the analyzer if we got one.
      if (reportJson) {
        try {
          const report = parseWebScanReport(reportJson);
          setLogs((prev) => [...prev, { type: "info", text: t("terminal.autoLoad") }]);
          onReport(report, `terminal-scan-${Date.now()}.json`);
          toast({
            title: "Report auto-loaded",
            description: `${report.targets.length} target(s), ${report.total_findings ?? 0} findings.`,
          });
        } catch (err) {
          setLogs((prev) => [
            ...prev,
            { type: "error", text: `failed to parse report: ${err instanceof Error ? err.message : "unknown"}` },
          ]);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setLogs((prev) => [...prev, { type: "info", text: "— aborted" }]);
      } else {
        setLogs((prev) => [
          ...prev,
          { type: "error", text: err instanceof Error ? err.message : "unknown error" },
        ]);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [input, running, connected, onReport, toast, t]);

  function stop() {
    abortRef.current?.abort();
  }

  function clearLogs() {
    setLogs([]);
  }

  function fillExample() {
    setInput("webscan -t https://example.com --safe-mode");
  }

  return (
    <Card className="flex h-[600px] flex-col border-border/60 bg-card/40">
      <CardHeader className="flex-row items-center justify-between border-b border-border/60 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TerminalIcon className="h-5 w-5 text-primary" />
          {t("terminal.title")}
        </CardTitle>
        <div className="flex items-center gap-2">
          {connected === null ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
              {t("terminal.connecting")}
            </Badge>
          ) : connected ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-500">
              <Wifi className="mr-1 h-2.5 w-2.5" />
              {t("terminal.connected")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-[10px] text-red-500">
              <WifiOff className="mr-1 h-2.5 w-2.5" />
              offline
            </Badge>
          )}
          {logs.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearLogs}>
              <Trash2 className="mr-1 h-3 w-3" />
              {t("terminal.clear")}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        <ScrollArea className="flex-1" ref={scrollRef as never}>
          <pre className="overflow-x-auto p-2 font-mono text-xs leading-relaxed">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">
                {t("terminal.hint")}
              </span>
            ) : (
              logs.map((line, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap break-words ${
                    line.type === "stderr"
                      ? "text-yellow-500"
                      : line.type === "error"
                        ? "text-red-500"
                        : line.type === "info"
                          ? "text-emerald-500"
                          : "text-foreground"
                  }`}
                >
                  {line.text || "\u00A0"}
                </div>
              ))
            )}
            {running && (
              <span className="cursor-blink text-primary">▊</span>
            )}
          </pre>
        </ScrollArea>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <ChevronRight className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  run();
                }
              }}
              placeholder={t("terminal.placeholder")}
              disabled={running || connected === false}
              className="pl-8 font-mono text-xs"
            />
          </div>
          {running ? (
            <Button onClick={stop} variant="destructive">
              <Square className="mr-1 h-4 w-4" />
              {t("terminal.stop")}
            </Button>
          ) : (
            <Button onClick={run} disabled={!input.trim() || connected === false} className="glow-primary">
              <Play className="mr-1 h-4 w-4" />
              {t("terminal.run")}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>{t("terminal.hint")}</span>
          <Button variant="ghost" size="sm" onClick={fillExample} className="h-6 px-2 text-[10px]">
            <ChevronRight className="mr-1 h-2.5 w-2.5" />
            webscan -t https://example.com --safe-mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
