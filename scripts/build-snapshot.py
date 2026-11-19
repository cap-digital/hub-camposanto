#!/usr/bin/env python3
"""
Gera src/data/snapshot.json (relatório agregado 2026 do Cemitério Campo Santo) a partir do JSON
da edge function do Supabase (CampoSantoAON). Adaptado do build-snapshot.py do relatorio-hsi.

Uso:
  1) baixar os dados:
     curl -sS -L -X POST 'https://cqrpbiepyeypbkizwacu.supabase.co/functions/v1/CampoSantoAON' \
       -H 'Authorization: Bearer <chave>' -H 'apikey: <chave>' \
       -H 'Content-Type: application/json' --data '{"name":"Functions"}' -o data/camposanto-dados.json
  2) python3 scripts/build-snapshot.py data/camposanto-dados.json src/data/snapshot.json --de 2026-01-01 --ate 2026-11-15 \
       --meta-aon data/meta-aon-camposanto.json --imagens
     (--de / --ate AAAA-MM-DD: corte de data, aplicado a todas as abas)
     (--meta-aon: Meta do Institucional AON, extraído da API do Meta — "mensal", "publicoIdadeGenero" e "criativos")
     (--imagens baixa as miniaturas dos criativos para public/criativos/; as URLs do fbcdn expiram)

Abas da função:
  - google2         Institucional AON, Google Pesquisa, jan → out
  - google          Institucional AON, Google Pesquisa, novembro (PI 452)
  - cremacaoMeta    Campanha Cremação · Meta Alcance (idade × gênero, thumbnail, permalink)
  - cremacaoYT      Campanha Cremação · YouTube (visualização; taxas de quartil, URL do vídeo)
  - googlekeywords  Google Pesquisa por palavra-chave (date, campaign, clicks, impressions, conversions, keyword_text)

Meta AON (--meta-aon):
  - "mensal" (mes, estrategia, investimento, impressoes, cliques, cliquesLink, engajamento): Tráfego, Alcance e
    Posts de oportunidade, dentro da campanha Institucional AON. Investimento = campo "investimento" como está.
  - Sem meta contratada: só entrega. A meta de cliques do AON (909/mês) continua só sobre o Google Pesquisa.
  - Métrica principal: Tráfego = cliques no link; Alcance e Posts de oportunidade = impressões.
  - "publicoIdadeGenero" soma ao público do Meta; "criativos" entram na grade (imagem só em cópia local).

Regras:
  - Investimento = coluna "Investimento" como vem. A base já distribui pelo contratado: NÃO há trava nem ajuste.
    Nunca usar spend.
  - Decimais podem vir com vírgula ("1.234,56"); "#DIV/0!" e vazios contam 0. Linhas sem data são descartadas.
  - google e google2 não podem se sobrepor: datas em comum interrompem o build.
  - YouTube: a fonte traz a TAXA de cada quartil por dia; contagem = taxa × impressões (estimativa: mostrar só em %).
  - Palavras-chave: só termos não vazios, normalizados (minúsculas, trim, espaços duplicados); sem custo na fonte.
  - Sem alcance: a fonte não tem alcance único.
"""

import json
import os
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone

MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
FAIXAS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]

AON = "Institucional AON"
CREMACAO = "Cremação"

# Plataformas (séries do gráfico mensal e blocos da página Mídia).
PLATAFORMAS = [
    {"plataforma": "Google", "rotulo": "Google Pesquisa"},
    {"plataforma": "Meta", "rotulo": "Meta"},
    {"plataforma": "YouTube", "rotulo": "YouTube"},
]

# Linhas do mosaico (plataforma · estratégia · campanha). A ordem é a das linhas.
LINHAS = [
    {"id": "google-pesquisa", "plataforma": "Google", "estrategia": "Pesquisa", "rotulo": "Pesquisa", "campanha": AON},
    {"id": "meta-trafego", "plataforma": "Meta", "estrategia": "Tráfego", "rotulo": "Meta Tráfego", "campanha": AON},
    {"id": "meta-alcance-aon", "plataforma": "Meta", "estrategia": "Alcance", "rotulo": "Meta Alcance · AON", "campanha": AON},
    {"id": "meta-oportunidade", "plataforma": "Meta", "estrategia": "Posts de oportunidade", "rotulo": "Posts de oportunidade", "campanha": AON},
    {"id": "meta-alcance-cremacao", "plataforma": "Meta", "estrategia": "Alcance", "rotulo": "Meta Alcance · Cremação", "campanha": CREMACAO},
    {"id": "youtube", "plataforma": "YouTube", "estrategia": "Visualização", "rotulo": "YouTube", "campanha": CREMACAO},
]
LINHA_DE = {(l["plataforma"], l["estrategia"], l["campanha"]): l["id"] for l in LINHAS}
ESTRATEGIAS_META_AON = ["Tráfego", "Alcance", "Posts de oportunidade"]

