import { SiteHeader } from "@/components/webscan/site-header";
import { Hero } from "@/components/webscan/hero";
import { Features } from "@/components/webscan/features";
import { Analyzer } from "@/components/webscan/analyzer";
import { PluginExplorer } from "@/components/webscan/plugin-explorer";
import { Benchmark } from "@/components/webscan/benchmark";
import { Docs } from "@/components/webscan/docs";
import { SiteFooter } from "@/components/webscan/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <Analyzer />
        <PluginExplorer />
        <Benchmark />
        <Docs />
      </main>
      <SiteFooter />
    </div>
  );
}
