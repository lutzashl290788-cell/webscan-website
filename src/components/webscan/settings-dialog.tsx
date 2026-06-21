"use client";

import { useState } from "react";
import { Settings, KeyRound, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  loadGLMConfig,
  saveGLMConfig,
  clearGLMConfig,
  DEFAULT_GLM_CONFIG,
  type GLMConfig,
} from "@/lib/glm-client";

export function SettingsDialog() {
  // Initial state reads from localStorage lazily — only runs on the client
  // (this is a client component) and avoids the "setState in effect" pattern
  // that React 19's lint rules flag.
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<GLMConfig>(() => loadGLMConfig());
  const [showKey, setShowKey] = useState(false);
  const [configured, setConfigured] = useState(() => !!loadGLMConfig().apiKey);
  const { toast } = useToast();

  function handleOpenChange(next: boolean) {
    if (next) {
      // Refresh from localStorage every time the dialog opens — the user may
      // have cleared it from another tab.
      const loaded = loadGLMConfig();
      setConfig(loaded);
      setConfigured(!!loaded.apiKey);
    }
    setOpen(next);
  }

  function save() {
    saveGLMConfig(config);
    setConfigured(!!config.apiKey);
    toast({
      title: "Settings saved",
      description: config.apiKey
        ? `GLM endpoint configured (${config.model}).`
        : "API key cleared — AI features will be unavailable.",
    });
    setOpen(false);
  }

  function clear() {
    clearGLMConfig();
    setConfig({ ...DEFAULT_GLM_CONFIG });
    setConfigured(false);
    toast({
      title: "Settings cleared",
      description: "Your API key has been removed from this browser.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">AI Settings</span>
          {configured && (
            <Badge
              variant="outline"
              className="ml-1.5 border-emerald-500/30 bg-emerald-500/10 px-1 text-[10px] text-emerald-500"
            >
              <Check className="h-2.5 w-2.5" />
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            AI Configuration
          </DialogTitle>
          <DialogDescription>
            Connect your GLM API key to enable AI triage and chat. Your key is
            stored locally in your browser only — never sent to any server
            other than the configured LLM endpoint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="endpoint">API Endpoint</Label>
            <Input
              id="endpoint"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              placeholder={DEFAULT_GLM_CONFIG.endpoint}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Default: Z.AI public endpoint. Compatible with OpenAI, Azure
              OpenAI, OpenRouter — change URL accordingly.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="glm-4.6"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              GLM 4.6 is Z.AI&apos;s most capable public model. Other options:{" "}
              <code className="rounded bg-secondary px-1">glm-4-flash</code> (fast/cheap),{" "}
              <code className="rounded bg-secondary px-1">glm-4-air</code> (balanced).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Paste your GLM API key…"
                className="pr-10 font-mono text-xs"
                autoComplete="off"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get a key at{" "}
              <a
                href="https://z.ai/manage-apikey/apikey-list"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                z.ai/manage-apikey
              </a>
              .
            </p>
          </div>

          <div className="rounded-md border border-border bg-secondary/30 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">Privacy:</strong> Your API
                key is stored in <code className="rounded bg-secondary px-1">localStorage</code>{" "}
                on this device only. Requests go directly from your browser to
                the configured endpoint — no proxy, no logs on our side. Clear
                your browser data to remove it permanently.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {configured && (
            <Button variant="ghost" onClick={clear} className="mr-auto">
              Clear
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} className="glow-primary">
            <Check className="mr-1.5 h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
