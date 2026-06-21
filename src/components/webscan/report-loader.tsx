"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileJson, X, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { parseWebScanReport, type ScanReport } from "@/lib/webscan-report";

interface ReportLoaderProps {
  onReport: (report: ScanReport, filename: string) => void;
  onClear: () => void;
  hasReport: boolean;
}

const SAMPLE_REPORT: ScanReport = {
  scan_started: "2026-06-21T19:30:00+00:00",
  scan_finished: "2026-06-21T19:30:07+00:00",
  total_findings: 12,
  targets: [
    {
      target: "https://example.com",
      scanned_at: "2026-06-21T19:30:00+00:00",
      findings: [
        {
          plugin: "headers",
          title: "Missing header: Content-Security-Policy",
          severity: "high",
          confidence: "firm",
          description: "The response does not include a Content-Security-Policy header. Without CSP, the page is vulnerable to injected scripts (XSS) and data exfiltration.",
          url: "https://example.com",
          evidence: { header: "Content-Security-Policy", status: "absent" },
          remediation: "Add a Content-Security-Policy header. Start with `default-src 'self'` and refine per-page.",
        },
        {
          plugin: "headers",
          title: "Missing header: Strict-Transport-Security",
          severity: "high",
          confidence: "firm",
          description: "HSTS header absent — without it, a downgrade attack can force a HTTPS user to HTTP.",
          url: "https://example.com",
          evidence: { header: "Strict-Transport-Security", status: "absent" },
          remediation: "Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.",
        },
        {
          plugin: "cors",
          title: "CORS reflects an arbitrary Origin",
          severity: "high",
          confidence: "firm",
          description: "The server reflects any Origin in Access-Control-Allow-Origin with Access-Control-Allow-Credentials: true. Any cross-origin site can read authenticated responses.",
          url: "https://example.com/api/me",
          evidence: {
            request_origin: "https://evil.example",
            response_acao: "https://evil.example",
            response_acac: "true",
          },
          remediation: "Whitelist specific trusted origins. Never reflect arbitrary Origins with credentials.",
        },
        {
          plugin: "clickjacking",
          title: "Clickjacking: no X-Frame-Options / CSP frame-ancestors",
          severity: "medium",
          confidence: "firm",
          description: "Neither X-Frame-Options nor CSP frame-ancestors is set. The page can be iframed by attacker sites.",
          url: "https://example.com",
          evidence: { x_frame_options: "absent", csp_frame_ancestors: "absent" },
          remediation: "Set `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`.",
        },
        {
          plugin: "headers",
          title: "Missing header: X-Content-Type-Options",
          severity: "medium",
          confidence: "firm",
          description: "Without X-Content-Type-Options: nosniff, browsers may MIME-sniff responses and execute non-HTML content as HTML.",
          url: "https://example.com",
          evidence: { header: "X-Content-Type-Options", status: "absent" },
          remediation: "Add `X-Content-Type-Options: nosniff`.",
        },
        {
          plugin: "prototype_pollution",
          title: "Prototype pollution: merge() with user input",
          severity: "medium",
          confidence: "tentative",
          description: "app.js:142 calls merge(deep, req.body) where req.body may contain __proto__. A crafted payload could pollute Object.prototype.",
          url: "https://example.com/api/settings",
          evidence: { file: "app.js", line: 142, sink: "merge(deep, req.body)" },
          remediation: "Use Object.create(null) for plain objects, or a library version that blocks __proto__.",
        },
        {
          plugin: "headers",
          title: "Missing header: Referrer-Policy",
          severity: "low",
          confidence: "firm",
          description: "Referrer-Policy absent — the full URL may leak in the Referer header to third parties.",
          url: "https://example.com",
          evidence: { header: "Referrer-Policy", status: "absent" },
          remediation: "Add `Referrer-Policy: strict-origin-when-cross-origin`.",
        },
        {
          plugin: "tech_fingerprint",
          title: "Information disclosure: Server header",
          severity: "low",
          confidence: "firm",
          description: "Server: nginx/1.21.6 — version disclosed. Helps attackers target known CVEs.",
          url: "https://example.com",
          evidence: { header: "Server", value: "nginx/1.21.6" },
          remediation: "Set `server_tokens off;` in nginx.conf.",
        },
        {
          plugin: "security_txt",
          title: "security.txt not found",
          severity: "info",
          confidence: "informational",
          description: "GET /.well-known/security.txt returned 404. security.txt helps researchers report vulnerabilities responsibly.",
          url: "https://example.com/.well-known/security.txt",
          evidence: { status: 404 },
        },
        {
          plugin: "tech_fingerprint",
          title: "Technologies detected: React, Next.js",
          severity: "info",
          confidence: "firm",
          description: "X-Powered-By: Next.js, react-dom in HTML, _next/static/ assets.",
          url: "https://example.com",
          evidence: { server: "nginx/1.21.6", framework: "Next.js", frontend: "React" },
        },
        {
          plugin: "subdomains",
          title: "6 subdomains discovered",
          severity: "info",
          confidence: "firm",
          description: "via Certificate Transparency logs (crt.sh): api.example.com, www.example.com, dev.example.com, staging.example.com, admin.example.com, blog.example.com.",
          url: "https://crt.sh/?q=example.com",
          evidence: { source: "crt.sh", count: 6 },
        },
        {
          plugin: "cookies",
          title: "Cookie 'session' missing SameSite=Strict",
          severity: "medium",
          confidence: "firm",
          description: "Set-Cookie: session=abc123; Path=/; HttpOnly — SameSite attribute absent. Vulnerable to CSRF.",
          url: "https://example.com",
          evidence: { cookie: "session", flags_present: ["HttpOnly"], flags_missing: ["SameSite", "Secure"] },
          remediation: "Add `SameSite=Strict; Secure` to all session cookies.",
        },
      ],
    },
  ],
};

