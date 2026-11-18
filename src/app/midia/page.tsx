import type { Metadata } from "next";
import { ChartFrame } from "@/components/core/chart-frame";
import { KpiTile } from "@/components/core/kpi-tile";
import { Section } from "@/components/core/section";
import { PageHero } from "@/components/hero/page-hero";
import { CriativosGrid } from "@/components/paginas/criativos";
import { EntregaPublico } from "@/components/paginas/entrega-publico";
import { PalavrasChave, PalavrasChavePdf } from "@/components/paginas/palavras-chave";
import { Retencao } from "@/components/viz/small";
import { fmtBRL, fmtCompact, fmtDia, fmtMil, fmtNum, fmtPct } from "@/data/format";
import { s } from "@/data/snapshot";

export const metadata: Metadata = { title: "Mídia · Campo Santo" };

export default function Midia() {
  const t = s.totais;
  const [, cremacao] = s.campanhas;
  const youtube = s.plataformas.find((p) => p.plataforma === "YouTube")!;
  const b = s.busca;
  const v = s.video;
  const fimYt = v.youtube.p25 ? v.youtube.p100 / v.youtube.p25 : 0;

  // Público do Meta: faixa e gênero com mais impressões (texto da seção).
  const porFaixa = new Map<string, number>();
  for (const l of s.publico.meta) if (l.idade !== "desconhecida") porFaixa.set(l.idade, (porFaixa.get(l.idade) ?? 0) + l.impressoes);
  const totalPublico = s.publico.meta.reduce((a, l) => a + l.impressoes, 0) || 1;
  const faixasTop = [...porFaixa.entries()].sort((a, b) => b[1] - a[1]);
  const semGenero = s.publico.meta.filter((l) => l.genero === "unknown").reduce((a, l) => a + l.impressoes, 0) / totalPublico;
  const acima45 = ["45-54", "55-64", "65+"].reduce((a, f) => a + (porFaixa.get(f) ?? 0), 0) / totalPublico;

  return (
    <main>
      <PageHero
        tone="amber"
        image="none"
        eyebrow="Mídia · Google Pesquisa · Meta Alcance · YouTube"
        title={
          <>
            Onde a mensagem <em>chegou.</em>
          </>
        }
        description={`${fmtMil(t.investimento)} em três canais: a busca do Google ao longo do ano e, na campanha de Cremação, o Meta e o YouTube. ${fmtCompact(t.impressoes, 2)} de impressões e ${fmtCompact(t.cliques, 1)} cliques.`}
        kpis={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <KpiTile label="Investimento" value={t.investimento} format="compactCurrency" decimals={1} tone="amber" hint="Google + Meta + YouTube" />
            <KpiTile label="Impressões" value={t.impressoes} format="compact" decimals={2} />
            <KpiTile label="CPM" value={t.cpm} format="currency" decimals={2} hint="Custo por mil impressões" />
            <KpiTile label="CTR" value={t.ctr * 100} format="percent" decimals={2} hint="Cliques ÷ impressões" />
            <KpiTile label="Cliques" value={t.cliques} format="compact" decimals={1} hint={`CPC de ${fmtBRL(t.cpc, { decimals: 2 })}`} className="col-span-2 md:col-span-1" />
          </div>
        }
      />

      <Section
        index="01"
        eyebrow="Busca no Google"
        title={
          <>
            {fmtPct(b.ctr)} das impressões na busca <em>viraram clique.</em>
          </>
        }
        description={`Quem procurou o Campo Santo no Google encontrou o anúncio: ${fmtNum(b.cliques)} cliques a ${fmtBRL(b.cpc, { decimals: 2 })} cada e ${fmtNum(b.conversoes)} conversões, com ${fmtMil(b.investimento)} investidos na Pesquisa.`}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <KpiTile label="Cliques na busca" value={b.cliques} format="number" tone="amber" />
            <KpiTile label="Conversões" value={b.conversoes} format="number" />
            <KpiTile label="CTR" value={b.ctr * 100} format="percent" decimals={1} />
            <KpiTile label="CPC" value={b.cpc} format="currency" decimals={2} />
          </div>
          <ChartFrame
            eyebrow="Anúncios de texto"
            title={`Os ${b.anuncios.length} anúncios com mais cliques`}
            subtitle="Títulos de cada anúncio, como apareceram na busca"
            minHeight={200}
            lazy={false}
            tone="amber"
          >
            <ul className="divide-y divide-line">
              {b.anuncios.map((a) => (
                <li key={a.titulos.join("|")} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-3">
                  <div className="min-w-0">
                    <span className="text-[14px] font-medium text-text">{a.titulos[0]}</span>
                    <span className="ml-3 font-mono text-[11px] text-text-3">{a.titulos.slice(1).join(" · ")}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[12px] text-text-2 tabular">
                    <span className="text-text">{fmtNum(a.cliques)}</span> cliques · CTR {fmtPct(a.ctr)} · {fmtNum(a.conversoes)} conv.
                  </span>
                </li>
              ))}
            </ul>
          </ChartFrame>
        </div>
        {/* Tela: seletor de métrica. No PDF este bloco sai e as palavras-chave ganham a página seguinte. */}
        <ChartFrame
          eyebrow="Google Pesquisa · palavras-chave"
          title="Palavras-chave que mais trouxeram cliques"
          subtitle="Os termos comprados na busca, ordenados pela métrica escolhida"
          minHeight={420}
          tone="amber"
          className="no-print mt-4"
        >
          <PalavrasChave dados={b.palavrasChave} />
        </ChartFrame>
      </Section>

      {/* Só no PDF: o top 10 por cliques, sem seletor. */}
      <Section
        index="01"
        eyebrow="Busca no Google · palavras-chave"
        className="so-pdf"
        title={
          <>
            Palavras-chave que <em>mais trouxeram cliques.</em>
          </>
        }
      >
        <PalavrasChavePdf dados={b.palavrasChave} />
      </Section>

      <Section
        index="02"
        eyebrow="Público do Meta · Cremação"
        tone="dusk"
        title={
          <>
            Para <em>quem</em> a Cremação foi entregue.
          </>
        }
        description={
          <>
            No Meta, a faixa de {faixasTop[0]?.[0].replace("-", " a ")} anos recebeu {fmtPct((faixasTop[0]?.[1] ?? 0) / totalPublico, 0)} das impressões da campanha de
            Cremação; pessoas de 45 anos ou mais, {fmtPct(acima45, 0)}. Em {fmtPct(semGenero, 0)} das impressões o Meta não informa o gênero.
            <span className="no-print"> Escolha o tipo de entrega.</span>
          </>
        }
      >
        <ChartFrame eyebrow="Meta · gênero × idade" title="Entrega por gênero e idade" minHeight={420} tone="dusk">
          <EntregaPublico linhas={s.publico.meta} />
        </ChartFrame>
      </Section>

      <Section
        index="03"
        eyebrow="Vídeo"
        tone="copper"
        title={
          <>
            No YouTube, {fmtPct(fimYt, 0)} de quem passou de 25% <em>viu até o fim.</em>
          </>
        }
        description={`${fmtNum(youtube.views)} views no YouTube, a ${fmtBRL(youtube.cpv, { decimals: 2 })} cada. A curva mostra, de quem chegou a 25% do vídeo, quantos seguiram até cada marco; os quartis do YouTube são estimados. No Meta, o vídeo teve ${fmtNum(v.meta.views)} visualizações.`}
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <ChartFrame eyebrow="YouTube · retenção de vídeo" title="Quem ficou até o fim" footer={`${fmtNum(v.youtube.views)} views · quartis estimados`} minHeight={280} tone="copper">
            <Retencao
              etapas={[
                { label: "25%", value: v.youtube.p25 },
                { label: "50%", value: v.youtube.p50 },
                { label: "75%", value: v.youtube.p75 },
                { label: "100%", value: v.youtube.p100 },
              ]}
              soPct
              rgb="201,105,76"
            />
          </ChartFrame>
          <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
            <KpiTile label="Views · YouTube" value={youtube.views} format="number" tone="copper" hint={`CPV de ${fmtBRL(youtube.cpv, { decimals: 2 })} · desde ${fmtDia(youtube.inicio)}`} />
            <KpiTile label="Visualizações · Meta" value={v.meta.views} format="number" tone="dusk" hint={`Vídeo de 3 s ou mais · ${fmtNum(v.meta.thruplays)} ThruPlays`} />
          </div>
        </div>
      </Section>

      <Section
        index="04"
        eyebrow={`Criativos · campanha ${cremacao.campanha}`}
        title={
          <>
            As peças <em>da Cremação.</em>
          </>
        }
        description={
          <>
            {s.criativos.length} criativos: {s.criativos.filter((c) => c.plataforma === "Meta").length} no Meta e{" "}
            {s.criativos.filter((c) => c.plataforma === "YouTube").length} no YouTube, com a métrica principal de cada canal (impressões no Meta, views no
            YouTube) e o investimento.
            <span className="no-print"> Abra o anúncio quando houver link.</span>
          </>
        }
      >
        <CriativosGrid criativos={s.criativos} />
      </Section>
    </main>
  );
}
