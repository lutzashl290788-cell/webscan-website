import {
  Shield,
  Zap,
  Eye,
  FileCheck,
  Lock,
  Network,
  RefreshCw,
  Filter,
  Code2,
  Cookie,
  Bot,
  Cloud,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Bot,
    title: "GLM 5.2 AI triage",
    description: "Upload any WebScan JSON report — GLM reviews each finding and labels it likely_true_positive / likely_false_positive / uncertain with a rationale. Chat with the model about remediation, exploitability, and false-positive reasoning.",
    accent: "text-purple-500",
  },
  {
    icon: Cloud,
    title: "Static — runs on GitHub Pages",
    description: "No backend, no log surface, no proxy. Your API key lives in localStorage and goes directly to the LLM provider. Deploy the whole site as a static bundle on GitHub Pages, Cloudflare Pages, or any CDN.",
    accent: "text-cyan-500",
  },
  {
    icon: Zap,
    title: "Fastest in class",
    description: "7.1s scan with 38 plugins — 4.8× faster than Nuclei (34.2s), 6× faster than Nikto (42.6s). Async aiohttp engine with shared connection pool.",
    accent: "text-red-500",
  },
  {
    icon: Eye,
    title: "Zero false positives",
    description: "Every finding is content-verified — payload reflected, file marker matched, header literally absent. Heuristic findings carry a Confidence tag you can filter on.",
    accent: "text-emerald-500",
  },
  {
    icon: Filter,
    title: "Confidence dimension",
    description: "firm / tentative / informational. Run --min-confidence firm and only see directly-verified findings. The strongest false-positive filter available in any DAST tool.",
    accent: "text-purple-500",
  },
  {
    icon: FileCheck,
    title: "6 report formats",
    description: "JSON · JSONL · Markdown · HTML · SARIF · CSV. SARIF integrates with GitHub Code Scanning. CSV opens in Excel/Jira. JSONL is pipeline-friendly with jq.",
    accent: "text-blue-500",
  },
  {
    icon: RefreshCw,
    title: "Retry with backoff",
    description: "Transient 5xx/429 responses ride out with exponential backoff. A flaky 502/503 no longer aborts the whole scan — your CI stays green when staging is flaky.",
    accent: "text-orange-500",
  },
  {
    icon: Network,
    title: "Soft-404 filter",
    description: "Many servers answer 200 OK for every path with a templated 'Not Found' page. WebScan calibrates against a bogus path up front and suppresses those responses.",
    accent: "text-yellow-500",
  },
  {
    icon: Lock,
    title: "Safe mode",
    description: "--safe-mode caps request rate (~2 req/s), uses an honest User-Agent, lowers concurrency, and respects robots.txt. Polite enough to point at production sites.",
    accent: "text-cyan-500",
  },
  {
    icon: Cookie,
    title: "Authenticated scans",
    description: "Cookie / header / basic-auth / form-login. The crawler session and scan engine share auth, so every probe reaches protected endpoints behind login.",
    accent: "text-pink-500",
  },
  {
    icon: Code2,
    title: "Plugin SDK in 20 lines",
    description: "Subclass BasePlugin, implement run(). Register via entry-points. Get retry, soft-404, similarity helpers, and Confidence tagging for free from _active_helpers.",
    accent: "text-indigo-500",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border/60 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built for three audiences
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Site owners get safe defaults. Bug hunters get stealth and depth.
            Security teams get CI-friendly reports and zero noise.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="group relative h-full overflow-hidden border-border/60 bg-card/40 transition-colors hover:border-primary/40 hover:bg-card/80"
            >
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary ring-1 ring-border">
                  <f.icon className={`h-5 w-5 ${f.accent}`} />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </CardContent>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