# Metas contratadas (não ajustam nada: só servem para o "% da meta" na interface).
META_AON_MES = {"investimento": 2000, "cliques": 909}
META_CREMACAO = {
    "Meta": {"investimento": 3000, "metrica": "impressoes", "meta": 333333},
    "YouTube": {"investimento": 4000, "metrica": "views", "meta": 33333},
}
PERIODO_CREMACAO = {"inicio": "2026-10-04", "fim": "2026-11-13"}  # contratado


def num(x):
    """Número da planilha: aceita int/float, '1234.5', '1.234,56', '25,125'. Vazio, '#DIV/0!' e NaN → 0."""
    if isinstance(x, bool) or x is None:
        return 0.0
    if isinstance(x, (int, float)):
        return float(x) if x == x else 0.0
    s = str(x).strip().replace("R$", "").replace("%", "").strip()
    if not s:
        return 0.0
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v == v else 0.0
    except ValueError:
        return 0.0


def metricas():
    # cliquesLink: só o Meta do AON traz (cliques no link, métrica principal do Tráfego).
    return {"investimento": 0.0, "impressoes": 0.0, "cliques": 0.0, "cliquesLink": 0.0, "views": 0.0, "conversoes": 0.0}


def soma(m, r):
    for k in m:
        m[k] += r[k]


def fecha(m, extra=None):
    """Arredonda e acrescenta CTR, CPM, CPC e CPV."""
    out = {k: round(v, 2) if k == "investimento" else round(v) for k, v in m.items()}
    imp, cli, inv, vw = m["impressoes"], m["cliques"], m["investimento"], m["views"]
    out["ctr"] = round(cli / imp, 5) if imp else 0
    out["cpm"] = round(inv / imp * 1000, 2) if imp else 0
    out["cpc"] = round(inv / cli, 2) if cli else 0
    out["cpv"] = round(inv / vw, 3) if vw else 0
    if extra:
        out.update(extra)
    return out


def dia_de(r):
    return (r.get("date") or "")[:10]


def cortar(linhas, de, ate):
    ficam = [r for r in linhas if dia_de(r) and de <= dia_de(r) <= ate]
    return ficam, len(linhas) - len(ficam)


def normaliza(raw, de, ate):
    """Todas as abas de mídia → linhas no mesmo formato."""
    rows = []
    for tabela, plat, estr, camp in (("google2", "Google", "Pesquisa", AON), ("google", "Google", "Pesquisa", AON),
                                     ("cremacaoMeta", "Meta", "Alcance", CREMACAO), ("cremacaoYT", "YouTube", "Visualização", CREMACAO)):
        linhas, fora = cortar(raw.get(tabela, []), de, ate)
        print(f"{tabela:13} {len(linhas):5} linhas no período · {fora} fora de {de} → {ate}")
        for r in linhas:
            dia = dia_de(r)
            views = num(r.get("video_trueview_views")) if plat == "YouTube" else (num(r.get("actions_video_view")) if plat == "Meta" else 0.0)
            rows.append({
                "_tabela": tabela, "_raw": r, "_dia": dia, "_mes": dia[:7], "_plat": plat, "_estr": estr, "_camp": camp,
                "_nomeCampanha": r.get("campaign") or "", "_criativo": r.get("ad_name") or "",
                "investimento": num(r.get("Investimento")),
                "impressoes": num(r.get("impressions")),
                "cliques": num(r.get("clicks")),
                "cliquesLink": 0.0,
                # Views: YouTube = TrueView; Meta = actions_video_view (3 s). A interface separa as duas.
                "views": views,
                "conversoes": num(r.get("conversions")),
            })
    return rows


def fim_do_mes(mes):
    a, m = int(mes[:4]), int(mes[5:7])
    prox = datetime(a + (m == 12), m % 12 + 1, 1)
    return (prox - timedelta(days=1)).strftime("%Y-%m-%d")


