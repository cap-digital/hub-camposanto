import { ChartFrame } from "@/components/core/chart-frame";
import { KpiTile } from "@/components/core/kpi-tile";
import { Reveal } from "@/components/core/reveal";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { BotaoExportarPdf } from "@/components/paginas/exportar-pdf";
import { PortasCards } from "@/components/paginas/portas";
import { GradeEstrategias } from "@/components/viz/grade-estrategias";
import { MonthlyChart } from "@/components/viz/monthly-chart";
import { SplitBar } from "@/components/viz/small";
import { fmtBRL, fmtCompact, fmtDia, fmtExtenso, fmtMil, fmtNum, fmtPct } from "@/data/format";
import { s } from "@/data/snapshot";

const maiuscula = (t: string) => t[0].toUpperCase() + t.slice(1);

export default function Home() {
  const t = s.totais;
  const [aon, cremacao] = s.campanhas;
  const google = s.plataformas.find((p) => p.plataforma === "Google")!;
  const meta = s.plataformas.find((p) => p.plataforma === "Meta")!;
  const youtube = s.plataformas.find((p) => p.plataforma === "YouTube")!;
  const metaMeta = cremacao.metas.find((m) => m.plataforma === "Meta")!;
  const metaYt = cremacao.metas.find((m) => m.plataforma === "YouTube")!;

  const primeiro = s.meses[0];
  const ultimo = s.meses[s.meses.length - 1];
  const ativasMax = Math.max(...s.meses.map((m) => m.estrategiasAtivas));
  const mesCremacao = s.meses.find((m) => m.mes === cremacao.inicio.slice(0, 7))!;
  const soBusca = s.meses.filter((m) => m.mes < mesCremacao.mes);
  const fechadosAon = aon.metas.filter((m) => !m.parcial);
  const mediaCliques = fechadosAon.reduce((a, m) => a + m.cliques, 0) / (fechadosAon.length || 1);
  const novAon = aon.metas.find((m) => m.parcial);

  return (
    <main>
      <PageHero
        tone="amber"
        image="none"
        eyebrow={`Balanço de mídia · ${s.cliente} · ${fmtDia(s.periodo.inicio)} a ${fmtDia(s.periodo.fim)} ${s.periodo.fim.slice(0, 4)}`}
        title={
          <>
            Presença constante, <em>mês a mês.</em>
          </>
        }
        description={
          <>
            {fmtMil(t.investimento)} investidos no Google, no Meta e no YouTube, de {fmtDia(s.periodo.inicio)} a {fmtDia(s.periodo.fim)}, levaram os
            anúncios do Campo Santo a {fmtCompact(t.impressoes, 2)} de exibições e trouxeram {fmtCompact(t.cliques)} cliques.
          </>
        }
        kpis={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <KpiTile label="Investimento" value={t.investimento} format="compactCurrency" decimals={1} tone="amber" hint={`AON ${fmtMil(aon.investimento)} · Cremação ${fmtMil(cremacao.investimento)}`} />
            <KpiTile label="Impressões" value={t.impressoes} format="compact" decimals={2} hint="Vezes que os anúncios apareceram" />
            <KpiTile label="Cliques" value={t.cliques} format="compact" decimals={1} hint={`${fmtNum(google.cliques)} deles na busca do Google`} />
            <KpiTile label="Conversões" value={t.conversoes} format="number" hint="Google Pesquisa · Institucional AON" />
            <KpiTile label="Views de vídeo" value={youtube.views} format="compact" decimals={1} hint="YouTube · campanha Cremação" />
            <KpiTile label="CPC da busca" value={google.cpc} format="currency" decimals={2} hint={`Google Pesquisa · CTR de ${fmtPct(google.ctr, 1)}`} />
          </div>
        }
      >
        <BotaoExportarPdf />
      </PageHero>

      <Section
        index="01"
        eyebrow="AON × Cremação"
        title={
          <>
            Duas campanhas, <em>dois papéis.</em>
          </>
        }
        description={
          <>
            A campanha Institucional AON manteve o Campo Santo na busca do Google o ano todo, com {fmtMil(aon.investimento)} e{" "}
            {fmtNum(aon.cliques)} cliques. A campanha de Cremação, de {fmtDia(cremacao.contratado.inicio)} a {fmtDia(cremacao.contratado.fim)}, levou a
            mensagem ao Meta e ao YouTube com {fmtMil(cremacao.investimento)}.
          </>
        }
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
          <Reveal className="hub-card p-7 md:p-9">
            <span className="eyebrow text-text-3">Investimento por campanha</span>
            <span className="display mt-4 block text-[clamp(2.4rem,4vw,3.5rem)] leading-none tracking-[-0.035em] text-text tabular">
              {fmtMil(t.investimento)}
            </span>
            <div className="mt-8">
              <SplitBar
                soPct
                parts={[
                  { label: `AON · Pesquisa · ${fmtMil(aon.investimento)}`, value: aon.investimento, color: "var(--amber)" },
                  { label: `Cremação · Meta · ${fmtMil(meta.investimento)}`, value: meta.investimento, color: "var(--dusk-2)" },
                  { label: `Cremação · YouTube · ${fmtMil(youtube.investimento)}`, value: youtube.investimento, color: "var(--copper)" },
                ]}
              />
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
              Pesquisa desde {fmtDia(google.inicio)} · Meta desde {fmtDia(meta.inicio)} · YouTube desde {fmtDia(youtube.inicio)}
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Fato valor={fmtNum(aon.cliques)} rotulo={`cliques na busca do Google, em média ${fmtNum(mediaCliques)} por mês fechado`} tom="text-amber" />
            <Fato valor={fmtNum(aon.conversoes)} rotulo="conversões registradas pela busca do Google" tom="text-amber" />
            <Fato valor={fmtCompact(meta.impressoes, 0)} rotulo={`impressões no Meta (Facebook e Instagram), ${fmtPct(metaMeta.pctMeta, 0)} da meta`} tom="text-dusk-2" />
            <Fato valor={fmtCompact(youtube.views, 1)} rotulo={`views no YouTube, ${fmtPct(metaYt.pctMeta, 0)} da meta`} tom="text-copper" />
          </div>
        </div>
      </Section>

      <Section
        index="02"
        eyebrow="Mês a mês"
        title={
          <>
            A busca sustentou o ano; a Cremação <em>entrou em {mesCremacao.nome}.</em>
          </>
        }
        description={
          <>
            De {primeiro.nome} a {soBusca[soBusca.length - 1].nome}, só a busca do Google, com {fmtBRL(aon.metaMensal.investimento, { decimals: 0 })} por mês. A
            partir de {fmtDia(meta.inicio)} o Meta e, em {fmtDia(youtube.inicio)}, o YouTube somam a campanha de Cremação: em {mesCremacao.nome} o
            investimento chega a {fmtMil(mesCremacao.total.investimento)} e as impressões, a {fmtCompact(mesCremacao.total.impressoes, 0)}.
            {ultimo.parcial && <> {maiuscula(ultimo.nome)} vai até {fmtDia(s.periodo.fim)}.</>}
          </>
        }
      >
        <ChartFrame
          eyebrow="Google Pesquisa × Meta × YouTube · por mês"
          title="Investimento e impressões"
          subtitle="Barras: investimento empilhado por canal. Linha: impressões dos três canais somadas."
          span={3}
          minHeight={420}
          tone="amber"
        >
          <MonthlyChart meses={s.meses} fim={s.periodo.fim} />
        </ChartFrame>
      </Section>

      <Section
        index="03"
        eyebrow="O ano em mosaico"
        title={
          <>
            De {primeiro.estrategiasAtivas} para {ativasMax} <em>canais no ar.</em>
          </>
        }
        description={`Cada linha é um canal, cada coluna um mês; quanto mais intensa a célula, maior o investimento, e vazia quando o canal não rodou. A Pesquisa esteve presente em todos os ${fmtExtenso(s.meses.length)} meses; Meta Alcance e YouTube entraram com a Cremação em ${mesCremacao.nome}.${ultimo.parcial ? ` Em ${ultimo.nome}, até ${fmtDia(s.periodo.fim)}, ${ultimo.estrategiasAtivas === 1 ? "um canal rodou" : `os ${fmtExtenso(ultimo.estrategiasAtivas)} rodaram`}${novAon ? `; a busca retomou em ${fmtDia(novAon.inicio)}` : ""}.` : ""}`}
      >
        <ChartFrame
          eyebrow="Canal × mês · investimento"
          title="O que rodou em cada mês"
          subtitle={<span className="no-print">Passe o cursor numa célula para ver investimento, métrica principal e campanha.</span>}
          span={3}
          minHeight={260}
          tone="amber"
        >
          <GradeEstrategias grade={s.grade} meses={s.meses} fim={s.periodo.fim} />
        </ChartFrame>
      </Section>

      <Section index="04" eyebrow="Explore" title={<>Duas leituras do <em>mesmo investimento.</em></>}>
        <PortasCards
          portas={[
            {
              href: "/midia",
              titulo: "Mídia",
              numero: fmtCompact(t.impressoes, 2),
              legenda: "impressões no Google, no Meta e no YouTube",
              texto: "Anúncios e palavras-chave da busca, público do Meta por idade e gênero, retenção do vídeo no YouTube e os criativos da Cremação.",
              tom: "amber",
            },
            {
              href: "/campanhas",
              titulo: "Campanhas",
              numero: `${fmtNum(t.campanhas)} campanhas`,
              legenda: "Institucional AON · Cremação",
              texto: "O que cada campanha recebeu e entregou, frente às metas contratadas: cliques por mês no AON, impressões e views na Cremação.",
              tom: "dusk",
            },
          ]}
        />
      </Section>
    </main>
  );
}

function Fato({ valor, rotulo, tom = "text-text" }: { valor: string; rotulo: string; tom?: string }) {
  return (
    <Reveal className="hub-card flex flex-col justify-between gap-6 p-6 md:p-7" y={24}>
      <span className={`display text-[clamp(2.2rem,3.6vw,3.25rem)] leading-none tracking-[-0.03em] tabular ${tom}`}>{valor}</span>
      <span className="text-[14px] leading-snug text-text-2">{rotulo}</span>
    </Reveal>
  );
}
