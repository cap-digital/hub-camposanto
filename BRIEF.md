# Balanço de mídia 2026 · Cemitério Campo Santo (01/jan → 15/nov)

Balanço de apresentação para o **Cemitério Campo Santo (Santa Casa da Bahia)**: a mídia digital de 2026, de 01/01 a 15/11. São **duas campanhas** (no lugar das quatro frentes do HSI): o **Institucional AON**, no Google Pesquisa e no Meta ao longo do ano, e a **Campanha Cremação**, no Meta e no YouTube. O relatório é **agregado**, com números grandes, comparações e metas atingidas. Não tem leitura dia a dia nem filtro de data.

**Base:** réplica do projeto `../relatorio-hsi` (Hospital Santa Izabel), com a mesma arquitetura, os mesmos componentes e o mesmo motion. Mudam a **pele** (cores, fontes, textos) e o **conteúdo**. Não invente componentes nem seções fora do que está descrito aqui.

> Next 16.4 (App Router) com **Cache Components** e **Partial Prefetching** ligados, e Tailwind 4 pelo loader `@tailwindcss/turbopack` (sem postcss). Antes de escrever código, leia o `AGENTS.md`, que manda consultar `node_modules/next/dist/docs/`.

---

## 1. Dados

- **`src/data/snapshot.json`** é a única fonte. É estático, já vem agregado e as páginas são HTML gerado no build. Nenhuma API é chamada em tempo de execução. As páginas importam o snapshot tipado de `src/data/snapshot.ts`, nunca o JSON direto, porque os literais de plataforma não são inferidos do JSON.
- **Para regenerar:**
  ```
  python3 scripts/build-snapshot.py data/camposanto-dados.json src/data/snapshot.json --de 2026-01-01 --ate 2026-11-15 \
    --meta-aon data/meta-aon-camposanto.json --imagens
  ```
- **`--meta-aon`** traz o Meta do Institucional AON (extraído da API do Meta): `mensal` (mês × estratégia: Tráfego, Alcance, Posts de oportunidade), `publicoIdadeGenero` e `criativos`. Investimento = campo `investimento` como está, sem escala nem trava. Entra **dentro** do Institucional AON, sem meta contratada (só entrega); a meta de 909 cliques/mês continua só sobre o Google Pesquisa. Métrica principal: Tráfego = cliques no link; Alcance e Posts de oportunidade = impressões. As imagens dos criativos ficam só em `public/criativos/meta-aon-*.jpg`.
  O `curl` que baixa `data/camposanto-dados.json` está no topo do script (função `CampoSantoAON`, `--data '{"name":"Functions"}'`). A pasta `data/` fica no `.gitignore`.
- **`--imagens`** baixa as miniaturas dos criativos para `public/criativos/`, porque as URLs do fbcdn expiram. Rode uma vez localmente antes do deploy.

**Abas da função**

| Aba | Conteúdo |
|---|---|
| `google2` | Institucional AON · Google Pesquisa · jan → out |
| `google` | Institucional AON · Google Pesquisa · novembro (PI 452, começa em 06/11) |
| `cremacaoMeta` | Cremação · Meta Alcance (idade × gênero, thumbnail, permalink) |
| `cremacaoYT` | Cremação · YouTube visualização (taxas de quartil, URL do vídeo) |
| `googlekeywords` | Google Pesquisa por palavra-chave (date, campaign, clicks, impressions, conversions, keyword_text) |

**Regras (no `build-snapshot.py`)**

