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
  Copy,
  Check,
  ExternalLink,
  Server,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Storage key for user-configured scan-service URL.
const SCAN_SERVICE_URL_KEY = "webscan.scan-service-url";

// Default: use Caddy XTransformPort proxy (works in sandbox preview).
// User can override in "Connect backend" dialog to point at a self-hosted
// `webscan serve` instance (e.g. http://localhost:8000 or https://my-server.com).
const DEFAULT_SCAN_BASE = ""; // empty = use XTransformPort=3030 proxy
const SCAN_SERVICE_PORT = 3030;

function loadScanServiceBase(): string {
  if (typeof window === "undefined") return DEFAULT_SCAN_BASE;
  try {
    return window.localStorage.getItem(SCAN_SERVICE_URL_KEY) ?? DEFAULT_SCAN_BASE;
  } catch {
    return DEFAULT_SCAN_BASE;
  }
}

function saveScanServiceBase(url: string) {
  if (typeof window === "undefined") return;
  try {
    if (url) window.localStorage.setItem(SCAN_SERVICE_URL_KEY, url);
    else window.localStorage.removeItem(SCAN_SERVICE_URL_KEY);
  } catch {
    // ignore
  }
}

function buildUrls(base: string) {
  if (base) {
    // User-configured custom backend (e.g. http://localhost:8000 or https://my.server.com)
    const cleanBase = base.replace(/\/+$/, "");
    return {
      health: `${cleanBase}/health`,
      scan: `${cleanBase}/api/scan`,
    };
  }
  // Default: Caddy proxy via XTransformPort (sandbox preview only)
  return {
    health: `/health?XTransformPort=${SCAN_SERVICE_PORT}`,
    scan: `/api/scan?XTransformPort=${SCAN_SERVICE_PORT}`,
  };
}

