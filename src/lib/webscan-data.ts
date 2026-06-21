/**
 * WebScan plugin catalog — 38 plugins.
 * Source of truth for the plugin explorer on the landing page.
 */

export type PluginType = "active" | "passive";
export type PluginCategory =
  | "Configuration"
  | "Injection"
  | "Crypto"
  | "Headers"
  | "Discovery"
  | "Business Logic"
  | "Cache";

export interface Plugin {
  name: string;
  type: PluginType;
  category: PluginCategory;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cwe: string;
  description: string;
  optIn?: boolean;
}

export const PLUGINS: Plugin[] = [
  // Configuration
  { name: "config_files", type: "active", category: "Configuration", severity: "high", cwe: "CWE-538", description: "50+ exposed files: .env, .git/config, wp-config.php, SSH keys, SQL dumps" },
  { name: "secrets", type: "passive", category: "Configuration", severity: "high", cwe: "CWE-200", description: "Leaked API keys in HTML/JS: AWS, Anthropic, OpenAI, Stripe, GitHub, Slack, JWTs (redacted)" },
  { name: "security_txt", type: "passive", category: "Configuration", severity: "info", cwe: "CWE-1023", description: "security.txt presence, format, and best-practice fields" },
  { name: "robots_sitemap", type: "passive", category: "Configuration", severity: "low", cwe: "CWE-538", description: "robots.txt / sitemap.xml hygiene + sensitive paths leaked via Disallow" },
  { name: "backup_files", type: "active", category: "Configuration", severity: "high", cwe: "CWE-538", description: ".bak/.old/.orig/~/.save — 10 files × 5 extensions, source-verified" },

  // Headers
  { name: "headers", type: "passive", category: "Headers", severity: "high", cwe: "CWE-693", description: "CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy" },
  { name: "cors", type: "passive", category: "Headers", severity: "medium", cwe: "CWE-942", description: "Reflected Origin, wildcard *, credentials exposure" },
  { name: "cookies", type: "passive", category: "Headers", severity: "medium", cwe: "CWE-614", description: "Missing Secure / HttpOnly / SameSite flags" },
  { name: "clickjacking", type: "passive", category: "Headers", severity: "medium", cwe: "CWE-1021", description: "Missing X-Frame-Options and CSP frame-ancestors; flags ALLOW-FROM (obsolete)" },
  { name: "verbose_errors", type: "passive", category: "Headers", severity: "low", cwe: "CWE-209", description: "Stack traces, PHP warnings, Spring Boot, Node.js, debug mode" },

  // Injection
  { name: "sql_injection", type: "active", category: "Injection", severity: "critical", cwe: "CWE-89", description: "Error-based, boolean-blind and time-blind — MySQL / PostgreSQL / MSSQL / Oracle" },
  { name: "xss", type: "active", category: "Injection", severity: "critical", cwe: "CWE-79", description: "Reflected XSS in query parameters with injection-context classification" },
  { name: "ssti", type: "active", category: "Injection", severity: "critical", cwe: "CWE-1336", description: "Jinja2/Twig/FreeMarker/ERB/Smarty — 7 syntax variants, content-verified" },
  { name: "lfi_rfi", type: "active", category: "Injection", severity: "critical", cwe: "CWE-98", description: "Path-traversal + PHP wrappers (php://filter); content-verified file markers" },
  { name: "xxe", type: "active", category: "Injection", severity: "critical", cwe: "CWE-611", description: "XML endpoints probed with internal + external entity payloads; per-scan random marker" },
  { name: "path_traversal", type: "active", category: "Injection", severity: "high", cwe: "CWE-22", description: "../../../etc/passwd, windows/win.ini and encoded variants" },
  { name: "graphql_depth", type: "active", category: "Injection", severity: "high", cwe: "CWE-770", description: "Depth attack (50-level query) + field suggestion info disclosure" },

  // Crypto
  { name: "jwt_audit", type: "passive", category: "Crypto", severity: "high", cwe: "CWE-347", description: "alg=none, weak HMAC secrets, missing/expired exp, sensitive claims, kid/jku/x5u vectors" },
  { name: "ssl_tls", type: "passive", category: "Crypto", severity: "medium", cwe: "CWE-326", description: "Weak protocols (SSLv2/3, TLS 1.0/1.1), expired/expiring certs, missing HSTS" },

  // Discovery
  { name: "directories", type: "active", category: "Discovery", severity: "medium", cwe: "CWE-538", description: "/admin, /backup, /.git/, phpMyAdmin and open directory listings" },
  { name: "subdomains", type: "active", category: "Discovery", severity: "low", cwe: "CWE-200", description: "DNS brute force + Certificate Transparency logs (crt.sh)" },
  { name: "tech_fingerprint", type: "passive", category: "Discovery", severity: "info", cwe: "CWE-200", description: "Server / framework / CMS detection from headers, cookies & HTML" },
  { name: "http_methods", type: "active", category: "Discovery", severity: "medium", cwe: "CWE-650", description: "Dangerous methods enabled: PUT, DELETE, TRACE, CONNECT, PATCH" },
  { name: "graphql", type: "active", category: "Discovery", severity: "high", cwe: "CWE-200", description: "GraphQL endpoints with introspection enabled (schema disclosure) — opt-in", optIn: true },
  { name: "cve_lookup", type: "active", category: "Discovery", severity: "high", cwe: "CWE-1035", description: "Maps detected software/versions to known CVEs via NVD, linked to cve.org — opt-in", optIn: true },

  // Business Logic
  { name: "open_redirect", type: "active", category: "Business Logic", severity: "medium", cwe: "CWE-601", description: "?next=, ?redirect=, ?url= — 13 payload variants, content-verified via Location host" },
  { name: "ssrf", type: "active", category: "Business Logic", severity: "critical", cwe: "CWE-918", description: "AWS/GCP metadata & localhost probes (response-signature based)" },
  { name: "csrf", type: "passive", category: "Business Logic", severity: "medium", cwe: "CWE-352", description: "POST/PUT/PATCH forms missing CSRF tokens (skips login/search, respects SameSite cookies)" },
  { name: "idor", type: "active", category: "Business Logic", severity: "high", cwe: "CWE-639", description: "API endpoints probed with ±1 object IDs; similarity ≥0.85 + soft-404 + auth-error suppression" },
  { name: "mass_assignment", type: "active", category: "Business Logic", severity: "high", cwe: "CWE-624", description: "Injects role=admin via PUT on API endpoints, content-verified — opt-in", optIn: true },
  { name: "race_condition", type: "active", category: "Business Logic", severity: "high", cwe: "CWE-362", description: "10 concurrent requests, flags when multiple succeed — opt-in", optIn: true },
  { name: "prototype_pollution", type: "passive", category: "Business Logic", severity: "medium", cwe: "CWE-1321", description: "Scans JS for $.extend, Object.assign, merge/extend patterns" },
  { name: "file_upload", type: "active", category: "Business Logic", severity: "high", cwe: "CWE-434", description: "Sends harmless test file, verifies accessibility at predicted URL" },
  { name: "request_smuggling", type: "active", category: "Business Logic", severity: "high", cwe: "CWE-444", description: "CL.TE and TE.CL variants, timeout + marker detection — opt-in", optIn: true },
  { name: "websocket_security", type: "passive", category: "Business Logic", severity: "low", cwe: "CWE-319", description: "ws:// detection, sensitive context, wss:// discovery" },

  // Cache
  { name: "cache_poisoning", type: "active", category: "Cache", severity: "critical", cwe: "CWE-525", description: "Host, X-Forwarded-Host, X-Original-URL, X-Rewrite-URL, X-Forwarded-Server — CRITICAL when reflected in <link>/<script>" },
  { name: "host_header_injection", type: "active", category: "Cache", severity: "critical", cwe: "CWE-644", description: "Password-reset endpoints — CRITICAL when injected host appears in URL" },
  { name: "web_cache_deception", type: "active", category: "Cache", severity: "high", cwe: "CWE-525", description: "Appends .css/.js to dynamic URLs, sensitive data at extension" },
];

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  "Configuration",
  "Headers",
  "Injection",
  "Crypto",
  "Discovery",
  "Business Logic",
  "Cache",
];