def normaliza_meta_aon(meta_aon, de, ate):
    """Meta AON ("mensal") → linhas no mesmo formato, uma por mês × estratégia. Sem data diária: o dia é o 1º do mês
    (ou o início do corte), só para os períodos."""
    rows, fora = [], 0
    for r in meta_aon.get("mensal", []):
        mes = r.get("mes") or ""
        if not (de[:7] <= mes <= ate[:7]):
            fora += 1
            continue
        estr = r.get("estrategia") or ""
        if estr not in ESTRATEGIAS_META_AON:
            sys.exit(f"ERRO: estratégia Meta AON desconhecida: {estr!r}")
        rows.append({
            "_tabela": "metaAon", "_raw": r, "_dia": max(de, f"{mes}-01"), "_diaFim": min(ate, fim_do_mes(mes)), "_mes": mes, "_plat": "Meta", "_estr": estr, "_camp": AON,
            "_nomeCampanha": r.get("campanha") or "", "_criativo": "",
            "investimento": num(r.get("investimento")),
            "impressoes": num(r.get("impressoes")),
            "cliques": num(r.get("cliques")),
            "cliquesLink": num(r.get("cliquesLink")),
            "views": 0.0,
            "conversoes": 0.0,
        })
    print(f"{'metaAon':13} {len(rows):5} linhas (mês × estratégia) no período · {fora} fora de {de[:7]} → {ate[:7]}")
    return rows


def palavras_chave(linhas, de, ate, cliques_pesquisa):
    """googlekeywords → {porFrente: {AON: [termos com clique]}, totais: {AON: {...}}}. A interface reordena e corta."""
    acc = defaultdict(lambda: {"impressoes": 0.0, "cliques": 0.0, "conversoes": 0.0})
    vazias, fora = 0, 0
    for r in linhas:
        termo = " ".join((r.get("keyword_text") or "").lower().split())
        if not termo:
            vazias += 1
            continue
        if not (de <= dia_de(r) <= ate):
            fora += 1
            continue
        x = acc[termo]
        x["impressoes"] += num(r.get("impressions"))
        x["cliques"] += num(r.get("clicks"))
        x["conversoes"] += num(r.get("conversions"))
    print(f"palavras-chave: {len(linhas)} linhas · {vazias} sem termo · {fora} fora de {de} → {ate} · {len(acc)} termos")

    termos = sorted(acc.items(), key=lambda tm: (-tm[1]["cliques"], -tm[1]["impressoes"], tm[0]))
    com_clique = [(t, m) for t, m in termos if round(m["cliques"]) > 0]
    lista = [{"termo": t, "impressoes": round(m["impressoes"]), "cliques": round(m["cliques"]),
              "conversoes": round(m["conversoes"], 1),
              "ctr": round(m["cliques"] / m["impressoes"], 5) if m["impressoes"] else 0} for t, m in com_clique]
    cliques = round(sum(m["cliques"] for _, m in termos))
    cons = round(cliques_pesquisa)
    totais = {"termos": len(com_clique), "cliques": cliques,
              "impressoes": round(sum(m["impressoes"] for _, m in com_clique)),
              "conversoes": round(sum(m["conversoes"] for _, m in termos)),
              "cliquesPesquisa": cons,
              # Fonte completa: as keywords cobrem os cliques de Pesquisa (tolerância de 1%).
              "completa": bool(cons) and cliques >= cons * 0.99}
    dif = cliques - cons
    pct = f"{dif / cons * 100:+.1f}%" if cons else "—"
    print(f"conferência · palavras-chave {cliques:,} cliques × Pesquisa {cons:,} → {dif:+,} ({pct})".replace(",", "."))
    return {"porFrente": {AON: lista}, "totais": {AON: totais}}


