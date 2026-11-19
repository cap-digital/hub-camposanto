import type { Metadata } from "next";
import { ChartFrame } from "@/components/core/chart-frame";
import { KpiTile } from "@/components/core/kpi-tile";
import { InView } from "@/components/core/in-view";
import { Reveal } from "@/components/core/reveal";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { HBars } from "@/components/viz/hbars";
import { fmtBRL, fmtCompact, fmtDia, fmtExtenso, fmtMil, fmtNum, fmtPct, metricaPrincipal } from "@/data/format";
import { s } from "@/data/snapshot";
import type { EstrategiaMetaAon, MetaCanalCremacao } from "@/data/types";

export const metadata: Metadata = { title: "Campanhas · Campo Santo" };

const COR: Record<string, string> = { Google: "var(--amber)", Meta: "var(--dusk-2)", YouTube: "var(--copper)" };
const ROTULO_METRICA = { impressoes: "impressões", views: "views" } as const;
const CANAL: Record<string, string> = { Meta: "Meta · Alcance", YouTube: "YouTube · Visualização" };
const maiuscula = (t: string) => t[0].toUpperCase() + t.slice(1);

export default function Campanhas() {
  const [aon, cremacao] = s.campanhas;
  const fechados = aon.metas.filter((m) => !m.parcial);
  const parcial = aon.metas.find((m) => m.parcial);
  const soma = (k: "investimento" | "cliques" | "conversoes" | "impressoes") => fechados.reduce((a, m) => a + m[k], 0);
  const metaInvest = aon.metaMensal.investimento * fechados.length;
  const metaCliques = aon.metaMensal.cliques * fechados.length;
  const melhor = [...fechados].sort((a, b) => b.cliques - a.cliques)[0];
  const menor = [...fechados].sort((a, b) => a.cliques - b.cliques)[0];
  const topo = Math.max(...aon.metas.map((m) => m.cliques), aon.metaMensal.cliques) * 1.04;
  const [cMeta, cYt] = cremacao.metas;
  const todos = aon.mesesNaMeta === aon.mesesFechados;
  const pesquisa = aon.porCanal.Google;
  const metaAon = aon.porCanal.Meta;

  return (
    <main>
      <PageHero
        tone="dusk"
        image="none"
        eyebrow="Campanhas · Institucional AON · Cremação"
        title={
          <>
            Duas campanhas, <em>frente às metas.</em>
          </>
        }
        description={`No Institucional AON, a busca do Google tinha como meta ${fmtBRL(aon.metaMensal.investimento, { decimals: 0 })} e ${fmtNum(aon.metaMensal.cliques)} cliques por mês${metaAon ? ", e o Meta somou alcance e tráfego ao longo do ano" : ""}; a campanha de Cremação, ${fmtNum(cMeta.meta)} impressões no Meta e ${fmtNum(cYt.meta)} views no YouTube.`}
        kpis={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiTile
              label="Institucional AON"
              value={aon.investimento}
              format="compactCurrency"
              decimals={1}
              tone="amber"
              hint={`${fmtDia(aon.inicio)} → ${fmtDia(aon.fim)} · ${metaAon ? "Google Pesquisa e Meta" : "Google Pesquisa"}`}
            />
            <KpiTile
              label="Cliques · AON"
              value={(soma("cliques") / metaCliques) * 100}
              format="percent"
              decimals={0}
              tone="amber"
              hint={`Da meta de cliques da busca, jan → ${fechados[fechados.length - 1].rotulo}`}
            />
            <KpiTile
              label="Cremação"
              value={cremacao.investimento}
              format="compactCurrency"
              decimals={1}
              tone="dusk"
              hint={`${fmtDia(cremacao.contratado.inicio)} → ${fmtDia(cremacao.contratado.fim)} · Meta e YouTube`}
            />
            <KpiTile
              label="Impressões · Meta"
              value={cMeta.pctMeta * 100}
              format="percent"
              decimals={0}
              tone="dusk"
              hint={`Da meta · views no YouTube: ${fmtPct(cYt.pctMeta, 0)}`}
            />
          </div>
        }
      />

      <Section
        index="01"
        eyebrow="Institucional AON · Google Pesquisa"
        title={
          <>
            {todos ? (
              <>
                A meta de cliques foi atingida <em>em todos os meses.</em>
              </>
            ) : (
              <>
                A meta de cliques foi atingida{" "}
                <em>
                  em {fmtNum(aon.mesesNaMeta)} de {fmtNum(aon.mesesFechados)} meses.
                </em>
              </>
            )}
          </>
        }
        description={`${metaAon && pesquisa ? `Com ${fmtMil(aon.investimento)} no ano, o Institucional AON reuniu a busca do Google (${fmtMil(pesquisa.investimento)}) e o Meta (${fmtMil(metaAon.investimento)}). ` : ""}Na busca, de ${fechados[0].nome} a ${fechados[fechados.length - 1].nome}, o investimento seguiu o contratado (${fmtBRL(aon.metaMensal.investimento, { decimals: 0 })} por mês) e os cliques ficaram entre ${fmtNum(menor.cliques)}, em ${menor.nome}, e ${fmtNum(melhor.cliques)}, em ${melhor.nome}: ${fmtNum(soma("cliques"))} no total, contra a meta de ${fmtNum(metaCliques)}.${parcial ? ` ${maiuscula(parcial.nome)} é parcial: a busca rodou de ${fmtDia(parcial.inicio)} a ${fmtDia(parcial.fim)}.` : ""}`}
      >
        <span className="eyebrow text-text-3">
          Metas atingidas · {fechados[0].rotulo} → {fechados[fechados.length - 1].rotulo}
        </span>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile
            label="Investimento"
            value={soma("investimento")}
            format="compactCurrency"
            decimals={1}
            tone="amber"
            hint={`${fmtPct(soma("investimento") / metaInvest, 0)} de ${fmtMil(metaInvest)} contratados`}
          />
          <KpiTile
            label="Cliques"
            value={soma("cliques")}
            format="number"
            tone="amber"
            hint={`${fmtPct(soma("cliques") / metaCliques, 0)} da meta de ${fmtNum(metaCliques)}`}
          />
          <KpiTile label="Meses na meta" value={aon.mesesNaMeta} format="number" hint={`De ${fmtExtenso(aon.mesesFechados)} meses fechados`} />
          <KpiTile
            label="Conversões"
            value={soma("conversoes")}
            format="number"
            hint={`CPC de ${fmtBRL(soma("investimento") / soma("cliques"), { decimals: 2 })}`}
          />
        </div>
      </Section>

      {/* Mês a mês em seção própria: uma página a mais no PDF, sem zoom excessivo. */}
      <Section eyebrow="Institucional AON · busca do Google · mês a mês">
        <div>
          <ChartFrame
            eyebrow="Cliques × meta, mês a mês"
            title={`Cliques por mês e a meta de ${fmtNum(aon.metaMensal.cliques)}`}
            subtitle="A marca vertical é a meta mensal de cliques. Ao lado, o % da meta; abaixo, o investimento sobre o contratado."
            minHeight={420}
            tone="amber"
            legend={
              parcial ? (
                <span className="flex items-center gap-2 text-[12.5px] text-text-2">
                  <span className="hatch-amber size-2.5 rounded-[3px]" />
                  Mês parcial (até {fmtDia(s.periodo.fim)}), sem % de meta
                </span>
              ) : undefined
            }
          >
            <HBars
              max={topo}
              items={aon.metas.map((m) => ({
                key: m.mes,
                label: m.parcial ? `${m.nome} · parcial` : m.nome,
                value: m.cliques,
                meta: m.parcial ? undefined : m.metaCliques,
                parcial: m.parcial,
                display: m.parcial ? `${fmtNum(m.cliques)} cliques` : `${fmtNum(m.cliques)} · ${fmtPct(m.pctCliques, 0)}`,
                sub: m.parcial
                  ? `${fmtBRL(m.investimento)} · ${fmtDia(m.inicio)} → ${fmtDia(m.fim)}`
                  : `${fmtBRL(m.investimento)} de ${fmtBRL(m.metaInvestimento, { decimals: 0 })} · ${fmtPct(m.pctInvestimento, 0)} do investimento`,
                color: COR.Google,
              }))}
            />
          </ChartFrame>
        </div>
      </Section>

      {metaAon && (
        <Section
          eyebrow="Institucional AON · Meta"
          tone="dusk"
          title={
            <>
              No Meta, {fmtCompact(metaAon.impressoes, 1)} de impressões <em>ao longo do ano.</em>
            </>
          }
          description={`De ${fmtDia(metaAon.inicio)} a ${fmtDia(metaAon.fim)}, ${fmtMil(metaAon.investimento)} em ${fmtExtenso(aon.estrategiasMeta.length)} estratégias no Facebook e no Instagram: ${fmtCompact(metaAon.cliquesLink, 1)} cliques no link e ${fmtCompact(metaAon.impressoes, 1)} de impressões, a um CPM de ${fmtBRL(metaAon.cpm, { decimals: 2 })}.`}
        >
          <span className="eyebrow text-text-3">Entrega por estratégia</span>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {aon.estrategiasMeta.map((e) => (
              <EntregaMeta key={e.estrategia} e={e} total={metaAon.investimento} />
            ))}
          </div>
        </Section>
      )}

      <Section
        index="02"
        eyebrow="Cremação · Meta e YouTube"
        tone="dusk"
        title={
          <>
            As duas metas da Cremação <em>foram superadas.</em>
          </>
        }
        description={`De ${fmtDia(cremacao.contratado.inicio)} a ${fmtDia(cremacao.contratado.fim)}, com o investimento contratado nos dois canais: o Meta entregou ${fmtPct(cMeta.pctMeta, 0)} da meta de impressões e o YouTube, ${fmtPct(cYt.pctMeta, 0)} da meta de views.`}
      >
        <span className="eyebrow text-text-3">Metas atingidas</span>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MetaCanal m={cMeta} tone="dusk" />
          <MetaCanal m={cYt} tone="copper" />
        </div>
      </Section>
    </main>
  );
}

