# WebScan — AI-Powered Security Report Analyzer

The official website for [WebScan](https://github.com/lutzashl290788-cell/webscan) —
an open-source web security auditor with 38 plugins and 0 known security findings.

**Live site**: https://lutzashl290788-cell.github.io/webscan-website/

## What this site does

- **Upload a WebScan JSON report** → parse and visualize findings in your browser
- **AI triage with GLM 5.2** → each finding is labeled `likely_true_positive` /
  `likely_false_positive` / `uncertain` with a rationale and recommended action
- **Chat with GLM about the report** → ask "which finding should I fix first?"
  or "show me curl commands to reproduce the top 3 findings"
- **Plugin explorer** → browse all 38 WebScan plugins with filters by category,
  severity, and type
- **Benchmark + comparison** → WebScan vs Nuclei vs OWASP ZAP vs Nikto
- **Documentation** → quickstart, CLI reference, library API, plugin SDK

## Privacy

The site is **100% static** — no backend, no proxy, no logs. Your GLM API key
is stored in `localStorage` on your device only. Requests go directly from your
browser to the configured LLM endpoint (default: Z.AI public API). Clear your
browser data to remove the key permanently.

## Tech stack

- Next.js 16 (App Router, static export)
- TypeScript 5
- Tailwind CSS 4 + shadcn/ui (New York)
- Pure-fetch GLM client (no SDK — works on static hosting)

## Local development

```bash
bun install
bun run dev          # http://localhost:3000
bun run lint         # ESLint
```

## Build for GitHub Pages

```bash
BUILD_FOR_PAGES=1 bun run build
# Static output lands in ./out
```

The CI workflow (`.github/workflows/deploy-pages.yml`) does this automatically
on every push to `main` and deploys to GitHub Pages.

## Custom domain

To use a custom domain (e.g. `webscan.example.dev`):

1. Buy the domain.
2. In the repo: Settings → Pages → Custom domain → enter `webscan.example.dev`.
3. At your DNS provider, add a CNAME record:
   ```
   webscan.example.dev.   CNAME   lutzashl290788-cell.github.io.
   ```
4. Set the `CUSTOM_DOMAIN` repository variable (Settings → Secrets and
   variables → Actions → Variables) to `1`. This disables the `/webscan-website`
   basePath in the Next.js build.
5. Push to `main` — the workflow rebuilds with the root-relative paths.

## License

MIT — same as the main WebScan project.
