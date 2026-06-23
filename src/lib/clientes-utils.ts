import { addMonths, parseISO } from "date-fns";

import type {
  Agreement,
  AgreementInstallment,
  AgreementInstallmentDraft,
  AgreementInstallmentStatus,
  AgreementInstallmentType,
  AgreementStatus,
  ClientStatus,
  CreateAgreementInput,
  RevenueType,
  RevenueTypeOrigin,
} from "@/types/portal";

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

export function normalizeDocument(value: string | null | undefined) {
  return onlyDigits(value ?? "");
}

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function roundCurrency(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function formatDocument(value: string | null | undefined) {
  const digits = normalizeDocument(value);

  if (digits.length === 11) {
    return digits.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4",
    );
  }

  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }

  return value ?? "";
}

export function formatPhone(value: string | null | undefined) {
  const digits = normalizeDocument(value);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value ?? "";
}

export function getClientStatusLabel(status: ClientStatus | string) {
  const labels: Record<string, string> = {
    em_cobranca: "Em cobranca",
    com_acordo: "Com acordo",
    quitado: "Quitado",
    inativo: "Inativo",
  };

  return labels[status] ?? status;
}

export function getAgreementStatusLabel(status: AgreementStatus | string) {
  const labels: Record<string, string> = {
    ativo: "Ativo",
    aguardando_pagamento: "Aguardando pagamento",
    parcial: "Parcial",
    quitado: "Quitado",
    atrasado: "Atrasado",
    cancelado: "Cancelado",
    quebrado: "Quebrado",
    andamento: "Em andamento",
    formalizado: "Formalizado",
  };

  return labels[status] ?? status;
}

export function getInstallmentStatusLabel(
  status: AgreementInstallmentStatus | string,
) {
  const labels: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    atrasado: "Atrasado",
    cancelado: "Cancelado",
  };

  return labels[status] ?? status;
}

export function getClientStatusVariant(status: ClientStatus | string) {
  switch (status) {
    case "quitado":
      return "success";
    case "com_acordo":
      return "info";
    case "inativo":
      return "secondary";
    default:
      return "warning";
  }
}

export function getAgreementStatusVariant(status: AgreementStatus | string) {
  switch (status) {
    case "quitado":
      return "success";
    case "parcial":
      return "info";
    case "cancelado":
    case "quebrado":
      return "destructive";
    case "atrasado":
      return "warning";
    case "aguardando_pagamento":
      return "secondary";
    default:
      return "default";
  }
}

export function getInstallmentStatusVariant(
  status: AgreementInstallmentStatus | string,
) {
  switch (status) {
    case "pago":
      return "success";
    case "cancelado":
      return "destructive";
    case "atrasado":
      return "warning";
    default:
      return "secondary";
  }
}

export function deriveInstallmentStatus(
  installment: Pick<
    AgreementInstallment,
    "status" | "valor_pago" | "valor_parcela" | "data_vencimento"
  >,
) {
  if (installment.status === "cancelado") {
    return "cancelado" satisfies AgreementInstallmentStatus;
  }

  if (roundCurrency(installment.valor_pago) >= roundCurrency(installment.valor_parcela)) {
    return "pago" satisfies AgreementInstallmentStatus;
  }

  if (installment.data_vencimento < new Date().toISOString().slice(0, 10)) {
    return "atrasado" satisfies AgreementInstallmentStatus;
  }

  return "pendente" satisfies AgreementInstallmentStatus;
}

export function deriveAgreementStatus(
  agreement: Pick<Agreement, "status">,
  installments: AgreementInstallment[],
) {
  if (agreement.status === "cancelado" || agreement.status === "quebrado") {
    return agreement.status;
  }

  if (!installments.length) {
    return agreement.status || "ativo";
  }

  const normalized = installments.map((item) => deriveInstallmentStatus(item));
  const paidCount = normalized.filter((item) => item === "pago").length;
  const overdueCount = normalized.filter((item) => item === "atrasado").length;

  if (paidCount === installments.length) {
    return "quitado" satisfies AgreementStatus;
  }

  if (overdueCount > 0) {
    return "atrasado" satisfies AgreementStatus;
  }

  if (paidCount > 0) {
    return "parcial" satisfies AgreementStatus;
  }

  if (agreement.status === "aguardando_pagamento") {
    return "aguardando_pagamento" satisfies AgreementStatus;
  }

  return "ativo" satisfies AgreementStatus;
}

