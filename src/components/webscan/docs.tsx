"use client";

import { useState } from "react";
import { Copy, Check, Terminal, BookOpen, Code2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-[#0a0d12]">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs opacity-60 group-hover:opacity-100"
          onClick={copy}
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Docs() {
  return (
    <section id="docs" className="border-b border-border/60 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-border bg-secondary/50 text-muted-foreground">
            <BookOpen className="mr-1 h-3 w-3" />
            Documentation
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything under one roof
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Quickstart, CLI reference, library API, plugin SDK — all in one place.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="quickstart">
                <Terminal className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Quickstart</span>
              </TabsTrigger>
              <TabsTrigger value="cli">
                <Terminal className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">CLI</span>
              </TabsTrigger>
              <TabsTrigger value="api">
                <Code2 className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Library API</span>
              </TabsTrigger>
              <TabsTrigger value="plugin">
                <Plug className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Plugin SDK</span>
              </TabsTrigger>
            </TabsList>

            {/* Quickstart */}
            <TabsContent value="quickstart" className="space-y-4">
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Install</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CodeBlock code={`# From PyPI (recommended)\npip install webscan-security\n\n# From source\ngit clone https://github.com/lutzashl290788-cell/webscan\ncd webscan && pip install .\n\n# With all extras (Claude AI, HTTP backend, dev tooling)\npip install 'webscan-security[ai,serve,dev]'`} />
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">First scan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CodeBlock code={`# Recommended for first-time / site-owner scans\nwebscan -t https://example.com --safe-mode\n\n# With explanations under each finding (beginner-friendly)\nwebscan -t https://example.com --safe-mode --explain\n\n# Filter to only directly-verified findings\nwebscan -t https://example.com --min-confidence firm\n\n# Generate HTML + SARIF reports, anonymised for sharing\nwebscan -t https://example.com \\\n  --min-severity high \\\n  -o ./reports/scan \\\n  --format html sarif \\\n  --anonymize`} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CLI */}
            <TabsContent value="cli" className="space-y-4">
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Common flags</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px]">
                    <CodeBlock lang="text" code={`TARGETS
  -t URL [URL ...]        Target URL(s) to scan
  -f FILE                 Read targets from a file (one per line)

SCAN
  --crawl                 Crawl the target before scanning (depth N)
  --depth N               Crawl depth (default: 2, requires --crawl)
  --plugins NAME [...]    Plugins to run (default: all except opt-in)
  --list-plugins          List plugins and exit
  --safe-mode             Polite rate, honest UA, robots respected
  --concurrency N         Concurrent targets (default: 10)
  --timeout SEC           Per-request timeout (default: 10)

STEALTH
  --proxy URL             HTTP/SOCKS proxy (e.g. http://127.0.0.1:8080)
  --random-agent          Rotate browser-like User-Agents
  --random-delay          Jitter pause between requests (×0.5–×1.5)
  --strict-ssl            Enforce TLS cert verification (default: off)

AUTH
  --cookie "k=v; k2=v2"   Cookie header
  --header "Name: Value"  Extra request header (repeatable)
  --basic-auth "u:p"      HTTP Basic auth
  --login-url URL         Form-login URL (with --login-data)
  --login-data "u=a&p=b"  URL-encoded login form body

FILTERING
  --min-severity SEV      Drop findings below severity (low|medium|high|critical)
  --min-confidence CON    Drop findings below confidence (firm|tentative|informational)
  --soft-404              Calibrate against bogus path, drop soft-404 hits

OUTPUT
  -o PREFIX               Output file prefix (e.g. ./reports/scan)
  --format FMT [...]      json | jsonl | md | html | sarif | csv (default: json md)
  --anonymize             Strip local paths/host/IPs from reports
  --explain               Plain-language explanation under each finding
  --quiet                 Suppress banner, progress, and disclaimer

AI (opt-in, needs [ai] extra + ANTHROPIC_API_KEY)
  --ai-triage             Use Claude to flag likely false positives
  --ai-summary            Print Claude-written executive summary

SERVE (opt-in, needs [serve] extra)
  serve --host 0.0.0.0 --port 8000   Run local HTTP backend`} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API */}
            <TabsContent value="api" className="space-y-4">
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Async library API</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock lang="python" code={`import asyncio\nimport webscan\n\n# Async (native):\nreport = asyncio.run(webscan.scan(\n    ["https://example.com"],\n    plugins=["headers", "cookies", "config_files"],\n    soft_404=True,\n    verify_ssl=True,  # enforce TLS verification\n))\n\nfor tr in report.targets:\n    for f in tr.findings:\n        print(f.severity.value, f.confidence.value, f.plugin, f.title)`} />
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Blocking convenience</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock lang="python" code={`import webscan\n\n# Blocking convenience for scripts / notebooks:\nreport = webscan.scan_sync(\n    ["https://example.com"],\n    plugins=["headers", "ssl_tls"],\n    concurrency=5,\n)\n\n# Render in any format\nfrom webscan import Reporter\nReporter(report).to_jsonl("findings.jsonl")\nReporter(report).to_sarif("findings.sarif")\nReporter(report).to_html("findings.html")`} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plugin SDK */}
            <TabsContent value="plugin" className="space-y-4">
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Write a plugin in 20 lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock lang="python" code={`from __future__ import annotations\nimport aiohttp\nfrom webscan.models import Confidence, Finding, Severity\nfrom webscan.plugins.base import BasePlugin\n\nclass MyPlugin(BasePlugin):\n    name = "my_plugin"\n    description = "What it checks in one line"\n\n    async def run(\n        self,\n        target: str,\n        session: aiohttp.ClientSession,\n    ) -> list[Finding]:\n        findings: list[Finding] = []\n        # ... perform checks, append Finding(...) objects ...\n        # Use Confidence.FIRM for directly-observed results,\n        # Confidence.TENTATIVE for heuristics,\n        # Confidence.INFORMATIONAL for "manual review needed".\n        return findings`} />
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Register &amp; ship</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock lang="toml" code={`# pyproject.toml — register under the entry-point group\n[project.entry-points."webscan.plugins"]\nmy_plugin = "my_pkg.plugin:MyPlugin"`} />
                  <p className="mt-3 text-sm text-muted-foreground">
                    That&apos;s it. <code className="rounded bg-secondary px-1 font-mono">pip install my_pkg</code> and{" "}
                    <code className="rounded bg-secondary px-1 font-mono">webscan --plugins my_plugin</code> just works.
                    Built-ins are protected against third-party shadowing (supply-chain guard, CWE-1357).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
