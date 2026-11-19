"use client";

import { Play } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Criativo } from "@/data/types";
import { fmtBRL, fmtCompact } from "@/data/format";
import { cn } from "@/lib/utils";
import { BotaoVerTodos } from "./ver-todos";

const INICIAL = 8;

/** Selo de cada criativo: plataforma · campanha. */
const selo = (c: Criativo) => `${c.plataforma} · ${c.frente === "Institucional AON" ? "AON" : c.frente}`;

/** Métrica principal do criativo: views no YouTube, impressões no Meta. */
const principal = (c: Criativo) => (c.plataforma === "YouTube" ? { valor: c.views, rotulo: "views" } : { valor: c.impressoes, rotulo: "impressões" });

/**
 * Grade dos criativos (Meta + YouTube), com canal, métrica principal e investimento. "Ver anúncio ↗" só com link.
 * Na tela, os INICIAL primeiros e "Ver todos"; no PDF, todos, em 6 colunas.
 */
export function CriativosGrid({ criativos }: { criativos: Criativo[] }) {
  const [aberto, setAberto] = useState(false);
  if (!criativos.length) return <p className="text-text-3">Nenhum criativo nesta campanha.</p>;

  return (
    <div>
      <div
        className={
          criativos.length <= 3 ? "grid grid-cols-1 gap-4 sm:grid-cols-3" : "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 print:grid-cols-6"
        }
      >
        {criativos.map((c, i) => {
          const m = principal(c);
          return (
            <motion.figure
              key={c.id}
              // print: anula o deslocamento da entrada (as peças escondidas na tela nunca animam).
              className={cn(
                "group relative overflow-hidden rounded-[16px] border border-line bg-surface-2 print:![transform:none]",
                !aberto && i >= INICIAL && "hidden print:block",
              )}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-3">
                {c.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element -- cópias locais em public/criativos/, tamanhos variados.
                  <img
                    src={c.imagem}
                    alt={c.nome}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="dot-grid size-full opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text backdrop-blur">
                  <span className="print:hidden">#{i + 1} · </span>
                  {selo(c)}
                </span>
                {c.formato === "video" && (
                  <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-amber text-ink">
                    <Play className="size-3.5 fill-current" />
                  </span>
                )}
                {c.link && (
                  <div className="absolute inset-x-3 top-12 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <a href={c.link} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text backdrop-blur hover:text-amber">
                      Ver anúncio ↗
                    </a>
                  </div>
                )}
                <figcaption className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                    <div>
                      <span className="display block whitespace-nowrap text-[1.3rem] leading-none tracking-[-0.02em] text-text tabular md:text-[1.6rem]">{fmtCompact(m.valor)}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">{m.rotulo}</span>
                    </div>
                    <span className="whitespace-nowrap font-mono text-[11px] text-text-2 tabular">{fmtBRL(c.investimento, { compact: true })}</span>
                  </div>
                </figcaption>
              </div>
            </motion.figure>
          );
        })}
      </div>
      <BotaoVerTodos aberto={aberto} total={criativos.length} inicial={INICIAL} onToggle={() => setAberto((v) => !v)} />
    </div>
  );
}