export function generateAgreementInstallments(
  input: Pick<
    CreateAgreementInput,
    | "valorAcordo"
    | "valorEntrada"
    | "quantidadeParcelas"
    | "valorParcela"
    | "dataVencimentoEntrada"
    | "primeiroVencimento"
    | "intervaloMeses"
    | "parcelasCustomizadas"
  >,
) {
  const drafts: AgreementInstallmentDraft[] = [];
  const entry = roundCurrency(input.valorEntrada);
  const total = roundCurrency(input.valorAcordo);
  const balance = roundCurrency(total - entry);
  const quantity = Math.max(1, Math.trunc(input.quantidadeParcelas || 1));
  const intervalMonths = Math.max(1, Math.trunc(input.intervaloMeses || 1));

  if (entry > 0 && input.dataVencimentoEntrada) {
    drafts.push({
      numeroParcela: 1,
      tipo: balance === 0 && quantity === 1 ? "avista" : "entrada",
      dataVencimento: input.dataVencimentoEntrada,
      valorParcela: entry,
      tipoReceita: "NOVO",
      tipoReceitaOrigem: "automatico",
    });
  }

  if (balance <= 0 || !input.primeiroVencimento) {
    return drafts;
  }

  const customInstallments =
    input.parcelasCustomizadas?.filter(
      (installment) =>
        installment?.dataVencimento &&
        Number.isFinite(installment.valorParcela) &&
        installment.valorParcela > 0,
    ) ?? [];

  if (customInstallments.length) {
    return [
      ...drafts,
      ...customInstallments.map((installment, index) => {
        const generatedType =
          quantity === 1 && entry === 0 && index === 0
            ? "avista"
            : (installment.tipo ?? "parcela");

        return {
          numeroParcela: drafts.length + index + 1,
          tipo: generatedType,
          dataVencimento: installment.dataVencimento,
          valorParcela: roundCurrency(installment.valorParcela),
          observacao: installment.observacao ?? null,
          operadorId: installment.operadorId ?? null,
          tipoReceita: installment.tipoReceita ?? (index === 0 ? "NOVO" : "COLCHAO"),
          tipoReceitaOrigem:
            installment.tipoReceitaOrigem ??
            (installment.tipoReceita ? "manual" : "automatico"),
        } satisfies AgreementInstallmentDraft;
      }),
    ];
  }

  const base = roundCurrency(
    input.valorParcela && input.valorParcela > 0
      ? input.valorParcela
      : balance / quantity,
  );

  const firstDate = parseISO(input.primeiroVencimento);

  for (let index = 0; index < quantity; index += 1) {
    const generatedValue =
      index === quantity - 1
        ? roundCurrency(balance - base * (quantity - 1))
        : base;

    drafts.push({
      numeroParcela: drafts.length + 1,
      tipo: quantity === 1 && entry === 0 ? "avista" : "parcela",
      dataVencimento: addMonths(firstDate, index * intervalMonths).toISOString().slice(0, 10),
      valorParcela: generatedValue,
      tipoReceita:
        quantity === 1 && entry === 0
          ? "NOVO"
          : index === 0
            ? "NOVO"
            : "COLCHAO",
      tipoReceitaOrigem: "automatico",
    });
  }

  return drafts;
}

export function getPrimaryWalletLabel(
  walletName: string | null | undefined,
  creditorName: string | null | undefined,
) {
  if (!walletName && !creditorName) {
    return "-";
  }

  if (!walletName) {
    return creditorName ?? "-";
  }

  if (!creditorName) {
    return walletName;
  }

  return `${walletName} - ${creditorName}`;
}

export function matchesClientSearch(
  search: string,
  payload: {
    name: string;
    document: string;
    contractNumbers: string[];
  },
) {
  const normalizedSearch = normalizeText(search);
  const normalizedDocument = normalizeDocument(search);

  if (!normalizedSearch && !normalizedDocument) {
    return true;
  }

  const byName = normalizeText(payload.name).includes(normalizedSearch);
  const byDocument = Boolean(
    normalizedDocument &&
      normalizeDocument(payload.document).includes(normalizedDocument),
  );
  const byContract = payload.contractNumbers.some((item) =>
    normalizeText(item).includes(normalizedSearch),
  );

  return byName || byDocument || byContract;
}

export function resolveAgreementTypeLabel(type: AgreementInstallmentType | string) {
  const labels: Record<string, string> = {
    entrada: "Entrada",
    parcela: "Parcela",
    avista: "A vista",
  };

  return labels[type] ?? type;
}

export function getRevenueTypeLabel(type: RevenueType | string | null | undefined) {
  if (!type) {
    return "-";
  }

  return type === "NOVO" ? "Novo" : type === "COLCHAO" ? "Colchao" : type;
}

export function getRevenueTypeOriginLabel(
  origin: RevenueTypeOrigin | string | null | undefined,
) {
  if (!origin) {
    return "-";
  }

  return origin === "automatico"
    ? "Automatico"
    : origin === "manual"
      ? "Manual"
      : origin;
}
