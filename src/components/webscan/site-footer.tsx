import { Shield, Github, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold">WebScan</span>
              <span className="text-xs text-muted-foreground">v2.5.3</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Automated CLI security auditor for web configuration vulnerabilities.
              38 plugins, 6 report formats, content-verified findings. Open source (MIT).
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              ⚖️ For authorized security testing only. Use solely on systems you own
              or have explicit written permission to test.
            </p>
          </div>

          {/* Project */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/lutzashl290788-cell/webscan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  GitHub repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/lutzashl290788-cell/webscan/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Releases (11)
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/lutzashl290788-cell/webscan/blob/main/CHANGELOG.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/lutzashl290788-cell/webscan/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Report a bug
                </a>
              </li>
              <li>
                <a
                  href="https://pypi.org/project/webscan-security/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  PyPI package
                </a>
              </li>
            </ul>
          </div>

          {/* Sections */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sections
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</a></li>
              <li><a href="#analyzer" className="text-muted-foreground transition-colors hover:text-foreground">AI analyzer</a></li>
              <li><a href="#plugins" className="text-muted-foreground transition-colors hover:text-foreground">Plugin explorer</a></li>
              <li><a href="#benchmark" className="text-muted-foreground transition-colors hover:text-foreground">Benchmark</a></li>
              <li><a href="#docs" className="text-muted-foreground transition-colors hover:text-foreground">Documentation</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-4">
            <span>© 2026 WebScan contributors</span>
            <a
              href="https://github.com/lutzashl290788-cell/webscan/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              MIT license
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="h-3 w-3 fill-primary text-primary" /> and too many CVEs
            </span>
            <a
              href="https://github.com/lutzashl290788-cell/webscan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Github className="h-3 w-3" />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