- **Corte:** só datas de 2026-01-01 a 2026-11-15, em todas as abas.
- **Investimento:** é a coluna `Investimento`, como vem. A base já distribui o valor pelo contratado, então **não há trava nem ajuste**. Nunca use spend.
- **Formato dos números:** decimais podem vir com vírgula (`"1.234,56"`). `#DIV/0!` e células vazias contam 0. Linhas sem data são descartadas.
- **Sobreposição:** `google` e `google2` não podem ter datas em comum. Se tiverem, o script interrompe o build.
- **Novembro é parcial**, de 06 a 15/11 (não há dados de 01 a 05/11). `meses[].parcial` liga a hachura e a legenda "Mês parcial" no gráfico mensal, no mosaico e nas metas do AON.
- **YouTube:** os quartis são estimados (taxa × impressões) e aparecem só em %.
- **Views:** no YouTube são as views TrueView; no Meta, `actions_video_view` (3 s). As duas métricas não se misturam. O "Views de vídeo" do hero é só YouTube.
- **Palavras-chave:**
  - ignorar as linhas sem `keyword_text`;
  - normalizar o termo (minúsculas, trim, espaços duplicados);
  - guardar só termos com ≥ 1 clique;
  - não há custo por palavra-chave na fonte.
  - Conferência: o script compara os cliques das keywords com os da Pesquisa e grava `completa`.
- **Sem alcance em lugar nenhum:** a fonte não tem alcance único.
- **Avisos:** `avisos[]` aparecem só em dev, no rodapé.

**Metas contratadas** (só servem para o "% da meta"; não ajustam nada)

- **Institucional AON:** R$ 2.000 e 909 cliques por mês.
- **Cremação** (contratada de 04/10 a 13/11):
  - Meta Alcance: R$ 3.000 e 333.333 impressões;
  - YouTube: R$ 4.000 e 33.333 views.

**Números de referência**

| Métrica | Valor |
|---|---|
| Investimento total | R$ 58.905,13 (AON R$ 51.905,13 = Google R$ 20.788,88 + Meta R$ 31.116,25 · Cremação R$ 7.000,00) |
| Impressões | 16.115.265 |
| Cliques | 161.773 (10.834 na busca; Meta AON 149.275, dos quais 135.717 no link) |
| Conversões | 361 (Google Pesquisa) |
| Views YouTube | 55.032 · CPV R$ 0,07 |
| CPC da busca | R$ 1,92 · CTR 7,4% |

- **AON jan–out:** R$ 2.000 em cada mês (jan R$ 1.999,99 por arredondamento).
  - Cliques por mês: 930 · 911 · 1.168 · 1.136 · 1.075 · 1.197 · 1.190 · 912 · 1.013 · 961, total de 10.493 (115% de 9.090).
  - 142.182 impressões e 357 conversões.
  - Os 10 meses ficaram acima de 909 cliques.
- **AON novembro (parcial, 06 → 15/11):** R$ 788,87, 341 cliques, 3.878 impressões e 4 conversões.
- **Cremação Meta (dados de 05/10 a 13/11):** R$ 3.000, 728.168 impressões (218%), 1.643 cliques e 10.793 visualizações de 3 s.
- **Cremação YouTube (dados de 16/10 a 13/11):** R$ 4.000, 55.032 views (165%) e 170.231 impressões. A retenção a partir dos 25% vai a 84% → 76% → 69%.
- **Palavras-chave (01/01 → 15/11):**
  - 183 termos, dos quais 122 com clique;
  - 10.810 cliques contra 10.834 da Pesquisa (−0,2%, fonte completa);
  - 30 termos com ≥ 1 conversão.
  - A soma das conversões das keywords (363) difere do consolidado (361), por isso o resumo do bloco não mostra conversões.
- **Meta AON (01/01 → 15/11):** R$ 31.116,25, 15.070.806 impressões e 135.717 cliques no link. Tráfego R$ 16.502,37 (123.829 cliques no link) · Alcance R$ 11.903,72 (9.595.158 impressões) · Posts de oportunidade R$ 2.710,16 (2.183.957 impressões, jan → out).
- **Criativos:** 12 no total (9 do Meta no AON, 2 do Meta na Cremação e 1 vídeo do YouTube), Meta por impressões e depois YouTube; no PDF, todos em 6 colunas.

---

## 2. Identidade: mesma estrutura do HSI, outra pele

