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
import { fmtCompact, fmtDia, fmtExtenso, fmtLista, fmtMil, fmtNum, fmtPct } from "@/data/format";
import { s } from "@/data/snapshot";

const maiuscula = (t: string) => t[0].toUpperCase() + t.slice(1);

export default function Home() {
  const t = s.totais;
  const [aon, cremacao] = s.campanhas;
  const google = s.plataformas.find((p) => p.plataforma === "Google")!;
  const youtube = s.plataformas.find((p) => p.plataforma === "YouTube")!;
  const metaMeta = cremacao.metas.find((m) => m.plataforma === "Meta")!;
  const metaYt = cremacao.metas.find((m) => m.plataforma === "YouTube")!;

  const primeiro = s.meses[0];
  const ultimo = s.meses[s.meses.length - 1];
  const metaAon = aon.porCanal.Meta;
  const ativasMax = Math.max(...s.meses.map((m) => m.estrategiasAtivas));
  const mesCremacao = s.meses.find((m) => m.mes === cremacao.inicio.slice(0, 7))!;
  const soAon = s.meses.filter((m) => m.mes < mesCremacao.mes);
  const mediaAon = soAon.reduce((a, m) => a + m.total.investimento, 0) / (soAon.length || 1);
  // Linhas do AON no mosaico que rodaram em todos os meses.
  const rodouNoMes = new Set(s.grade.celulas.filter((c) => c.investimento > 0 || c.impressoes > 0).map((c) => `${c.linha}|${c.mes}`));
  const metaAonLinhas = s.grade.linhas.filter((l) => l.campanha === aon.campanha && l.plataforma === "Meta");
  const metaAonTodoMes = metaAonLinhas.filter((l) => s.grade.meses.every((m) => rodouNoMes.has(`${l.id}|${m}`)));
  const metaAonParcial = metaAonLinhas
    .filter((l) => !metaAonTodoMes.includes(l))
    .map((l) => {
      const ms = s.meses.filter((m) => rodouNoMes.has(`${l.id}|${m.mes}`));
      return ms.length ? `${l.estrategia.toLowerCase()}, de ${ms[0].nome} a ${ms[ms.length - 1].nome}` : "";
    })
    .filter(Boolean);
  const presenca = metaAonTodoMes.length
    ? `A Pesquisa e o Meta do AON (${fmtLista(metaAonTodoMes.map((l) => l.estrategia.toLowerCase()))}) estiveram presentes em todos os ${fmtExtenso(s.meses.length)} meses${metaAonParcial.length ? `; ${fmtLista(metaAonParcial)}` : ""}`
    : `A Pesquisa esteve presente em todos os ${fmtExtenso(s.meses.length)} meses`;
  // Feminino de "um"/"dois" (estratégias).
  const extensoF = (n: number) => ({ 1: "uma", 2: "duas" })[n] ?? fmtExtenso(n);
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
            A campanha Institucional AON manteve o Campo Santo na busca do Google e no Meta o ano todo, com {fmtMil(aon.investimento)}:{" "}
            {fmtNum(google.cliques)} cliques na busca{metaAon ? <> e {fmtCompact(metaAon.impressoes, 1)} de impressões no Facebook e no Instagram</> : null}. A campanha de Cremação, de {fmtDia(cremacao.contratado.inicio)} a {fmtDia(cremacao.contratado.fim)}, levou a
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
                  { label: `AON · Pesquisa · ${fmtMil(google.investimento)}`, value: google.investimento, color: "var(--amber)" },
                  ...(metaAon ? [{ label: `AON · Meta · ${fmtMil(metaAon.investimento)}`, value: metaAon.investimento, color: "var(--dusk-2)" }] : []),
                  { label: `Cremação · Meta · ${fmtMil(metaMeta.investimento)}`, value: metaMeta.investimento, color: "rgba(126,161,212,.5)" },
                  { label: `Cremação · YouTube · ${fmtMil(youtube.investimento)}`, value: youtube.investimento, color: "var(--copper)" },
                ]}
              />
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
              AON desde {fmtDia(aon.inicio)} · Cremação desde {fmtDia(cremacao.inicio)}
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Fato valor={fmtNum(google.cliques)} rotulo={`cliques na busca do Google, em média ${fmtNum(mediaCliques)} por mês fechado`} tom="text-amber" />
            {metaAon ? (
              <Fato
                valor={fmtCompact(metaAon.impressoes, 1)}
                rotulo={`impressões do Institucional AON no Facebook e no Instagram, com ${fmtCompact(metaAon.cliquesLink, 1)} cliques no link`}
                tom="text-dusk-2"
              />
            ) : (
              <Fato valor={fmtNum(aon.conversoes)} rotulo="conversões registradas pela busca do Google" tom="text-amber" />
            )}
            <Fato valor={fmtCompact(metaMeta.impressoes, 0)} rotulo={`impressões da Cremação no Meta, ${fmtPct(metaMeta.pctMeta, 0)} da meta`} tom="text-dusk-2" />
            <Fato valor={fmtCompact(youtube.views, 1)} rotulo={`views no YouTube, ${fmtPct(metaYt.pctMeta, 0)} da meta`} tom="text-copper" />
          </div>
        </div>
      </Section>

      <Section
        index="02"
        eyebrow="Mês a mês"
        title={
          <>
            O AON sustentou o ano; a Cremação <em>entrou em {mesCremacao.nome}.</em>
          </>
        }
        description={
          <>
            De {primeiro.nome} a {soAon[soAon.length - 1].nome}, só o Institucional AON, na busca do Google e no Meta, com cerca de {fmtMil(mediaAon)} por mês. A
            partir de {fmtDia(metaMeta.inicio)} o Meta e, em {fmtDia(youtube.inicio)}, o YouTube somam a campanha de Cremação: em {mesCremacao.nome} o
            investimento chega a {fmtMil(mesCremacao.total.investimento)} e as impressões, a {fmtCompact(mesCremacao.total.impressoes, 1)}.
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
            De {primeiro.estrategiasAtivas} para {ativasMax} <em>estratégias no ar.</em>
          </>
        }
        description={`Cada linha é uma estratégia, cada coluna um mês; quanto mais intensa a célula, maior o investimento, e vazia quando a estratégia não rodou. ${presenca}; o Meta Alcance da Cremação e o YouTube entraram em ${mesCremacao.nome}.${ultimo.parcial ? ` Em ${ultimo.nome}, até ${fmtDia(s.periodo.fim)}, ${ultimo.estrategiasAtivas === 1 ? "uma estratégia rodou" : `${extensoF(ultimo.estrategiasAtivas)} rodaram`}${novAon ? `; a busca retomou em ${fmtDia(novAon.inicio)}` : ""}.` : ""}`}
      >
        <ChartFrame
          eyebrow="Estratégia × mês · investimento"
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
              texto: "Anúncios e palavras-chave da busca, público do Meta por idade e gênero, retenção do vídeo no YouTube e os criativos das duas campanhas.",
              tom: "amber",
            },
            {
              href: "/campanhas",
              titulo: "Campanhas",
              numero: `${fmtNum(t.campanhas)} campanhas`,
              legenda: "Institucional AON · Cremação",
              texto: "O que cada campanha recebeu e entregou: cliques por mês frente à meta e a entrega no Meta no AON, impressões e views na Cremação.",
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
