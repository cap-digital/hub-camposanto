import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  /** Mostra a linha "Cemitério e Crematório · Santa Casa da Bahia" abaixo do nome. */
  withCargo?: boolean;
}

/** Assinatura tipográfica do Campo Santo: nome em display + ponto cobre. Tamanho via font-size do pai. */
export function LogoCampoSanto({ className, withCargo = false }: LogoProps) {
  return (
    <span className={cn("inline-flex select-none flex-col leading-none", className)}>
      <span className="display whitespace-nowrap text-[1.05em] font-medium tracking-[-0.02em] text-text">
        Campo Santo<span className="text-amber">.</span>
      </span>
      {withCargo && (
        <span className="mt-1.5 font-mono text-[0.42em] uppercase tracking-[0.2em] text-text-3">Cemitério e Crematório · Santa Casa da Bahia</span>
      )}
    </span>
  );
}
