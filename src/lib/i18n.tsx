"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "en" | "ru";

type Dict = Record<string, string>;

// English is the canonical source — Russian mirrors it 1:1 by key.
const en: Dict = {
  // Header
  "nav.analyzer": "Analyzer",
  "nav.plugins": "Plugins",
  "nav.benchmark": "Benchmark",
  "nav.compare": "Compare",
  "nav.docs": "Docs",
  "nav.settings": "AI Settings",
  "nav.openAnalyzer": "Open analyzer",
  "nav.analyze": "Analyze",

  // Hero
  "hero.badge.cve": "v2.5.3 — zero known CVEs",
  "hero.badge.ai": "GLM 5.2 AI triage built-in",
  "hero.badge.license": "MIT licensed · 860 tests",
  "hero.title": "WebScan",
  "hero.subtitle": "Automated web security auditor.",
  "hero.description": "Crawl → discover → audit. 38 plugins, 6 report formats, polite defaults, content-verified findings — 4.8× faster than Nuclei, zero false positives.",
  "hero.cta.primary": "Open the analyzer",
  "hero.cta.secondary": "View on GitHub",
  "hero.stat.plugins": "PLUGINS",
  "hero.stat.time": "SCAN TIME",
  "hero.stat.fp": "FALSE POSITIVES",
  "hero.stat.cve": "CVE DATABASE",

  // Features
  "features.title": "Built for three audiences",
  "features.subtitle": "Site owners get safe defaults. Bug hunters get stealth and depth. Security teams get CI-friendly reports and zero noise.",

  // Analyzer
  "analyzer.badge": "AI-powered analyzer",
  "analyzer.title": "Upload a scan. Get AI verdicts.",
  "analyzer.subtitle": "Run WebScan locally against any target, upload the JSON report here, and let GLM 5.2 triage each finding for false positives — then chat with the model about remediation.",
  "analyzer.step1.title": "Run WebScan",
  "analyzer.step1.desc": "pip install webscan-security && webscan -t https://yoursite.com --format json -o scan",
  "analyzer.step2.title": "Upload report",
  "analyzer.step2.desc": "Drop the scan.json file below. Parsing happens in your browser — the file never leaves your device.",
  "analyzer.step3.title": "AI triage + chat",
  "analyzer.step3.desc": "GLM 5.2 reviews each finding (false positive / real / uncertain). Chat with the model about anything in the report.",
  "analyzer.drop": "Drop a WebScan JSON report here",
  "analyzer.dropHint": "Run a scan with webscan -t https://example.com --format json -o scan and upload the resulting scan.json here.",
  "analyzer.chooseFile": "Choose file",
  "analyzer.trySample": "Try a sample report",
  "analyzer.downloadSample": "Download sample",
  "analyzer.loaded": "Report loaded",
  "analyzer.loadedHint": "Drop another file to replace, or clear to start over.",
  "analyzer.replace": "Replace",
  "analyzer.clear": "Clear",
  "analyzer.tab.findings": "Findings & AI triage",
  "analyzer.tab.chat": "Chat with GLM",
  "analyzer.tab.terminal": "Terminal",
  "analyzer.noReport": "No report loaded yet. Drop a JSON file above or try the sample report to explore the AI features.",
  "analyzer.findings": "findings",
  "analyzer.scannedAt": "scanned at",

  // Findings Explorer
  "findings.search": "Search findings by plugin, title, URL, description…",
  "findings.severity": "Severity",
  "findings.confidence": "Confidence",
  "findings.triage": "Triage",
  "findings.all": "All",
  "findings.untriaged": "Untriaged",
  "findings.triaged": "Triaged",
  "findings.tp": "True positives",
  "findings.fp": "False positives",
  "findings.showing": "Showing",
  "findings.of": "of",
  "findings.total": "total",
  "findings.triageAll": "Triage all",
  "findings.reset": "Reset",
  "findings.aiTriage": "AI triage",
  "findings.reTriage": "Re-triage",
  "findings.description": "Description",
  "findings.evidence": "Evidence",
  "findings.remediation": "Remediation",
  "findings.triageError": "Triage error",
  "findings.aiVerdict": "AI Verdict",
  "findings.confidencePct": "confidence",
  "findings.recommendedAction": "Recommended action",
  "findings.truePositive": "real",
  "findings.falsePositive": "false positive",
  "findings.uncertain": "uncertain",

  // Chat
  "chat.title": "Chat with GLM about this report",
  "chat.context": "context",
  "chat.clear": "Clear",
  "chat.placeholder": "Ask about the findings, false positives, remediation…",
  "chat.thinking": "GLM is thinking…",
  "chat.empty": "Ask anything about the loaded report.",
  "chat.hint": "Press Enter to send · Shift+Enter for newline. Chat context includes the full report summary. GLM may make mistakes — verify critical advice.",
  "chat.error": "Error",
  "chat.prompt1": "Which finding should I fix first?",
  "chat.prompt2": "Are any of these likely false positives?",
  "chat.prompt3": "Show me the curl commands to reproduce the top 3 findings.",
  "chat.prompt4": "Write a remediation plan I can paste into a Jira ticket.",

  // Terminal
  "terminal.title": "Terminal — run WebScan live",
  "terminal.subtitle": "Type webscan commands and see real output. Scans run on the server side; results auto-load into the analyzer when complete.",
  "terminal.placeholder": "Type a webscan command, e.g. webscan -t https://example.com --safe-mode",
  "terminal.run": "Run",
  "terminal.stop": "Stop",
  "terminal.clear": "Clear",
  "terminal.connecting": "Connecting to scan service…",
  "terminal.offline": "Scan service unavailable. On GitHub Pages, run `webscan serve` locally and refresh, or upload a JSON report manually.",
  "terminal.connected": "Connected to scan service",
  "terminal.hint": "Allowed: webscan commands only. Try: webscan -t https://example.com --safe-mode",
  "terminal.autoLoad": "Scan complete — auto-loading report into analyzer…",

  // Settings
  "settings.title": "AI Configuration",
  "settings.subtitle": "Connect your GLM API key to enable AI triage and chat. Your key is stored locally in your browser only — never sent to any server other than the configured LLM endpoint.",
  "settings.endpoint": "API Endpoint",
  "settings.endpointHint": "Default: Z.AI public endpoint. Compatible with OpenAI, Azure OpenAI, OpenRouter — change URL accordingly.",
  "settings.model": "Model",
  "settings.modelHint": "GLM 4.6 is Z.AI's most capable public model. Other options: glm-4-flash (fast/cheap), glm-4-air (balanced).",
  "settings.apiKey": "API Key",
  "settings.apiKeyPlaceholder": "Paste your GLM API key…",
  "settings.apiKeyHint": "Get a key at z.ai/manage-apikey.",
  "settings.privacy": "Privacy",
  "settings.privacyText": "Your API key is stored in localStorage on this device only. Requests go directly from your browser to the configured endpoint — no proxy, no logs on our side. Clear your browser data to remove it permanently.",
  "settings.save": "Save",
  "settings.cancel": "Cancel",
  "settings.clear": "Clear",
  "settings.saved": "Settings saved",
  "settings.cleared": "Settings cleared",
  "settings.clearedDesc": "Your API key has been removed from this browser.",

  // Plugins
  "plugins.title": "Plugin explorer",
  "plugins.subtitle": "Every plugin content-verified. Filter by category, severity, or type — or search by name / CWE / keyword.",
  "plugins.search": "Search plugins, CWE numbers, descriptions…",
  "plugins.category": "Category",
  "plugins.noResults": "No plugins match these filters.",
  "plugins.reset": "Reset filters",
  "plugins.showing": "Showing",

  // Benchmark
  "benchmark.badge": "Real benchmark · httpbin.org · 38 plugins",
  "benchmark.title": "Speed without trade-offs",
  "benchmark.subtitle": "Same target, same machine, single cold run. WebScan finishes before Nuclei has warmed up — and every finding it reports is real.",
  "benchmark.faster": "faster than Nuclei",
  "benchmark.faster2": "faster than Nikto",
  "benchmark.zeroFp": "false positives — content-verified",
  "benchmark.compareTitle": "How WebScan stacks up",

  // Docs
  "docs.badge": "Documentation",
  "docs.title": "Everything under one roof",
  "docs.subtitle": "Quickstart, CLI reference, library API, plugin SDK — all in one place.",
  "docs.quickstart": "Quickstart",
  "docs.cli": "CLI",
  "docs.api": "Library API",
  "docs.plugin": "Plugin SDK",

  // Footer
  "footer.description": "Automated CLI security auditor for web configuration vulnerabilities. 38 plugins, 6 report formats, content-verified findings. Open source (MIT).",
  "footer.legal": "For authorized security testing only. Use solely on systems you own or have explicit written permission to test.",
  "footer.project": "Project",
  "footer.sections": "Sections",
  "footer.releases": "Releases (11)",
  "footer.changelog": "Changelog",
  "footer.bug": "Report a bug",
  "footer.pypi": "PyPI package",
  "footer.madeWith": "Made with",
  "footer.andCves": "and too many CVEs",
  "footer.star": "Star on GitHub",
};

