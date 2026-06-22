/**
 * WebScan scan-service — a tiny bun HTTP server that runs `webscan` commands.
 *
 * Security:
 * - Only the `webscan` binary is allowed (no shell, no other commands).
 * - Arguments are passed as an array (execFile-style) — no shell injection.
 * - Target URLs are validated against a strict http(s):// pattern.
 * - Max 1 concurrent scan (queue or reject).
 * - 60-second timeout per scan.
 * - Output streamed via SSE so the frontend terminal can render progress.
 *
 * The frontend talks to this via /api/scan?XTransformPort=3030 (Caddy gateway
 * in the sandbox) or directly via http://localhost:3030 (local dev).
 *
 * On GitHub Pages this service doesn't exist — the frontend detects that and
 * shows "run webscan serve locally" instructions instead.
 */
import { spawn } from "node:child_process";
import { createServer, IncomingMessage, ServerResponse } from "node:http";

const PORT = 3030;
const MAX_CONCURRENT = 1;
const SCAN_TIMEOUT_MS = 60_000;

const URL_RE = /^https?:\/\/[A-Za-z0-9._/:?&=%-]+$/;

// Allowlist of webscan flags — anything else is rejected.
const ALLOWED_FLAGS = new Set([
  "-t", "--target",
  "-f", "--file",
  "--plugins",
  "--safe-mode",
  "--no-color",
  "-q", "--quiet",
  "-v", "--verbose",
  "--format",
  "-o", "--output",
  "--explain",
  "--min-severity",
  "--min-confidence",
  "--soft-404",
  "--no-bruteforce",
  "--concurrency",
  "--timeout",
  "--proxy",
  "--random-agent",
  "--random-delay",
  "--strict-ssl",
  "--crawl",
  "--depth",
  "--max-urls",
  "--scope",
  "--exclude",
  "--cookie",
  "--header",
  "--basic-auth",
  "--login-url",
  "--login-data",
  "--anonymize",
  "--rate-limit",
  "--delay",
  "--retries",
  "--retry-backoff",
]);

let activeScans = 0;

interface ParsedCommand {
  args: string[];
  targets: string[];
}

/**
 * Parse and validate a webscan command string.
 * Returns null if the command is not a safe webscan invocation.
 */
