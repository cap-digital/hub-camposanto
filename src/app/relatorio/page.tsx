import type { Metadata } from "next";
import Home from "../page";
import Midia from "../midia/page";
import Campanhas from "../campanhas/page";

export const metadata: Metadata = { title: "Relatório · Campo Santo" };

/** Início + Mídia + Campanhas numa página só; /api/pdf transforma esta página em PDF. */
export default function Relatorio() {
  return (
    <div className="relatorio">
      <Home />
      <div className="quebra-pagina">
        <Midia />
      </div>
      <div className="quebra-pagina">
        <Campanhas />
      </div>
    </div>
  );
}
