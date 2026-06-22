import { Zap, CheckCircle2, X, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BENCHMARK, COMPARISON } from "@/lib/webscan-data";

export function Benchmark() {
  const maxTime = Math.max(BENCHMARK.webscan.time, BENCHMARK.nuclei.time, BENCHMARK.nikto.time);

  return (
    <section id="benchmark" className="border-b border-border/60 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <Zap className="mr-1 h-3 w-3" />
            Real benchmark · httpbin.org · 38 plugins
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Speed without trade-offs
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Same target, same machine, single cold run. WebScan finishes before
            Nuclei has warmed up — and every finding it reports is real.
          </p>
        </div>

        {/* Bar chart */}
        <div className="mx-auto mb-12 max-w-3xl space-y-6">
          {[
            { name: "WebScan", data: BENCHMARK.webscan, color: "bg-primary", text: "text-primary" },
            { name: "Nuclei 3.8.0", data: BENCHMARK.nuclei, color: "bg-yellow-500", text: "text-yellow-500" },
            { name: "Nikto 2.6.0", data: BENCHMARK.nikto, color: "bg-orange-500", text: "text-orange-500" },
          ].map((s) => (
            <div key={s.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <span className={`font-mono font-bold ${s.text}`}>
                  {s.data.time}s
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full ${s.color} transition-all`}
                  style={{ width: `${(s.data.time / maxTime) * 100}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{s.data.findings} findings</span>
                <span>
                  {s.data.fp === 0
                    ? "0 false positives"
                    : s.data.fp === null
                      ? "—"
                      : `${s.data.fp}+ false positives`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Key takeaways */}
        <div className="mx-auto mb-16 grid max-w-4xl gap-4 md:grid-cols-3">
          <Card className="h-full border-primary/30 bg-primary/5">
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-primary">4.8×</div>
              <div className="mt-1 text-sm text-muted-foreground">
                faster than Nuclei
              </div>
            </CardContent>
          </Card>
          <Card className="h-full border-primary/30 bg-primary/5">
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-primary">6.0×</div>
              <div className="mt-1 text-sm text-muted-foreground">
                faster than Nikto
              </div>
            </CardContent>
          </Card>
          <Card className="h-full border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-emerald-500">0</div>
              <div className="mt-1 text-sm text-muted-foreground">
                false positives — content-verified
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison table */}
        <div id="compare" className="mx-auto max-w-5xl">
          <h3 className="mb-4 text-center text-2xl font-bold tracking-tight">
            How WebScan stacks up
          </h3>
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-card/40 hover:bg-card/40">
                    <TableHead className="w-1/3">Feature</TableHead>
                    <TableHead className="text-primary">WebScan</TableHead>
                    <TableHead>Nuclei</TableHead>
                    <TableHead>OWASP ZAP</TableHead>
                    <TableHead>Nikto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARISON.map((row) => (
                    <TableRow key={row.feature} className="border-border/40">
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {row.webscan}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.nuclei}</TableCell>
                      <TableCell className="text-muted-foreground">{row.zap}</TableCell>
                      <TableCell className="text-muted-foreground">{row.nikto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Verdict row */}
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { name: "WebScan", rating: "★★★★★", note: "Fastest, cleanest, free MIT", winner: true },
              { name: "Nuclei", rating: "★★★☆☆", note: "4.7× slower; info-level noise" },
              { name: "OWASP ZAP", rating: "★★★☆☆", note: "~3,500 MB RAM; slow" },
              { name: "Nikto", rating: "★★☆☆☆", note: "5+ false positives per scan" },
            ].map((v) => (
              <Card
                key={v.name}
                className={
                  v.winner
                    ? "h-full border-primary/40 bg-primary/5"
                    : "h-full border-border/60 bg-card/40"
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{v.name}</span>
                    {v.winner ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-yellow-500">{v.rating}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{v.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
