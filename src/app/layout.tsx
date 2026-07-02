import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Briefing Diário",
  description: "Seu resumo diário de notícias, clima e agenda — gerado por IA.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${GeistSans.variable}`}>
      <body className="font-sans">
        <a
          href="#clima"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm"
        >
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
