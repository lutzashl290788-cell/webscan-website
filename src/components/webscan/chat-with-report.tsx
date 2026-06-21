"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare, Trash2, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  loadGLMConfig,
  chatComplete,
  type ChatMessage,
  type GLMError,
} from "@/lib/glm-client";
import type { ScanReport } from "@/lib/webscan-report";

interface ChatWithReportProps {
  report: ScanReport;
}

const SYSTEM_PROMPT_PREFIX = `You are WebScan AI — a senior web application security analyst helping the user understand and act on a WebScan security report. The user has uploaded a real WebScan JSON report. Here is the structured summary:

<report_summary>
`;

const SYSTEM_PROMPT_SUFFIX = `
</report_summary>

Guidelines:
- Be concise and direct. The user is technical — skip generic security basics.
- When discussing specific findings, cite the plugin name and title exactly as they appear.
- Recommend concrete remediation steps, not vague "best practices".
- If asked to rank findings by exploitability, consider: severity × confidence × exploitability × business impact.
- If asked about false positives, explain WHY a finding may be a FP (e.g. "headers plugin reports Missing CSP as HIGH, but if you have CSP in a meta tag it's still effective").
- Suggest manual verification steps when appropriate.
- If you don't know or the question is out of scope, say so.

Respond in Markdown. Use code blocks for commands, headers, and config snippets.`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export function ChatWithReport({ report }: ChatWithReportProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Build the system context from the report (compact summary to keep tokens manageable).
  const reportSummary = useCallback((): string => {
    const lines: string[] = [];
    lines.push(`Scan: ${report.scan_started ?? "?"} → ${report.scan_finished ?? "?"}`);
    lines.push(`Targets: ${report.targets.length}`);
    lines.push(`Total findings: ${report.total_findings ?? 0}`);
    lines.push("");
    report.targets.forEach((t, ti) => {
      lines.push(`### Target ${ti + 1}: ${t.target}`);
      t.findings.forEach((f, fi) => {
        lines.push(
          `  ${fi + 1}. [${f.severity.toUpperCase()} / ${f.confidence}] ${f.plugin}: ${f.title}`
        );
        if (f.description) {
          lines.push(`     Description: ${f.description.slice(0, 200)}`);
        }
      });
      lines.push("");
    });
    return lines.join("\n");
  }, [report]);

  // Auto-scroll to bottom on new message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  async function send() {
    const userText = input.trim();
    if (!userText || loading) return;

    const config = loadGLMConfig();
    if (!config.apiKey) {
      toast({
        title: "No API key",
        description: "Open AI Settings and paste your GLM API key first.",
        variant: "destructive",
      });
      return;
    }

    setInput("");
    const nextHistory: ChatTurn[] = [...history, { role: "user", content: userText }];
    setHistory(nextHistory);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT_PREFIX + reportSummary() + SYSTEM_PROMPT_SUFFIX },
        ...nextHistory.map((t) => ({ role: t.role, content: t.content })),
      ];
      const reply = await chatComplete(config, messages, {
        temperature: 0.4,
        maxTokens: 1200,
        signal: controller.signal,
      });
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      setHistory((h) => [
        ...h,
        { role: "assistant", content: `**Error:** ${msg}`, error: true },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function clearChat() {
    setHistory([]);
  }

  function fillPrompt(text: string) {
    setInput(text);
  }

  const SUGGESTED_PROMPTS = [
    "Which finding should I fix first?",
    "Are any of these likely false positives?",
    "Show me the curl commands to reproduce the top 3 findings.",
    "Write a remediation plan I can paste into a Jira ticket.",
  ];

  return (
    <Card className="flex h-[600px] flex-col border-border/60 bg-card/40">
      <CardHeader className="flex-row items-center justify-between border-b border-border/60 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          Chat with GLM about this report
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            context: {report.targets.length} target(s) · {report.total_findings ?? 0} findings
          </Badge>
          {history.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearChat}>
              <Trash2 className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        <ScrollArea className="flex-1" ref={scrollRef as never}>
          <div className="space-y-3 pr-2">
            {history.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="mb-4 text-sm text-muted-foreground">
                  Ask anything about the loaded report.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      onClick={() => fillPrompt(p)}
                      className="text-xs"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {history.map((turn, i) => (
              <MessageBubble key={i} turn={turn} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                GLM is thinking…
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about the findings, false positives, remediation…"
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="glow-primary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Press Enter to send · Shift+Enter for newline. Chat context includes
          the full report summary. GLM may make mistakes — verify critical advice.
        </p>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-secondary ring-1 ring-border"
            : turn.error
              ? "bg-red-500/15 ring-1 ring-red-500/30"
              : "bg-primary/15 ring-1 ring-primary/30"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        ) : turn.error ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-primary" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${
          isUser
            ? "border-primary/30 bg-primary/10"
            : turn.error
              ? "border-red-500/30 bg-red-500/5"
              : "border-border/60 bg-background/60"
        }`}
      >
        <FormattedContent content={turn.content} />
      </div>
    </div>
  );
}

/**
 * Lightweight Markdown-ish formatter — bold, code, code blocks, line breaks.
 * Avoids a full markdown dependency for the static export.
 */
function FormattedContent({ content }: { content: string }) {
  // Split out fenced code blocks.
  const parts = content.split(/```(?:[a-zA-Z]+)?\n?/);
  return (
    <div className="space-y-2 leading-relaxed">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          // Odd index = code block content.
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-md border border-border/60 bg-[#0a0d12] p-2 font-mono text-xs"
            >
              <code>{part.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        // Even index = prose with inline bold/code.
        return (
          <div key={i}>
            {renderInline(part)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Split on **bold** and `code` while keeping delimiters.
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">
          {tok.slice(1, -1)}
        </code>
      );
    }
    // Render newlines as <br/>.
    return tok.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}
