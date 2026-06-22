"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "en" ? "ru" : "en")}
      className="px-2"
      aria-label="Toggle language"
      title={lang === "en" ? "Переключить на русский" : "Switch to English"}
    >
      <Globe className="mr-1 h-4 w-4" />
      <span className="font-mono text-xs font-semibold uppercase">{lang}</span>
    </Button>
  );
}