export function Terminal({ onReport }: TerminalProps) {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [backendBase, setBackendBase] = useState<string>("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Load backend URL from localStorage on mount.
  useEffect(() => {
    const base = loadScanServiceBase();
    setBackendBase(base);
  }, []);

  const urls = buildUrls(backendBase);

  // Check scan-service availability.
  const checkConnection = useCallback(async () => {
    setConnected(null);
    try {
      const resp = await fetch(urls.health, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const data = await resp.json();
        setConnected(true);
        setLogs([
          {
            type: "info",
            text: `${t("terminal.connected")} · webscan ${data.webscanInstalled ? "✓" : "✗"}`,
          },
        ]);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    }
  }, [urls.health, t]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Auto-scroll.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const run = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || running) return;

    if (connected === false) {
      // Don't just toast — show actionable instructions in the terminal.
      setLogs((prev) => [
        ...prev,
        { type: "error", text: t("terminal.offline") },
        { type: "info", text: t("terminal.offlineStep1") },
        { type: "info", text: t("terminal.offlineStep2") },
        { type: "info", text: t("terminal.offlineStep3") },
      ]);
      return;
    }

    setInput("");
    setRunning(true);
    setLogs((prev) => [...prev, { type: "info", text: `$ ${cmd}` }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(urls.scan, {
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

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let exitCode: number | null = null;
      let reportJson: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

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
        { type: exitCode === 0 ? "info" : "error", text: `— exit code ${exitCode}` },
      ]);

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
  }, [input, running, connected, onReport, toast, t, urls.scan]);

  function stop() {
    abortRef.current?.abort();
  }

  function clearLogs() {
    setLogs([]);
  }

  function fillExample() {
    setInput("webscan -t https://example.com --safe-mode");
  }

  async function copyCommand() {
    const cmd = input.trim() || "webscan -t https://example.com --safe-mode";
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Copied!", description: cmd });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  function saveBackend(url: string) {
    const clean = url.trim().replace(/\/+$/, "");
    setBackendBase(clean);
    saveScanServiceBase(clean);
    setShowConnectDialog(false);
    setConnected(null);
    toast({
      title: clean ? "Backend saved" : "Backend cleared",
      description: clean ? `Will connect to ${clean}` : "Using default proxy",
    });
    // Re-check connection after a brief delay.
    setTimeout(() => checkConnection(), 100);
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
          <Button size="sm" variant="ghost" onClick={checkConnection} className="h-7 px-2" title="Reconnect">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <ConnectBackendDialog
            open={showConnectDialog}
            onOpenChange={setShowConnectDialog}
            currentBase={backendBase}
            onSave={saveBackend}
          />
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
            {logs.length === 0 && connected === false ? (
              <OfflineGuide t={t} />
            ) : logs.length === 0 ? (
              <span className="text-muted-foreground">{t("terminal.hint")}</span>
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
            {running && <span className="cursor-blink text-primary">▊</span>}
          </pre>
        </ScrollArea>

        {/* Offline banner */}
        {connected === false && (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
            <div className="flex items-start gap-2">
              <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-yellow-500">{t("terminal.offlineTitle")}</p>
                <p className="mt-1 text-muted-foreground">{t("terminal.offlineDesc")}</p>
              </div>
            </div>
          </div>
        )}

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
              disabled={running}
              className="pl-8 font-mono text-xs"
            />
          </div>
          {running ? (
            <Button onClick={stop} variant="destructive">
              <Square className="mr-1 h-4 w-4" />
              {t("terminal.stop")}
            </Button>
          ) : (
            <>
              <Button onClick={copyCommand} variant="outline" disabled={!input.trim()} title="Copy command">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={run} disabled={!input.trim()} className="glow-primary">
                <Play className="mr-1 h-4 w-4" />
                {t("terminal.run")}
              </Button>
            </>
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

/** Offline guide — shown in the terminal area when no backend is connected. */
function OfflineGuide({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-3 text-xs leading-relaxed">
      <div className="text-yellow-500 font-semibold">⚠ {t("terminal.offlineTitle")}</div>
      <div className="text-muted-foreground">{t("terminal.offlineDesc")}</div>
      <div className="text-muted-foreground">
        <strong className="text-foreground">{t("terminal.offlineStep1")}</strong>
      </div>
      <pre className="rounded-md border border-border/60 bg-[#0a0d12] p-2 text-foreground">
{`# 1. Install WebScan
pip install webscan-security

# 2. Run a scan locally
webscan -t https://example.com --safe-mode --format json -o scan

# 3. Upload scan.json to the analyzer above`}
      </pre>
      <div className="text-muted-foreground">
        <strong className="text-foreground">{t("terminal.offlineStep2")}</strong>
      </div>
      <pre className="rounded-md border border-border/60 bg-[#0a0d12] p-2 text-foreground">
{`# Or run the scan-service locally for live terminal:
git clone https://github.com/lutzashl290788-cell/webscan-website
cd webscan-website/mini-services/scan-service
bun install && bun index.ts
# → listens on http://localhost:3030
# Then click ⚙ (Connect backend) and enter http://localhost:3030`}
      </pre>
      <div className="text-muted-foreground">
        <strong className="text-foreground">{t("terminal.offlineStep3")}</strong>
      </div>
      <div className="text-muted-foreground">
        Type a webscan command above, click 📋 Copy, and paste it into your local terminal.
        When the scan finishes, upload the JSON report to the analyzer.
      </div>
    </div>
  );
}

/** Dialog for configuring a custom scan-service backend URL. */
function ConnectBackendDialog({
  open,
  onOpenChange,
  currentBase,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentBase: string;
  onSave: (url: string) => void;
}) {
  const [url, setUrl] = useState(currentBase);
  const { t } = useLang();

  function handleOpenChange(next: boolean) {
    if (next) setUrl(currentBase); // refresh from parent when opening
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2" title="Connect backend">
          <Server className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            {t("terminal.connectBackend")}
          </DialogTitle>
          <DialogDescription>
            {t("terminal.connectBackendDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="backend-url">Scan service URL</Label>
            <Input
              id="backend-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:3030"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              {t("terminal.connectBackendHint")}
            </p>
          </div>
          <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Quick start:</strong>
            <pre className="mt-2 overflow-x-auto font-mono text-[11px]">
{`git clone https://github.com/lutzashl290788-cell/webscan-website
cd webscan-website/mini-services/scan-service
bun install && bun index.ts`}
            </pre>
            <p className="mt-2">
              Then enter <code className="rounded bg-secondary px-1">http://localhost:3030</code> above.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onSave("")}>
            Use default
          </Button>
          <Button onClick={() => onSave(url)} className="glow-primary">
            <Check className="mr-1.5 h-4 w-4" />
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
