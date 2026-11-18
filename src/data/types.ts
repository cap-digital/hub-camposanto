/** Tipos de src/data/snapshot.json (gerado por scripts/build-snapshot.py). Sem alcance: a fonte não tem alcance único. */

/** Métricas agregadas. `investimento` = coluna Investimento da base (sem ajuste); `ctr` em fração. */
export interface Metricas {
  investimento: number;
  impressoes: number;
  cliques: number;
  /** YouTube = views TrueView; Meta = visualizações de vídeo (3 s). */
  views: number;
  /** Só Google Pesquisa (Institucional AON). Pode ser fracionária na fonte; aqui arredondada. */
  conversoes: number;
  ctr: number;
  cpm: number;
  cpc: number;
  cpv: number;
}

export interface Periodo {
  inicio: string;
  fim: string;
}

export interface Totais extends Metricas {
  meses: number;
  campanhas: number;
}

export type PlataformaId = "Google" | "Meta" | "YouTube";

/** Canal = plataforma · estratégia (Google Pesquisa, Meta Alcance, YouTube Visualização). */
export interface Plataforma extends Metricas, Periodo {
  plataforma: PlataformaId;
  estrategia: string;
  /** "Pesquisa", "Meta Alcance", "YouTube" */
  rotulo: string;
  campanha: string;
}

export interface Mes {
  /** "2026-01" */
  mes: string;
  /** "jan" */
  rotulo: string;
  /** "janeiro" */
  nome: string;
  /** Mês cortado antes do fim (último dia do relatório < 28): novembro, até 15/11. */
  parcial: boolean;
  /** Quantos canais rodaram no mês. */
  estrategiasAtivas: number;
  google: Metricas;
  meta: Metricas;
  youtube: Metricas;
  total: Metricas;
}

export interface LinhaGrade {
  plataforma: PlataformaId;
  estrategia: string;
  rotulo: string;
}

/** Uma célula da grade canal × mês (só existe quando o canal rodou no mês). */
export interface CelulaGrade extends Metricas {
  plataforma: PlataformaId;
  estrategia: string;
  /** "2026-01" */
  mes: string;
  /** Campanha do relatório (Institucional AON ou Cremação). */
  frentes: string[];
  /** Nº de campanhas (PIs) da plataforma na célula. */
  campanhas: number;
}

export interface Grade {
  meses: string[];
  linhas: LinhaGrade[];
  celulas: CelulaGrade[];
}

/** Meta mensal do Institucional AON (R$ 2.000 e 909 cliques por mês). */
export interface MetaMesAon extends Metricas, Periodo {
  mes: string;
  rotulo: string;
  nome: string;
  parcial: boolean;
  metaInvestimento: number;
  metaCliques: number;
  pctInvestimento: number;
  pctCliques: number;
}

export interface CampanhaAon extends Metricas, Periodo {
  campanha: "Institucional AON";
  canais: PlataformaId[];
  metaMensal: { investimento: number; cliques: number };
  metas: MetaMesAon[];
  /** Meses fechados com cliques ≥ meta. */
  mesesNaMeta: number;
  mesesFechados: number;
}

export interface MetaCanalCremacao extends Metricas, Periodo {
  plataforma: PlataformaId;
  metaInvestimento: number;
  /** Métrica principal do canal: Meta = impressões, YouTube = views. */
  metrica: "impressoes" | "views";
  meta: number;
  pctInvestimento: number;
  pctMeta: number;
}

export interface CampanhaCremacao extends Metricas, Periodo {
  campanha: "Cremação";
  /** Período contratado (04/10 → 13/11); `inicio`/`fim` são os dias com dados. */
  contratado: Periodo;
  canais: PlataformaId[];
  metas: MetaCanalCremacao[];
}

export interface AnuncioBusca extends Metricas {
  titulos: string[];
  frente: string;
}

export interface PalavraChave {
  termo: string;
  impressoes: number;
  cliques: number;
  conversoes: number;
  ctr: number;
}

export interface TotaisPalavrasChave {
  termos: number;
  cliques: number;
  impressoes: number;
  conversoes: number;
  cliquesPesquisa: number;
  completa: boolean;
}

export interface PalavrasChave {
  porFrente: Record<string, PalavraChave[]>;
  totais: Record<string, TotaisPalavrasChave>;
}

export interface Busca extends Metricas {
  anuncios: AnuncioBusca[];
  palavrasChave: PalavrasChave;
}

export interface PublicoMeta {
  idade: string;
  genero: string;
  impressoes: number;
  cliques: number;
  investimento: number;
}

export interface Video {
  meta: { views: number; reproducoes: number; thruplays: number };
  /** Quartis estimados (taxa × impressões): mostrar só em %. */
  youtube: { views: number; impressoes: number; investimento: number; p25: number; p50: number; p75: number; p100: number };
  notaYoutube: string;
}

export interface Criativo extends Metricas {
  id: string;
  nome: string;
  nomeOrigem: string;
  plataforma: PlataformaId;
  frente: string;
  estrategia: string;
  formato: string;
  imagemOrigem: string;
  link: string;
  imagem: string;
}

export interface Snapshot {
  cliente: string;
  periodo: Periodo;
  atualizadoEm: string;
  totais: Totais;
  plataformas: Plataforma[];
  meses: Mes[];
  campanhas: [CampanhaAon, CampanhaCremacao];
  grade: Grade;
  busca: Busca;
  publico: { meta: PublicoMeta[] };
  video: Video;
  criativos: Criativo[];
  avisos: string[];
}
