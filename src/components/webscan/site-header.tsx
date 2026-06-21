"use client";

import { Shield, Github, BookOpen, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "./settings-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <Shield className="h-5 w-5 text-primary" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">WebScan</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              v2.5.3 · AI triage
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="#analyzer">Analyzer</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#plugins">Plugins</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#benchmark">Benchmark</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#compare">Compare</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#docs">Docs</a>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <SettingsDialog />
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/lutzashl290788-cell/webscan"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>
          <Button size="sm" asChild className="glow-primary">
            <a href="#analyzer">
              <Terminal className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Open analyzer</span>
              <span className="sm:hidden">Analyze</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