const ru: Dict = {
  // Header
  "nav.analyzer": "Анализатор",
  "nav.plugins": "Плагины",
  "nav.benchmark": "Бенчмарк",
  "nav.compare": "Сравнение",
  "nav.docs": "Документация",
  "nav.settings": "Настройки ИИ",
  "nav.openAnalyzer": "Открыть анализатор",
  "nav.analyze": "Анализ",

  // Hero
  "hero.badge.cve": "v2.5.3 — ноль известных CVE",
  "hero.badge.ai": "GLM 5.2 AI-триаж встроен",
  "hero.badge.license": "MIT лицензия · 860 тестов",
  "hero.title": "WebScan",
  "hero.subtitle": "Автоматизированный веб-аудитор безопасности.",
  "hero.description": "Crawl → discover → audit. 38 плагинов, 6 форматов отчётов, вежливые значения по умолчанию, проверка находок по содержимому — в 4.8× быстрее Nuclei, ноль ложных срабатываний.",
  "hero.cta.primary": "Открыть анализатор",
  "hero.cta.secondary": "Открыть на GitHub",
  "hero.stat.plugins": "ПЛАГИНОВ",
  "hero.stat.time": "ВРЕМЯ СКАНА",
  "hero.stat.fp": "ЛОЖНЫХ СРАБАТЫВАНИЙ",
  "hero.stat.cve": "БАЗА CVE",

  // Features
  "features.title": "Создан для трёх аудиторий",
  "features.subtitle": "Владельцы сайтов — безопасные дефолты. Багхантеры — скрытность и глубина. Security-команды — CI-дружелюбные отчёты и ноль шума.",

  // Analyzer
  "analyzer.badge": "Анализатор с ИИ",
  "analyzer.title": "Загрузи скан. Получи AI-вердикты.",
  "analyzer.subtitle": "Запусти WebScan локально против любого таргета, загрузи JSON-отчёт сюда, и пусть GLM 5.2 проверит каждую находку на ложное срабатывание — затем общайся с моделью про Remediation.",
  "analyzer.step1.title": "Запусти WebScan",
  "analyzer.step1.desc": "pip install webscan-security && webscan -t https://yoursite.com --format json -o scan",
  "analyzer.step2.title": "Загрузи отчёт",
  "analyzer.step2.desc": "Перетащи файл scan.json ниже. Парсинг происходит в браузере — файл не покидает твоё устройство.",
  "analyzer.step3.title": "AI-триаж + чат",
  "analyzer.step3.desc": "GLM 5.2 проверяет каждую находку (ложное срабатывание / реальная / неопределённая). Общайся с моделью про что угодно в отчёте.",
  "analyzer.drop": "Перетащи JSON-отчёт WebScan сюда",
  "analyzer.dropHint": "Запусти скан командой webscan -t https://example.com --format json -o scan и загрузи полученный scan.json сюда.",
  "analyzer.chooseFile": "Выбрать файл",
  "analyzer.trySample": "Попробовать пример отчёта",
  "analyzer.downloadSample": "Скачать пример",
  "analyzer.loaded": "Отчёт загружен",
  "analyzer.loadedHint": "Перетащи другой файл для замены или очисти для начала.",
  "analyzer.replace": "Заменить",
  "analyzer.clear": "Очистить",
  "analyzer.tab.findings": "Находки & AI-триаж",
  "analyzer.tab.chat": "Чат с GLM",
  "analyzer.tab.terminal": "Терминал",
  "analyzer.noReport": "Отчёт ещё не загружен. Перетащи JSON-файл выше или попробуй пример, чтобы исследовать AI-функции.",
  "analyzer.findings": "находок",
  "analyzer.scannedAt": "скан от",

  // Findings Explorer
  "findings.search": "Поиск находок по плагину, заголовку, URL, описанию…",
  "findings.severity": "Severity",
  "findings.confidence": "Confidence",
  "findings.triage": "Триаж",
  "findings.all": "Все",
  "findings.untriaged": "Не триажено",
  "findings.triaged": "Триажено",
  "findings.tp": "Истинные позитивы",
  "findings.fp": "Ложные позитивы",
  "findings.showing": "Показано",
  "findings.of": "из",
  "findings.total": "всего",
  "findings.triageAll": "Триажировать все",
  "findings.reset": "Сбросить",
  "findings.aiTriage": "AI-триаж",
  "findings.reTriage": "Пере-триаж",
  "findings.description": "Описание",
  "findings.evidence": "Evidence",
  "findings.remediation": "Remediation",
  "findings.triageError": "Ошибка триажа",
  "findings.aiVerdict": "AI-вердикт",
  "findings.confidencePct": "уверенность",
  "findings.recommendedAction": "Рекомендуемое действие",
  "findings.truePositive": "реальная",
  "findings.falsePositive": "ложное",
  "findings.uncertain": "неопределённо",

  // Chat
  "chat.title": "Чат с GLM про этот отчёт",
  "chat.context": "контекст",
  "chat.clear": "Очистить",
  "chat.placeholder": "Спроси про находки, ложные срабатывания, remediation…",
  "chat.thinking": "GLM думает…",
  "chat.empty": "Спроси что угодно про загруженный отчёт.",
  "chat.hint": "Enter — отправить · Shift+Enter — новая строка. Контекст чата включает полный summary отчёта. GLM может ошибаться — проверяй критичные советы.",
  "chat.error": "Ошибка",
  "chat.prompt1": "Какую находку исправить первой?",
  "chat.prompt2": "Какие из них скорее ложные срабатывания?",
  "chat.prompt3": "Покажи curl-команды для воспроизведения топ-3 находок.",
  "chat.prompt4": "Напиши план remediation для Jira-тикета.",

  // Terminal
  "terminal.title": "Терминал — запусти WebScan вживую",
  "terminal.subtitle": "Вводи команды webscan и смотри реальный вывод. Сканы выполняются на серверной стороне; результаты автоматически загружаются в анализатор после завершения.",
  "terminal.placeholder": "Введи команду webscan, например: webscan -t https://example.com --safe-mode",
  "terminal.run": "Запуск",
  "terminal.stop": "Стоп",
  "terminal.clear": "Очистить",
  "terminal.connecting": "Подключение к scan-сервису…",
  "terminal.offline": "Scan-сервис недоступен. На GitHub Pages запусти `webscan serve` локально и обнови страницу, либо загрузи JSON-отчёт вручную.",
  "terminal.connected": "Подключено к scan-сервису",
  "terminal.hint": "Разрешено: только команды webscan. Попробуй: webscan -t https://example.com --safe-mode",
  "terminal.autoLoad": "Скан завершён — автоматически загружаю отчёт в анализатор…",

  // Settings
  "settings.title": "Конфигурация ИИ",
  "settings.subtitle": "Подключи свой GLM API-ключ для AI-триажа и чата. Ключ хранится локально в браузере — никогда не отправляется ни на какой сервер кроме настроенного LLM-endpoint.",
  "settings.endpoint": "API Endpoint",
  "settings.endpointHint": "По умолчанию: публичный endpoint Z.AI. Совместим с OpenAI, Azure OpenAI, OpenRouter — поменяй URL при необходимости.",
  "settings.model": "Модель",
  "settings.modelHint": "GLM 4.6 — самая мощная публичная модель Z.AI. Другие варианты: glm-4-flash (быстро/дёшево), glm-4-air (баланс).",
  "settings.apiKey": "API Key",
  "settings.apiKeyPlaceholder": "Вставь свой GLM API-ключ…",
  "settings.apiKeyHint": "Получить ключ: z.ai/manage-apikey.",
  "settings.privacy": "Приватность",
  "settings.privacyText": "Твой API-ключ хранится в localStorage на этом устройстве. Запросы идут напрямую из браузера к настроенному endpoint — без прокси, без логов с нашей стороны. Очисти данные браузера, чтобы удалить ключ навсегда.",
  "settings.save": "Сохранить",
  "settings.cancel": "Отмена",
  "settings.clear": "Очистить",
  "settings.saved": "Настройки сохранены",
  "settings.cleared": "Настройки очищены",
  "settings.clearedDesc": "Твой API-ключ удалён из этого браузера.",

  // Plugins
  "plugins.title": "Исследователь плагинов",
  "plugins.subtitle": "Каждый плагин проверен по содержимому. Фильтруй по категории, severity или типу — или ищи по имени / CWE / ключевому слову.",
  "plugins.search": "Поиск плагинов, CWE-номеров, описаний…",
  "plugins.category": "Категория",
  "plugins.noResults": "Нет плагинов под эти фильтры.",
  "plugins.reset": "Сбросить фильтры",
  "plugins.showing": "Показано",

  // Benchmark
  "benchmark.badge": "Реальный бенчмарк · httpbin.org · 38 плагинов",
  "benchmark.title": "Скорость без компромиссов",
  "benchmark.subtitle": "Тот же таргет, та же машина, один cold-run. WebScan заканчивает раньше, чем Nuclei разогревается — и каждая находка реальная.",
  "benchmark.faster": "быстрее Nuclei",
  "benchmark.faster2": "быстрее Nikto",
  "benchmark.zeroFp": "ложных срабатываний — проверено по содержимому",
  "benchmark.compareTitle": "Как WebScan смотрится на фоне других",

  // Docs
  "docs.badge": "Документация",
  "docs.title": "Всё в одном месте",
  "docs.subtitle": "Quickstart, CLI-референс, library API, plugin SDK — всё тут.",
  "docs.quickstart": "Quickstart",
  "docs.cli": "CLI",
  "docs.api": "Library API",
  "docs.plugin": "Plugin SDK",

  // Footer
  "footer.description": "Автоматизированный CLI-аудитор безопасности веб-конфигураций. 38 плагинов, 6 форматов отчётов, проверка находок по содержимому. Open source (MIT).",
  "footer.legal": "Только для авторизованного тестирования безопасности. Используй только на системах, которые тебе принадлежат или где есть явное письменное разрешение.",
  "footer.project": "Проект",
  "footer.sections": "Разделы",
  "footer.releases": "Релизы (11)",
  "footer.changelog": "Changelog",
  "footer.bug": "Сообщить о баге",
  "footer.pypi": "PyPI пакет",
  "footer.madeWith": "Сделано с",
  "footer.andCves": "и слишком большим количеством CVE",
  "footer.star": "Star на GitHub",
};

const DICTS: Record<Language, Dict> = { en, ru };
const STORAGE_KEY = "webscan.lang";

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Lazy initial state — reads from localStorage / browser language on first
  // render (client-only component). Avoids the "setState in effect" pattern
  // that React 19's lint rules flag.
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === "en" || saved === "ru") return saved;
      const browser = (navigator.language || "en").toLowerCase();
      if (browser.startsWith("ru")) return "ru";
    } catch {
      // localStorage disabled — keep default.
    }
    return "en";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = DICTS[lang];
      return dict[key] ?? DICTS.en[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLang must be used within LanguageProvider");
  }
  return ctx;
}