Os **nomes** dos tokens são os mesmos do HSI (`--amber`, `--copper`, `--dusk`…); só os valores mudam. O tom é sóbrio e respeitoso (cemitério e crematório): nada de frases eufóricas.

```css
--ink: #15120f;  --surface-1..4: #1b1714 · #221d19 · #2b2520 · #362e27;   /* pedra/terra quente, sem verde */
--text: #f5eddc; --text-2: #c4b6a0; --text-3: #8e816d;
--amber: #e3a467;  /* cobre = cor principal · série Google Pesquisa / Institucional AON */
--dusk-2: #7ea1d4; /* azul = série Meta */
--copper: #c9694c; /* terracota = série YouTube */
--chart-scale: #241e19 → #e3a467
```

- **Fontes:** display em Hanken Grotesk (500); destaque em Newsreader itálico (o Cormorant foi descartado pelo circunflexo solto); corpo e mono em Geist e Geist Mono.
- **Logo:** `LogoCampoSanto`, com "Campo Santo" + ponto cobre. Com `withCargo`, mostra "Cemitério e Crematório · Santa Casa da Bahia".
- **Favicon:** `icon.svg` com o "C" da Hanken Grotesk mais o ponto cobre, e `apple-icon.png` de 180 px.
- **Preloader:** "Campo Santo." com o subtítulo "Balanço de mídia de 2026".
- **Cortina:** painel cobre e depois o ink.
- **Rodapé:** a palavra vazada é CAMPO SANTO.

## 3. Rotas

| Rota | Conteúdo |
|---|---|
| `/` | **Hero** "Presença constante, *mês a mês.*" com KPIs Investimento · Impressões · Cliques · Conversões · Views de vídeo (YouTube) · **CPC da busca**. **01** AON × Cremação: SplitBar e 4 fatos. **02** gráfico mensal com 3 séries empilhadas e a linha de impressões. **03** mosaico canal × mês (Pesquisa, Meta Alcance, YouTube). **04** portas. |
| `/midia` | **01** Busca no Google: KPIs, os 6 anúncios de texto com mais cliques e as palavras-chave **sem abas**, com o seletor Cliques · Impressões · CTR (≥ 50 impr.) · Conversões (≥ 1); no PDF, a página só-PDF com o top 10. **02** Público do Meta (idade × gênero; Impressões · Cliques · Investimento). **03** Vídeo: retenção do YouTube só em % e as visualizações do Meta como número de apoio. **04** Criativos (Meta + YouTube, com "Ver anúncio ↗" quando há link; sem "Ver todos" com 3 peças). |
| `/campanhas` | **01** Institucional AON, com metas atingidas jan–out (KPIs mais cliques × meta mês a mês, com a marca da meta e o % do investimento). Novembro aparece **parcial, hachurado e sem % de meta**. **02** Cremação, com um cartão por canal (% da meta, barra com a marca da meta e investimento sobre o contratado). |
| `/relatorio` | Início + Mídia + Campanhas, para o PDF. |
| `/api/pdf` | Chrome headless abre `/relatorio`, rola a página e imprime uma seção por página. Com Cache Components, `req.url` é lido **fora** do try/catch, porque a interrupção do prerender não pode ser capturada. Sem `export const dynamic`. |

## 4. Critérios de pronto

- [ ] `rm -rf .next && npm run build` sem erros nem warnings, e `npx eslint src` limpo. O cache do Turbopack já deixou de ver edições no `globals.css`; na dúvida, limpe o `.next`.
- [ ] Os números batem com a seção 1.
- [ ] Nenhuma menção a "alcance" como métrica ("Meta Alcance" é nome de estratégia) e nenhum resto do HSI: buscar `Izabel`, `Faz Bem`, `Curativos`, `limão`.
- [ ] Preloader → cortina → reveals → contadores funcionando, e `prefers-reduced-motion` respeitado.
- [ ] `/api/pdf` gera o PDF de `/relatorio`, uma seção por página.
- [ ] Mobile 375px sem scroll horizontal nas 4 rotas.
