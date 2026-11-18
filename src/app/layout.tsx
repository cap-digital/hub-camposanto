import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/core/smooth-scroll";
import { Preloader } from "@/components/core/preloader";
import { Grain } from "@/components/core/grain";
import { PageTransition } from "@/components/core/page-transition";
import { Nav } from "@/components/nav/nav";
import { Footer } from "@/components/nav/footer";
import { PainelProvider, type PainelMeta } from "@/data/provider";
import { s } from "@/data/snapshot";
import { fmtDia } from "@/data/format";

const display = Hanken_Grotesk({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-hanken",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campo Santo · Balanço de mídia 2026",
  description:
    "Balanço de mídia do Cemitério Campo Santo em 2026 (01/01 a 15/11): campanha Institucional AON no Google e campanha de Cremação no Meta e no YouTube.",
  applicationName: "Balanço de mídia · Campo Santo",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#15120F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const painel: PainelMeta = {
    cliente: s.cliente,
    periodo: s.periodo,
    atualizadoEm: s.atualizadoEm,
    // Avisos do build só em dev (o rodapé não os mostra em produção, e nem chegam ao payload).
    avisos: process.env.NODE_ENV !== "production" ? s.avisos : [],
    notas: s.meses.filter((m) => m.parcial).map((m) => `${m.nome[0].toUpperCase()}${m.nome.slice(1)} é parcial: os números vão até ${fmtDia(s.periodo.fim)}.`),
  };
  return (
    <html
      lang="pt-BR"
      className={cn("dark", display.variable, sans.variable, mono.variable, serif.variable, "antialiased")}
    >
      <body className="flex min-h-svh flex-col">
        <PainelProvider value={painel}>
          <SmoothScroll>
            <Preloader />
            <Grain />
            <PageTransition />
            <Nav />
            {children}
            <Footer />
          </SmoothScroll>
        </PainelProvider>
      </body>
    </html>
  );
}