export const SEVERITY_ORDER: Record<string, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500 border-red-500/30",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  info: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
};

export const TYPE_STYLES: Record<PluginType, string> = {
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  passive: "bg-purple-500/15 text-purple-500 border-purple-500/30",
};

// Benchmark data — from real test on httpbin.org, 38 plugins, safe mode
export const BENCHMARK = {
  webscan: { time: 7.1, findings: 16, fp: 0, plugins: 38 },
  nuclei: { time: 34.2, findings: 21, fp: null, plugins: 9 },
  nikto: { time: 42.6, findings: 30, fp: 5, plugins: 15 },
};

// Comparison matrix
export const COMPARISON = [
  { feature: "Language", webscan: "Python", nuclei: "Go", zap: "Java", nikto: "Perl" },
  { feature: "Scan speed", webscan: "7.1s", nuclei: "34.2s", zap: "20+ min", nikto: "42.6s" },
  { feature: "CVE database", webscan: "350K+ NVD", nuclei: "9K templates", zap: "OWASP Top 10", nikto: "6.7K+" },
  { feature: "False positives", webscan: "0 (verified)", nuclei: "Low", zap: "Medium", nikto: "5+ per scan" },
  { feature: "Confidence dimension", webscan: "Yes", nuclei: "No", zap: "No", nikto: "No" },
  { feature: "Soft-404 filter", webscan: "Yes", nuclei: "No", zap: "No", nikto: "No" },
  { feature: "Web crawler", webscan: "Yes", nuclei: "No", zap: "Yes", nikto: "No" },
  { feature: "Safe mode", webscan: "Yes", nuclei: "No", zap: "No", nikto: "No" },
  { feature: "SARIF / CI-CD", webscan: "Yes", nuclei: "Yes", zap: "Yes", nikto: "No" },
  { feature: "Report formats", webscan: "6", nuclei: "2", zap: "3", nikto: "2" },
  { feature: "Memory", webscan: "~50 MB", nuclei: "~80 MB", zap: "~3500 MB", nikto: "~30 MB" },
  { feature: "Price", webscan: "Free MIT", nuclei: "Free MIT", zap: "Free Apache", nikto: "Free GPL" },
];
