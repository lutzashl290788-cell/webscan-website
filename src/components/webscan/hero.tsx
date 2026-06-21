import { Github, Star, GitFork, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border/60 bg-grid"
    >
      {/* Radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />
      {/* Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="container relative mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badges row */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <Zap className="mr-1 h-3 w-3" />
              v2.5.3 — zero known CVEs
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              GLM 5.2 AI triage built-in
            </Badge>
            <Badge variant="outline" className="border-border bg-secondary/50 text-muted-foreground">
              MIT licensed · 860 tests
            </Badge>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
            <span className="bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
              WebScan
            </span>
          </h1>

          <p className="mx-auto mb-3 max-w-2xl text-balance text-xl font-medium text-foreground md:text-2xl">
            Automated web security auditor.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Crawl → discover → audit. <strong className="text-foreground">38 plugins</strong>,{" "}
            <strong className="text-foreground">6 report formats</strong>, polite defaults, content-verified findings —{" "}
            <strong className="text-primary">4.8× faster than Nuclei</strong>, zero false positives.
          </p>

          {/* CTA buttons */}
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="glow-primary w-full sm:w-auto">
              <a href="#analyzer">
                <Zap className="mr-2 h-4 w-4" />
                Open the analyzer
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <a
                href="https://github.com/lutzashl290788-cell/webscan"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>

          {/* Install command */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="flex items-center gap-2 rounded-md border border-border bg-card/80 px-4 py-2.5 font-mono text-sm">
              <span className="select-none text-muted-foreground">$</span>
              <code className="flex-1 text-left text-foreground">
                pip install webscan-security
              </code>
              <span className="cursor-blink text-primary">▊</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Plugins", value: "38" },
              { label: "Scan time", value: "7.1s" },
              { label: "False positives", value: "0" },
              { label: "CVE database", value: "350K+" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/60 bg-card/40 p-4">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* GitHub stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500" />
              23 stars
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GitFork className="h-4 w-4" />
              6 forks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-emerald-500" />
              0 open issues
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              CI passing on 3.10/3.11/3.12
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
