"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Zap, Eye, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PLUGINS,
  PLUGIN_CATEGORIES,
  SEVERITY_STYLES,
  TYPE_STYLES,
  SEVERITY_ORDER,
  type PluginType,
  type Plugin,
} from "@/lib/webscan-data";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low" | "info";
type TypeFilter = "all" | PluginType;

export function PluginExplorer() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PLUGINS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (severity !== "all" && p.severity !== severity) return false;
      if (type !== "all" && p.type !== type) return false;
      if (q) {
        const hay = `${p.name} ${p.description} ${p.cwe}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  }, [search, category, severity, type]);

  const counts = useMemo(() => {
    const byType = { active: 0, passive: 0 };
    const bySev: Record<string, number> = {};
    for (const p of PLUGINS) {
      byType[p.type]++;
      bySev[p.severity] = (bySev[p.severity] ?? 0) + 1;
    }
    return { byType, bySev, total: PLUGINS.length };
  }, []);

  return (
    <section id="plugins" className="border-b border-border/60 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/10 text-primary">
            <Zap className="mr-1 h-3 w-3" />
            {counts.total} plugins · 11 passive · 27 active
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Plugin explorer
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Every plugin content-verified. Filter by category, severity, or type —
            or search by name / CWE / keyword.
          </p>
        </div>

        {/* Filters */}
        <div className="mx-auto mb-8 max-w-5xl space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plugins, CWE numbers, descriptions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search plugins"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Filter className="mr-1 h-3 w-3" />
              Category:
            </span>
            <Button
              size="sm"
              variant={category === "all" ? "default" : "outline"}
              onClick={() => setCategory("all")}
            >
              All ({counts.total})
            </Button>
            {PLUGIN_CATEGORIES.map((c) => {
              const n = PLUGINS.filter((p) => p.category === c).length;
              return (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? "default" : "outline"}
                  onClick={() => setCategory(c)}
                >
                  {c} ({n})
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Severity:
            </span>
            {(["all", "critical", "high", "medium", "low", "info"] as SeverityFilter[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={severity === s ? "default" : "outline"}
                onClick={() => setSeverity(s)}
                className={severity === s ? "" : s === "critical" ? "border-red-500/40 text-red-500" : ""}
              >
                {s === "all" ? "All" : s}
                {s !== "all" && counts.bySev[s] ? ` (${counts.bySev[s]})` : ""}
              </Button>
            ))}

            <span className="ml-4 mr-1 inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Type:
            </span>
            <Button
              size="sm"
              variant={type === "all" ? "default" : "outline"}
              onClick={() => setType("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={type === "active" ? "default" : "outline"}
              onClick={() => setType("active")}
            >
              <Zap className="mr-1 h-3 w-3" />
              Active ({counts.byType.active})
            </Button>
            <Button
              size="sm"
              variant={type === "passive" ? "default" : "outline"}
              onClick={() => setType("passive")}
            >
              <Eye className="mr-1 h-3 w-3" />
              Passive ({counts.byType.passive})
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="mx-auto mb-4 max-w-5xl text-sm text-muted-foreground">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {counts.total} plugins
        </div>

        {/* Plugin grid */}
        <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
          {filtered.map((plugin) => (
            <PluginCard key={plugin.name} plugin={plugin} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mx-auto max-w-5xl rounded-lg border border-dashed border-border p-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No plugins match these filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setSeverity("all");
                setType("all");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function PluginCard({ plugin }: { plugin: Plugin }) {
  return (
    <Card className="group h-full border-border/60 bg-card/40 transition-colors hover:border-primary/40 hover:bg-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm font-semibold text-foreground">
                {plugin.name}
              </code>
              {plugin.optIn && (
                <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-[10px]">
                  opt-in
                </Badge>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{plugin.cwe}</div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" className={`${SEVERITY_STYLES[plugin.severity]} text-[10px] uppercase`}>
              {plugin.severity}
            </Badge>
            <Badge variant="outline" className={`${TYPE_STYLES[plugin.type]} text-[10px]`}>
              {plugin.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {plugin.description}
        </p>
      </CardContent>
    </Card>
  );
}