def atualizado_em(raw, meta_aon_src):
    """Dado mais recente: timestamp da função ou a extração do Meta AON (data de modificação do arquivo)."""
    datas = []
    if raw.get("timestamp"):
        datas.append(datetime.fromisoformat(raw["timestamp"].replace("Z", "+00:00")))
    if meta_aon_src:
        datas.append(datetime.fromtimestamp(os.path.getmtime(meta_aon_src), timezone.utc))
    d = max(datas) if datas else datetime.now(timezone.utc)
    return d.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def main(src, dst, baixar_imagens, de, ate, meta_aon_src=None):
    raw = json.load(open(src, encoding="utf-8"))
    meta_aon = json.load(open(meta_aon_src, encoding="utf-8")) if meta_aon_src else {}
    avisos = []

    # google × google2: as abas não podem se sobrepor.
    g1 = {dia_de(r) for r in raw.get("google", []) if dia_de(r)}
    g2 = {dia_de(r) for r in raw.get("google2", []) if dia_de(r)}
    comuns = sorted(g1 & g2)
    if comuns:
        sys.exit(f"ERRO: google e google2 têm {len(comuns)} data(s) em comum: {', '.join(comuns[:10])}")
    print(f"google × google2: sem datas em comum (google2 {min(g2)} → {max(g2)} · google {min(g1)} → {max(g1)})")

    rows = normaliza(raw, de, ate) + normaliza_meta_aon(meta_aon, de, ate)
    for r in rows:
        r["_linha"] = LINHA_DE[(r["_plat"], r["_estr"], r["_camp"])]
    sem_data = sum(1 for t in ("google", "google2", "cremacaoMeta", "cremacaoYT") for r in raw.get(t, []) if not dia_de(r))
    if sem_data:
        avisos.append(f"{sem_data} linhas sem data descartadas.")
    avisos.append("Investimento = coluna Investimento da base (já distribuída pelo contratado); sem trava nem ajuste.")
    avisos.append("Alcance fora do relatório: a fonte não traz alcance único.")

    dias = sorted(r["_dia"] for r in rows)
    inicio, fim = dias[0], dias[-1]

    # ---------------------------------------------------------------- totais e canais
    tot = metricas()
    por_canal = defaultdict(metricas)
    canal_dias = defaultdict(list)
    for r in rows:
        soma(tot, r)
        soma(por_canal[r["_plat"]], r)
        canal_dias[r["_plat"]] += [r["_dia"], r.get("_diaFim", r["_dia"])]

    def nomes(campo, plat):
        return " · ".join(dict.fromkeys(l[campo] for l in LINHAS if l["plataforma"] == plat and any(r["_linha"] == l["id"] for r in rows)))

    canais = [fecha(por_canal[c["plataforma"]], {**c, "estrategia": nomes("estrategia", c["plataforma"]), "campanha": nomes("campanha", c["plataforma"]),
                                                 "inicio": min(canal_dias[c["plataforma"]]), "fim": max(canal_dias[c["plataforma"]])})
              for c in PLATAFORMAS if c["plataforma"] in por_canal]

    # ---------------------------------------------------------------- meses
    meses_map = defaultdict(lambda: defaultdict(metricas))
    linhas_mes = defaultdict(lambda: defaultdict(metricas))
    for r in rows:
        soma(meses_map[r["_mes"]][r["_plat"]], r)
        soma(linhas_mes[r["_mes"]][r["_linha"]], r)
    meses = []
    for mes in sorted(meses_map):
        m_idx = int(mes[5:7]) - 1
        # Parcial: mês cortado antes do fim (último dia do relatório < 28).
        item = {"mes": mes, "rotulo": MESES[m_idx], "nome": MESES_LONGOS[m_idx],
                "parcial": mes == fim[:7] and fim[8:] < "28"}
        total_mes = metricas()
        for c in PLATAFORMAS:
            m = meses_map[mes].get(c["plataforma"], metricas())
            item[c["plataforma"].lower()] = fecha(m)
            soma(total_mes, m)
        item["total"] = fecha(total_mes)
        # Linhas do mosaico (plataforma · estratégia · campanha) que rodaram no mês.
        item["estrategiasAtivas"] = sum(1 for l in LINHAS if linhas_mes[mes].get(l["id"], metricas())["impressoes"] > 0)
        meses.append(item)

    # ---------------------------------------------------------------- grade canal × mês (o ano em mosaico)
    gm = defaultdict(metricas)
    gm_camp = defaultdict(set)
    for r in rows:
        k = (r["_linha"], r["_mes"])
        soma(gm[k], r)
        gm_camp[k].add(r["_nomeCampanha"])
    linha = {l["id"]: l for l in LINHAS}
    ordem_linha = {l["id"]: i for i, l in enumerate(LINHAS)}
    usadas = {r["_linha"] for r in rows}
    grade = {
        "meses": sorted(meses_map),
        "linhas": [{k: l[k] for k in ("id", "plataforma", "estrategia", "rotulo", "campanha")} for l in LINHAS if l["id"] in usadas],
        "celulas": [fecha(m, {"linha": k[0], "plataforma": linha[k[0]]["plataforma"], "estrategia": linha[k[0]]["estrategia"],
                              "campanha": linha[k[0]]["campanha"], "mes": k[1],
                              "frentes": [linha[k[0]]["campanha"]], "campanhas": len(gm_camp[k])})
                    for k, m in sorted(gm.items(), key=lambda kv: (kv[0][1], ordem_linha[kv[0][0]]))],
    }

    # ---------------------------------------------------------------- campanhas e metas
    def periodo(rs):
        # Meta AON vem por mês: o período vai até o fim do mês (limitado ao corte).
        ds = [d for r in rs for d in (r["_dia"], r.get("_diaFim", r["_dia"]))]
        return {"inicio": min(ds), "fim": max(ds)} if ds else {"inicio": "", "fim": ""}

    aon_rows = [r for r in rows if r["_camp"] == AON]
    aon = metricas()
    for r in aon_rows:
        soma(aon, r)
    # Metas do AON (R$ 2.000 e 909 cliques/mês) = só Google Pesquisa. O Meta do AON não tem meta: só entrega.
    pesquisa_rows = [r for r in aon_rows if r["_plat"] == "Google"]
    aon_mes = defaultdict(metricas)
    for r in pesquisa_rows:
        soma(aon_mes[r["_mes"]], r)
    aon_dias_mes = defaultdict(set)
    for r in pesquisa_rows:
        aon_dias_mes[r["_mes"]].add(r["_dia"])
    metas_aon = []
    for mes in sorted(aon_mes):
        m = aon_mes[mes]
        info = next(x for x in meses if x["mes"] == mes)
        metas_aon.append(fecha(m, {
            "mes": mes, "rotulo": info["rotulo"], "nome": info["nome"], "parcial": info["parcial"],
            "inicio": min(aon_dias_mes[mes]), "fim": max(aon_dias_mes[mes]),
            "metaInvestimento": META_AON_MES["investimento"], "metaCliques": META_AON_MES["cliques"],
            "pctInvestimento": round(m["investimento"] / META_AON_MES["investimento"], 4),
            "pctCliques": round(m["cliques"] / META_AON_MES["cliques"], 4),
        }))
    fechados = [x for x in metas_aon if not x["parcial"]]
    aon_por_canal = {}
    for plat in ("Google", "Meta"):
        rs = [r for r in aon_rows if r["_plat"] == plat]
        if not rs:
            continue
        m = metricas()
        for r in rs:
            soma(m, r)
        aon_por_canal[plat] = fecha(m, periodo(rs))
    estrategias_meta = []
    for estr in ESTRATEGIAS_META_AON:
        rs = [r for r in aon_rows if r["_plat"] == "Meta" and r["_estr"] == estr]
        if not rs:
            continue
        m = metricas()
        for r in rs:
            soma(m, r)
        estrategias_meta.append(fecha(m, {"plataforma": "Meta", "estrategia": estr, **periodo(rs)}))
    campanha_aon = fecha(aon, {
        "campanha": AON, **periodo(aon_rows),
        "canais": list(aon_por_canal),
        "porCanal": aon_por_canal,
        "estrategiasMeta": estrategias_meta,
        "metaMensal": META_AON_MES,
        "metas": metas_aon,
        "mesesNaMeta": sum(1 for x in fechados if x["cliques"] >= x["metaCliques"]),
        "mesesFechados": len(fechados),
    })

    cre_rows = [r for r in rows if r["_camp"] == CREMACAO]
    cre = metricas()
    for r in cre_rows:
        soma(cre, r)
    metas_cre = []
    for plat, mt in META_CREMACAO.items():
        rs = [r for r in cre_rows if r["_plat"] == plat]
        m = metricas()
        for r in rs:
            soma(m, r)
        metas_cre.append(fecha(m, {
            "plataforma": plat, **periodo(rs),
            "metaInvestimento": mt["investimento"], "metrica": mt["metrica"], "meta": mt["meta"],
            "pctInvestimento": round(m["investimento"] / mt["investimento"], 4),
            "pctMeta": round(m[mt["metrica"]] / mt["meta"], 4),
        }))
    campanha_cre = fecha(cre, {
        "campanha": CREMACAO, **periodo(cre_rows),
        "contratado": PERIODO_CREMACAO,
        "canais": ["Meta", "YouTube"],
        "metas": metas_cre,
    })

    # ---------------------------------------------------------------- busca (Google Pesquisa)
    busca = metricas()
    anuncios = defaultdict(metricas)
    for r in pesquisa_rows:
        soma(busca, r)
        if r["_criativo"].strip():
            soma(anuncios[r["_criativo"]], r)
    sem_nome = sum(1 for r in pesquisa_rows if not r["_criativo"].strip())
    if sem_nome:
        avisos.append(f"Busca: {sem_nome} linhas sem nome de anúncio (contam no total, fora da lista de anúncios).")
    cliques_pesquisa = sum(r["cliques"] for r in pesquisa_rows)
    busca_out = fecha(busca, {
        "anuncios": [
            fecha(m, {"titulos": [t.strip() for t in nome.split("|") if t.strip()][:4], "frente": AON})
            for nome, m in sorted(anuncios.items(), key=lambda kv: -kv[1]["cliques"])[:6]
        ],
        "palavrasChave": palavras_chave(raw.get("googlekeywords", []), de, ate, cliques_pesquisa),
    })

    # ---------------------------------------------------------------- público (Meta: idade × gênero)
    ig = defaultdict(lambda: {"impressoes": 0.0, "cliques": 0.0, "investimento": 0.0})

    def chave_publico(idade, gen):
        idade = (idade or "").strip()
        gen = (gen or "").strip().lower()
        return (idade if idade in FAIXAS else "desconhecida", gen if gen in ("female", "male") else "unknown")

    for r in rows:
        if r["_tabela"] != "cremacaoMeta":
            continue
        x = ig[chave_publico(r["_raw"].get("age"), r["_raw"].get("gender"))]
        x["impressoes"] += r["impressoes"]
        x["cliques"] += r["cliques"]
        x["investimento"] += r["investimento"]
    # Meta AON: idade × gênero do período inteiro (sem data por linha).
    for p in meta_aon.get("publicoIdadeGenero", []):
        x = ig[chave_publico(p.get("idade"), p.get("genero"))]
        x["impressoes"] += num(p.get("impressoes"))
        x["cliques"] += num(p.get("cliques"))
        x["investimento"] += num(p.get("investimento"))
    publico_meta = [{"idade": k[0], "genero": k[1], **{m: round(v, 2) for m, v in x.items()}} for k, x in sorted(ig.items())]

    # ---------------------------------------------------------------- vídeo
    meta_rows = [r for r in rows if r["_tabela"] == "cremacaoMeta"]  # vídeo da Cremação
    vm = {"views": round(sum(r["views"] for r in meta_rows)),
          "reproducoes": round(sum(num(r["_raw"].get("video_play_actions_video_view")) for r in meta_rows)),
          "thruplays": round(sum(num(r["_raw"].get("video_thruplay_watched_actions_video_view")) for r in meta_rows))}
    yt_rows = [r for r in rows if r["_plat"] == "YouTube"]
    vy = {"impressoes": 0.0, "views": 0.0, "investimento": 0.0, "p25": 0.0, "p50": 0.0, "p75": 0.0, "p100": 0.0}
    for r in yt_rows:
        imp = r["impressoes"]
        vy["impressoes"] += imp
        vy["views"] += r["views"]
        vy["investimento"] += r["investimento"]
        for q, c in (("p25", "video_quartile25_rate"), ("p50", "video_quartile50_rate"), ("p75", "video_quartile75_rate"), ("p100", "video_quartile100_rate")):
            v = num(r["_raw"].get(c))
            vy[q] += v * imp if v <= 1 else v  # taxa (0–1) por dia
    video = {"meta": vm,
             "youtube": {k: round(v, 2) if k == "investimento" else round(v) for k, v in vy.items()},
             "notaYoutube": "Quartis do YouTube = taxa diária × impressões (estimativa da contagem)."}

    # ---------------------------------------------------------------- criativos (Meta + YouTube)
    cr = defaultdict(metricas)
    cr_info = {}
    for r in rows:
        if r["_plat"] == "Google" or r["_tabela"] == "metaAon":
            continue  # anúncios de texto ficam na seção de busca; o Meta AON traz os criativos à parte
        raw_r = r["_raw"]
        nome = (raw_r.get("video_title") or r["_criativo"]) if r["_plat"] == "YouTube" else r["_criativo"]
        k = (r["_plat"], nome)
        soma(cr[k], r)
        prev = cr_info.get(k, {})
        if r["_plat"] == "YouTube":
            link = raw_r.get("URL Video") or ""
            vid = link.split("v=")[1].split("&")[0] if "v=" in link else ""
            thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg" if vid else ""
            formato = "video"
        else:
            link = raw_r.get("instagram_permalink_url") or ""
            thumb = raw_r.get("thumbnail_url") or ""
            formato = "video" if ("VIDEO" in nome.upper() or num(raw_r.get("actions_video_view")) > 0 or prev.get("formato") == "video") else "imagem"
        # Fica a miniatura mais recente (URLs antigas do fbcdn expiram antes).
        cr_info[k] = {"frente": CREMACAO, "estrategia": r["_estr"], "formato": formato,
                      "imagemOrigem": thumb or prev.get("imagemOrigem", ""), "link": link or prev.get("link", "")}
    ordem = [k for k, _ in sorted(cr.items(), key=lambda kv: (kv[0][0] != "Meta", -kv[1]["impressoes"]))]
    criativos = []
    for i, (p, nome) in enumerate(ordem, 1):
        info = cr_info[(p, nome)]
        rotulo = nome.replace("[DARKPOST]", "").replace("[VIDEO]", "").strip(" -") or ("Vídeo" if info["formato"] == "video" else "Imagem")
        criativos.append(fecha(cr[(p, nome)], {"id": f"{p.lower()}-{i:02d}", "nome": rotulo, "nomeOrigem": nome, "plataforma": p,
                                               **info, "imagem": info["imagemOrigem"]}))

    # Meta AON: peças já agrupadas na extração. A imagem fica só na cópia local (fbcdn expira).
    pasta = os.path.join(os.path.dirname(os.path.abspath(dst)), "..", "..", "public", "criativos")
    criativos_aon = []
    for c in meta_aon.get("criativos", []):
        m = metricas()
        for k in ("investimento", "impressoes", "cliques", "cliquesLink"):
            m[k] = num(c.get(k))
        criativos_aon.append((c.get("imagemOrigem") or "", fecha(m, {
            "id": c["id"], "nome": c.get("titulo") or "Imagem", "nomeOrigem": c.get("titulo") or "", "plataforma": "Meta",
            "frente": AON, "estrategia": "", "formato": "imagem", "imagemOrigem": "", "link": c.get("link") or "", "imagem": ""})))
    if baixar_imagens:
        os.makedirs(pasta, exist_ok=True)
    for origem, c in criativos_aon:
        destino = os.path.join(pasta, f"{c['id']}.jpg")
        if baixar_imagens and origem:
            try:
                req = urllib.request.Request(origem, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    dados = resp.read()
                with open(destino, "wb") as fh:
                    fh.write(dados)
            except Exception as e:
                avisos.append(f"Miniatura não baixada: {c['nome']} ({e.__class__.__name__}).")
        if os.path.exists(destino):
            c["imagem"] = f"/criativos/{c['id']}.jpg"
        else:
            avisos.append(f"Sem cópia local da miniatura: {c['nome']} (rode com --imagens).")

    if baixar_imagens:
        os.makedirs(pasta, exist_ok=True)
        for c in criativos:
            destino = os.path.join(pasta, f"{c['id']}.jpg")
            try:
                req = urllib.request.Request(c["imagemOrigem"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as resp, open(destino, "wb") as fh:
                    fh.write(resp.read())
                c["imagem"] = f"/criativos/{c['id']}.jpg"
            except Exception as e:
                if os.path.exists(destino):
                    c["imagem"] = f"/criativos/{c['id']}.jpg"
                    avisos.append(f"Miniatura não baixada, mantida a cópia local: {c['nome']} ({e.__class__.__name__}).")
                else:
                    avisos.append(f"Miniatura não baixada: {c['nome']} ({e.__class__.__name__}).")

    # Grade: Meta (AON + Cremação) por impressões, depois YouTube.
    criativos = sorted(criativos + [c for _, c in criativos_aon], key=lambda c: (c["plataforma"] != "Meta", -c["impressoes"]))

    snapshot = {
        "cliente": "Cemitério Campo Santo",
        "periodo": {"inicio": inicio, "fim": fim},
        "atualizadoEm": atualizado_em(raw, meta_aon_src),
        "totais": fecha(tot, {"meses": len(meses), "campanhas": 2}),
        "plataformas": canais,
        "meses": meses,
        "campanhas": [campanha_aon, campanha_cre],
        "grade": grade,
        "busca": busca_out,
        "publico": {"meta": publico_meta},
        "video": video,
        "criativos": criativos,
        "avisos": avisos,
    }
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as fh:
        json.dump(snapshot, fh, ensure_ascii=False, indent=1)

    # ---------------------------------------------------------------- conferência no terminal
    br = lambda v, d=0: f"{v:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    print("\nconferência · AON por mês (investimento · cliques · impressões · conversões)")
    for x in metas_aon:
        marca = f"  parcial ({x['inicio'][8:]}/{x['inicio'][5:7]} → {x['fim'][8:]}/{x['fim'][5:7]})" if x["parcial"] else ""
        print(f"  {x['rotulo']}  R$ {br(x['investimento'], 2):>9} · {br(x['cliques']):>6} · {br(x['impressoes']):>7} · {br(x['conversoes']):>3}{marca}")
    jo = [x for x in metas_aon if x["mes"] <= "2026-10"]
    print(f"  jan–out  R$ {br(sum(x['investimento'] for x in jo), 2)} · {br(sum(x['cliques'] for x in jo))} cliques · "
          f"{br(sum(x['impressoes'] for x in jo))} impr. · {br(sum(aon_mes[x['mes']]['conversoes'] for x in jo))} conv.")
    for x in metas_cre:
        print(f"  Cremação {x['plataforma']:7} R$ {br(x['investimento'], 2)} · {br(x['impressoes'])} impr. · {br(x['cliques'])} cliques · "
              f"{br(x['views'])} views · {x['pctMeta'] * 100:.0f}% da meta de {x['metrica']}  ({x['inicio']} → {x['fim']})")
    if meta_aon:
        ma = aon_por_canal.get("Meta", fecha(metricas()))
        print(f"\nconferência · Meta AON: R$ {br(ma['investimento'], 2)} | {br(ma['impressoes'])} impressões | {br(ma['cliquesLink'])} cliques no link"
              f" ({br(ma['cliques'])} cliques)")
        ma_mes = defaultdict(float)
        for r in rows:
            if r["_tabela"] == "metaAon":
                ma_mes[r["_mes"]] += r["investimento"]
        print("  por mês (R$): " + " · ".join(f"{MESES[int(k[5:7]) - 1]} {br(v, 2)}" for k, v in sorted(ma_mes.items())))
        for e in estrategias_meta:
            principal = f"{br(e['cliquesLink'])} cliques no link" if e["estrategia"] == "Tráfego" else f"{br(e['impressoes'])} impressões"
            print(f"  {e['estrategia']:22} R$ {br(e['investimento'], 2):>9} · {principal}")
        ref = meta_aon.get("totais", {})
        for k in ("investimento", "impressoes", "cliquesLink"):
            if k in ref and abs(num(ref[k]) - ma[k]) > 0.01:
                print(f"  ATENÇÃO: {k} {ma[k]} ≠ totais do arquivo {ref[k]}")
        g = aon_por_canal.get("Google", fecha(metricas()))
        print(f"  Institucional AON: R$ {br(campanha_aon['investimento'], 2)} (Google R$ {br(g['investimento'], 2)} + Meta R$ {br(ma['investimento'], 2)})")
        print(f"  total do relatório: R$ {br(tot['investimento'] - ma['investimento'], 2)} + R$ {br(ma['investimento'], 2)} = R$ {br(tot['investimento'], 2)}")
        print(f"  criativos Meta AON: {len(criativos_aon)} · {sum(1 for _, c in criativos_aon if c['imagem'])} com imagem local")
    t = snapshot["totais"]
    print(f"\nok → {dst}  ·  {inicio} → {fim}  ·  R$ {br(t['investimento'], 2)}  ·  {br(t['impressoes'])} impressões  ·  {len(criativos)} criativos")


def _arg(argv, nome):
    if nome not in argv:
        return None
    i = argv.index(nome)
    if i + 1 >= len(argv):
        sys.exit(f"{nome} precisa de uma data AAAA-MM-DD")
    v = argv[i + 1]
    try:
        datetime.strptime(v, "%Y-%m-%d")
    except ValueError:
        sys.exit(f"{nome}: data inválida {v!r} (use AAAA-MM-DD)")
    del argv[i:i + 2]
    return v


def _arg_arquivo(argv, nome):
    if nome not in argv:
        return None
    i = argv.index(nome)
    if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
        sys.exit(f"{nome} precisa de um arquivo")
    v = argv[i + 1]
    if not os.path.isfile(v):
        sys.exit(f"{nome}: arquivo não encontrado {v!r}")
    del argv[i:i + 2]
    return v


if __name__ == "__main__":
    argv = sys.argv[1:]
    meta_aon_src = _arg_arquivo(argv, "--meta-aon")
    de = _arg(argv, "--de") or "2026-01-01"
    ate = _arg(argv, "--ate") or "2026-11-15"
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 2:
        sys.exit("uso: build-snapshot.py <camposanto-dados.json> <src/data/snapshot.json> [--de AAAA-MM-DD] [--ate AAAA-MM-DD] [--meta-aon <arquivo>] [--imagens]")
    main(args[0], args[1], "--imagens" in argv, de, ate, meta_aon_src)
