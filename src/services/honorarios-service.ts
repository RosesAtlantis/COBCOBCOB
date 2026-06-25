import "server-only";

import { roundCurrency } from "@/lib/clientes-utils";
import type {
  AgreementInstallmentDraft,
  AgreementInstallmentType,
  RevenueType,
  RevenueTypeOrigin,
  Wallet,
} from "@/types/portal";

interface CalcularHonorariosInput {
  valorBase: number;
  percentualHonorarios?: number | null;
  percentualEscritorio?: number | null;
  carteira?: Pick<
    Wallet,
    "percentual_honorarios_padrao" | "percentual_escritorio_padrao"
  > | null;
}

interface ClassificarTipoReceitaInput {
  numeroParcela: number;
  tipo?: AgreementInstallmentType | string | null;
  manualType?: RevenueType | string | null;
}

export interface HonorariosCalculation {
  percentualHonorarios: number;
  percentualEscritorio: number;
  valorHonorarios: number;
  valorEscritorio: number;
  valorRepassado: number;
}

export function calcularHonorarios(
  input: CalcularHonorariosInput,
): HonorariosCalculation {
  const percentualHonorarios = roundCurrency(
    input.percentualHonorarios ??
      input.carteira?.percentual_honorarios_padrao ??
      0,
  );
  const percentualEscritorio = roundCurrency(
    input.percentualEscritorio ??
      input.carteira?.percentual_escritorio_padrao ??
      percentualHonorarios,
  );
  const valorBase = roundCurrency(input.valorBase);
  const valorHonorarios = roundCurrency((valorBase * percentualHonorarios) / 100);
  const valorEscritorio = roundCurrency((valorBase * percentualEscritorio) / 100);

  return {
    percentualHonorarios,
    percentualEscritorio,
    valorHonorarios,
    valorEscritorio,
    valorRepassado: roundCurrency(Math.max(valorBase - valorEscritorio, 0)),
  };
}

export function classificarTipoReceita(
  input: ClassificarTipoReceitaInput,
): { tipoReceita: RevenueType; tipoReceitaOrigem: RevenueTypeOrigin } {
  const manualType = input.manualType?.toString().trim().toUpperCase();

  if (manualType === "NOVO" || manualType === "COLCHAO") {
    return {
      tipoReceita: manualType,
      tipoReceitaOrigem: "manual",
    };
  }

  if (
    input.tipo === "avista" ||
    input.tipo === "entrada" ||
    input.numeroParcela <= 1
  ) {
    return {
      tipoReceita: "NOVO",
      tipoReceitaOrigem: "automatico",
    };
  }

  return {
    tipoReceita: "COLCHAO",
    tipoReceitaOrigem: "automatico",
  };
}

export const calcularClassificacaoAutomaticaParcela = classificarTipoReceita;

export function classificarParcelas(
  drafts: AgreementInstallmentDraft[],
): AgreementInstallmentDraft[] {
  return drafts.map((draft, index) => {
    const classified = classificarTipoReceita({
      numeroParcela: index + 1,
      tipo: draft.tipo,
      manualType: draft.tipoReceita ?? null,
    });

    return {
      ...draft,
      numeroParcela: index + 1,
      tipoReceita: classified.tipoReceita,
      tipoReceitaOrigem: draft.tipoReceita ? "manual" : classified.tipoReceitaOrigem,
    };
  });
}
