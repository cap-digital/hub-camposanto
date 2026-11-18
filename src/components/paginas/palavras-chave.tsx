"use client";

import { useState } from "react";
import { HBars, type HBarItem } from "@/components/viz/hbars";
import { fmtNum, fmtPct } from "@/data/format";
import type { PalavraChave, PalavrasChave as Dados } from "@/data/types";
import { cn } from "@/lib/utils";
import { BotaoVerTodos } from "./ver-todos";

/** Uma campanha só (Institucional AON): sem abas de frente. */
const CAMPANHA = "Institucional AON";
const INICIAL = 10;
const MAXIMO = 15;
/** No ranking por CTR, termos com menos impressões que isso ficam de fora (2 impr. e 1 clique = 50%). */
const CTR_MIN_IMPRESSOES = 50;
/** No ranking por conversões, só termos com pelo menos 1 conversão. */
const CONV_MIN = 1;

type Metrica = "cliques" | "impressoes" | "ctr" | "conversoes";
const METRICAS: { k: Metrica; label: string }[] = [
  { k: "cliques", label: "Cliques" },
  { k: "impressoes", label: "Impressões" },
  { k: "ctr", label: "CTR" },
  { k: "conversoes", label: "Conversões" },
];

/** Ranking pela métrica (maior em cima; empate → cliques, depois o termo). */
function ranking(lista: PalavraChave[], m: Metrica): PalavraChave[] {
  const base =
    m === "ctr" ? lista.filter((p) => p.impressoes >= CTR_MIN_IMPRESSOES) : m === "conversoes" ? lista.filter((p) => p.conversoes >= CONV_MIN) : lista;
  return [...base].sort((a, b) => b[m] - a[m] || b.cliques - a.cliques || a.termo.localeCompare(b.termo, "pt-BR"));
}

const plural = (n: number, um: string, varios: string) => `${fmtNum(n, 1)} ${n === 1 ? um : varios}`;
/** Conversões podem ser fracionárias na fonte (atribuição): até uma casa. */
const conv = (n: number) => plural(n, "conversão", "conversões");

/** A barra representa a métrica escolhida; o sub mostra as outras. */
function itens(lista: PalavraChave[], m: Metrica = "cliques"): HBarItem[] {
  return lista.map((p) => {
    const outras = [
      m !== "cliques" && plural(p.cliques, "clique", "cliques"),
      m !== "impressoes" && `${fmtNum(p.impressoes)} impr.`,
      m !== "ctr" && `CTR ${fmtPct(p.ctr, 1)}`,
      m !== "conversoes" && p.conversoes > 0 && conv(p.conversoes),
    ].filter(Boolean);
    return {
      key: p.termo,
      label: p.termo,
      value: p[m],
      display: m === "ctr" ? fmtPct(p.ctr, 1) : fmtNum(p[m], m === "conversoes" ? 1 : 0),
      sub: outras.join(" · "),
      color: "var(--amber)",
    };
  });
}

function Pilulas<T extends string>({ rotulo, opcoes, ativo, onChange }: { rotulo: string; opcoes: { k: T; label: string }[]; ativo: T; onChange: (k: T) => void }) {
  return (
    <div role="tablist" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.k}
          role="tab"
          aria-selected={ativo === o.k}
          onClick={() => onChange(o.k)}
          className={cn(
            "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-300",
            ativo === o.k ? "border-transparent bg-text text-ink" : "border-line text-text-2 hover:border-line-strong hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Resumo({ dados }: { dados: Dados }) {
  const t = dados.totais[CAMPANHA];
  if (!t) return null;
  return (
    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-3">
      {fmtNum(t.termos)} {t.termos === 1 ? "termo" : "termos"} com clique
      {t.completa && (
        <>
          {" "}
          · {fmtNum(t.cliques)} cliques · {fmtNum(t.impressoes)} impressões
        </>
      )}
    </p>
  );
}

/** Tela: seletor de métrica (mesmo padrão do EntregaPublico); top 10 e "Ver todos" até 15. */
export function PalavrasChave({ dados }: { dados: Dados }) {
  const termos = dados.porFrente[CAMPANHA] ?? [];
  // Conversões só entram no seletor se houver termo com conversão.
  const metricas = METRICAS.filter((m) => m.k !== "conversoes" || termos.some((p) => p.conversoes >= CONV_MIN));
  const [metrica, setMetrica] = useState<Metrica>("cliques");
  const [aberto, setAberto] = useState(false);
  const lista = ranking(termos, metrica).slice(0, MAXIMO);

  return (
    <div>
      <Resumo dados={dados} />
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-3">Ordenar por</span>
        <Pilulas
          rotulo="Métrica"
          opcoes={metricas}
          ativo={metrica}
          onChange={(m) => {
            setMetrica(m);
            setAberto(false);
          }}
        />
      </div>
      <HBars key={metrica} className="mt-6" items={itens(aberto ? lista : lista.slice(0, INICIAL), metrica)} />
      <BotaoVerTodos aberto={aberto} total={lista.length} inicial={INICIAL} onToggle={() => setAberto((v) => !v)} />
    </div>
  );
}

/** PDF: sem seletor, ranking por cliques, top 10 em duas colunas (1–5 | 6–10). */
export function PalavrasChavePdf({ dados }: { dados: Dados }) {
  const termos = dados.porFrente[CAMPANHA] ?? [];
  return (
    <div>
      <div className="border-b border-line pb-3">
        <Resumo dados={dados} />
      </div>
      <HBars
        estatico
        className="mt-6 block columns-2 gap-x-14 [&>li]:mb-4 [&>li]:break-inside-avoid"
        items={itens(ranking(termos, "cliques").slice(0, INICIAL))}
      />
    </div>
  );
}