export function ReportLoader({ onReport, onClear, hasReport }: ReportLoaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum report size is 10 MiB.",
          variant: "destructive",
        });
        return;
      }
      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        toast({
          title: "Wrong file type",
          description: "Upload a .json file produced by `webscan --format json`.",
          variant: "destructive",
        });
        return;
      }
      try {
        const text = await file.text();
        const report = parseWebScanReport(text);
        onReport(report, file.name);
        toast({
          title: "Report loaded",
          description: `${report.targets.length} target(s), ${report.total_findings ?? 0} findings.`,
        });
      } catch (err) {
        toast({
          title: "Failed to parse report",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    },
    [onReport, toast]
  );

  function loadSample() {
    onReport(SAMPLE_REPORT, "sample-report.json");
    toast({
      title: "Sample report loaded",
      description: "12 findings — try AI triage on any of them.",
    });
  }

  function downloadSample() {
    const blob = new Blob([JSON.stringify(SAMPLE_REPORT, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webscan-sample-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border/60 bg-card/40"
      }`}
    >
      <CardContent className="p-6">
        {!hasReport ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Drop a WebScan JSON report here
            </h3>
            <p className="mb-5 max-w-md text-sm text-muted-foreground">
              Run a scan with <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">webscan -t https://example.com --format json -o scan</code>{" "}
              and upload the resulting <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">scan.json</code> here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => inputRef.current?.click()} className="glow-primary">
                <FileJson className="mr-1.5 h-4 w-4" />
                Choose file
              </Button>
              <Button variant="outline" onClick={loadSample}>
                Try a sample report
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadSample}>
                <Download className="mr-1.5 h-3 w-3" />
                Download sample
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = ""; // allow re-uploading the same file
              }}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
                <FileJson className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="font-medium">Report loaded</div>
                <div className="text-xs text-muted-foreground">
                  Drop another file to replace, or clear to start over.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => inputRef.current?.click()} variant="outline" size="sm">
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                Replace
              </Button>
              <Button onClick={onClear} variant="ghost" size="sm">
                <X className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