function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Tokenize — simple split on whitespace (we don't support quoted args with
  // spaces for now; webscan targets are URLs without spaces).
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return null;

  // First token must be `webscan` (case-insensitive).
  if (tokens[0].toLowerCase() !== "webscan") return null;
  const rest = tokens.slice(1);

  // Drop `--list-plugins` / `serve` / `--help` — those don't produce a scan
  // report we can parse. We only allow actual scan commands.
  if (rest.includes("--list-plugins") || rest.includes("serve") || rest.includes("--help") || rest.includes("-h")) {
    return null;
  }

  // Walk the tokens; collect targets and validate flags.
  const args: string[] = [];
  const targets: string[] = [];
  let expectValue = false;
  let valueFlag = "";

  for (const tok of rest) {
    if (expectValue) {
      // This token is the value for the previous flag.
      // If the flag was -t / --target, validate as URL.
      if (valueFlag === "-t" || valueFlag === "--target") {
        if (!URL_RE.test(tok)) return null;
        targets.push(tok);
      }
      args.push(tok);
      expectValue = false;
      continue;
    }
    if (tok.startsWith("-")) {
      // It's a flag. Some flags take a value, some don't.
      if (!ALLOWED_FLAGS.has(tok)) return null;
      args.push(tok);
      // Flags that DON'T take a value (boolean):
      const boolFlags = new Set([
        "--safe-mode", "--no-color", "-q", "--quiet", "-v", "--verbose",
        "--explain", "--soft-404", "--no-bruteforce", "--random-agent",
        "--random-delay", "--strict-ssl", "--crawl", "--anonymize",
      ]);
      if (!boolFlags.has(tok)) {
        expectValue = true;
        valueFlag = tok;
      }
      continue;
    }
    // Non-flag token without preceding -t — could be a positional target.
    // webscan's CLI requires -t, so reject bare positionals for safety.
    return null;
  }

  if (expectValue) return null; // dangling flag with no value
  if (targets.length === 0) return null; // no target — nothing to scan

  return { args, targets };
}

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 64 * 1024) {
        // 64 KiB max body — a webscan command is tiny.
        reject(new Error("body too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Strip query string for route matching — Caddy passes XTransformPort through.
  const url = (req.url ?? "").split("?")[0];

  if (req.method === "GET" && url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      activeScans,
      maxConcurrent: MAX_CONCURRENT,
      webscanInstalled: await isWebscanInstalled(),
    });
    return;
  }

  if (req.method === "POST" && url === "/api/scan") {
    if (activeScans >= MAX_CONCURRENT) {
      sendJson(res, 429, { error: "another scan is already running — wait for it to finish" });
      return;
    }

    let body: string;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { error: "invalid request body" });
      return;
    }

    let parsed: { command?: string };
    try {
      parsed = JSON.parse(body);
    } catch {
      sendJson(res, 400, { error: "invalid JSON" });
      return;
    }

    const command = parsed.command ?? "";
    const parsedCmd = parseCommand(command);
    if (!parsedCmd) {
      sendJson(res, 400, {
        error:
          "command must be 'webscan -t <http(s)://URL> [flags]'. Only webscan is allowed; flags restricted to the allowlist.",
      });
      return;
    }

    // Force JSON output to /tmp so we can read it back and return structured
    // findings to the frontend.
    const outFile = `/tmp/webscan-scan-${Date.now()}.json`;
    const fullArgs = [
      ...parsedCmd.args,
      "--format", "json",
      "-o", outFile,
      "--no-color",
    ];

    activeScans++;
    setCors(res);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send("start", { command: `webscan ${fullArgs.join(" ")}`, targets: parsedCmd.targets });

    const child = spawn("webscan", fullArgs, {
      cwd: "/tmp",
      env: {
        ...process.env,
        FORCE_COLOR: "0",
        NO_COLOR: "1",
        // Ensure pip-installed binaries (in ~/.local/bin) are findable.
        PATH: `/home/z/.local/bin:${process.env.PATH ?? ""}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      send("error", { message: "scan timed out after 60s" });
      res.end();
    }, SCAN_TIMEOUT_MS);

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      // Stream line-by-line to the frontend.
      for (const line of text.split("\n")) {
        if (line.trim()) send("stdout", { line });
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      for (const line of text.split("\n")) {
        if (line.trim()) send("stderr", { line });
      }
    });

    child.on("close", async (code: number | null) => {
      clearTimeout(timeout);
      activeScans = Math.max(0, activeScans - 1);

      // Try to read the JSON report and send it back.
      let report: unknown = null;
      try {
        const fs = await import("node:fs/promises");
        const raw = await fs.readFile(outFile, "utf-8");
        report = JSON.parse(raw);
        // Clean up.
        await fs.unlink(outFile).catch(() => {});
      } catch {
        // Report file may not exist if the scan failed early.
      }

      send("exit", { code, report });
      res.end();
    });

    child.on("error", (err: Error) => {
      clearTimeout(timeout);
      activeScans = Math.max(0, activeScans - 1);
      send("error", { message: `failed to start webscan: ${err.message}. Is webscan installed?` });
      res.end();
    });

    // Client disconnect → kill the scan.
    req.on("close", () => {
      clearTimeout(timeout);
      child.kill("SIGTERM");
      activeScans = Math.max(0, activeScans - 1);
    });
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

async function isWebscanInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    // webscan doesn't have --version; --help exits 0 (or 2 in some Python argparse builds,
    // but the key signal is that the process started without ENOENT). We resolve true
    // if we got *any* exit/close event (the binary exists) — error event means ENOENT.
    const child = spawn("webscan", ["--help"], {
      stdio: "ignore",
      env: {
        ...process.env,
        PATH: `/home/z/.local/bin:${process.env.PATH ?? ""}`,
      },
    });
    let resolved = false;
    const done = (v: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(v);
      }
    };
    child.on("error", () => done(false));
    child.on("close", () => done(true));
    setTimeout(() => {
      try { child.kill(); } catch { /* ignore */ }
      done(false);
    }, 3000);
  });
}

// Listen on :: for dual-stack (IPv4 + IPv6). Caddy in the sandbox connects
// via IPv6 (::1) by default; without this, reverse_proxy returns 502.
server.listen(PORT, "::", () => {
  console.log(`scan-service listening on http://[::]:${PORT} (dual-stack)`);
  console.log(`  GET  /health       — liveness + webscan availability`);
  console.log(`  POST /api/scan     — run a webscan command (SSE stream)`);
});