/** Entrega de uma estratégia do Meta no AON: métrica principal, custo e investimento (sem meta). */
function EntregaMeta({ e, total }: { e: EstrategiaMetaAon; total: number }) {
  const m = metricaPrincipal(e);
  return (
    <Reveal>
      <div className="hub-card flex h-full flex-col gap-8 p-7 md:p-9" data-tone="dusk">
        <span className="eyebrow text-dusk-2">Meta · {e.estrategia}</span>
        <div>
          <span className="display block text-[clamp(2.6rem,4.6vw,3.75rem)] leading-none tracking-[-0.035em] text-dusk-2 tabular">{fmtCompact(m.valor, 1)}</span>
          <span className="mt-3 block text-[15px] text-text-2">
            {m.rotulo} · {m.custoRotulo} de <span className="text-text tabular">{fmtBRL(m.custo, { decimals: 2 })}</span>
          </span>
        </div>
        <InView minHeight={64} placeholder={<div className="shimmer h-[64px] rounded-[12px]" />}>
          <HBars
            max={total}
            items={[
              {
                key: "investimento",
                label: "Investimento",
                value: e.investimento,
                display: fmtBRL(e.investimento),
                sub: `${fmtPct(e.investimento / (total || 1), 0)} do Meta no AON · ${fmtCompact(e.impressoes, 1)} impressões · ${fmtCompact(e.cliquesLink, 1)} cliques no link`,
                color: COR.Meta,
              },
            ]}
          />
        </InView>
      </div>
    </Reveal>
  );
}

