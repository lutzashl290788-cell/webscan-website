import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "WebScan — Automated Web Security Auditor",
  description:
    "Crawl → discover → audit. 38 plugins, 6 report formats, polite defaults, content-verified findings. 4.8× faster than Nuclei, 6× faster than Nikto, zero false positives.",
  keywords: [
    "WebScan",
    "security scanner",
    "DAST",
    "vulnerability scanner",
    "pentest",
    "OWASP",
    "SARIF",
    "Python",
    "CLI",
  ],
  authors: [{ name: "lutzashl290788-cell" }],
  openGraph: {
    title: "WebScan — Automated Web Security Auditor",
    description:
      "38 plugins · 6 report formats · 97% test coverage · zero known security findings. Open source (MIT).",
    type: "website",
    url: "https://github.com/lutzashl290788-cell/webscan",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebScan — Automated Web Security Auditor",
    description:
      "Fastest open-source DAST scanner. 7.1s scan, 0 false positives, 38 content-verified plugins.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