function MetaCanal({ m, tone }: { m: MetaCanalCremacao; tone: "dusk" | "copper" }) {
  const rotulo = ROTULO_METRICA[m.metrica];
  const valor = m[m.metrica];
  const custo = m.metrica === "impressoes" ? `CPM de ${fmtBRL(m.cpm, { decimals: 2 })}` : `CPV de ${fmtBRL(m.cpv, { decimals: 2 })}`;
  return (
    <Reveal>
      <div className="hub-card flex h-full flex-col gap-8 p-7 md:p-9" data-tone={tone}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <span className={`eyebrow ${tone === "dusk" ? "text-dusk-2" : "text-copper"}`}>{CANAL[m.plataforma]}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">desde {fmtDia(m.inicio)}</span>
        </div>
        <div>
          <span
            className={`display block text-[clamp(3rem,6vw,4.75rem)] leading-none tracking-[-0.035em] tabular ${tone === "dusk" ? "text-dusk-2" : "text-copper"}`}
          >
            {fmtPct(m.pctMeta, 0)}
          </span>
          <span className="mt-3 block text-[15px] text-text-2">
            da meta de {rotulo}: <span className="text-text tabular">{fmtNum(valor)}</span> de {fmtNum(m.meta)}
          </span>
        </div>
        <InView minHeight={150} placeholder={<div className="shimmer h-[150px] rounded-[12px]" />}>
          <div className="flex flex-col gap-5">
            <HBars
              max={valor}
              items={[
                {
                  key: "metrica",
                  label: maiuscula(rotulo),
                  value: valor,
                  meta: m.meta,
                  display: fmtNum(valor),
                  sub: `A marca é a meta de ${fmtNum(m.meta)} · ${custo}`,
                  color: COR[m.plataforma],
                },
              ]}
            />
            <HBars
              max={m.metaInvestimento}
              items={[
                {
                  key: "investimento",
                  label: "Investimento",
                  value: m.investimento,
                  meta: m.metaInvestimento,
                  display: fmtBRL(m.investimento),
                  sub: `${fmtPct(m.pctInvestimento, 0)} de ${fmtBRL(m.metaInvestimento, { decimals: 0 })} contratados`,
                  color: COR[m.plataforma],
                },
              ]}
            />
          </div>
        </InView>
      </div>
    </Reveal>
  );
}
