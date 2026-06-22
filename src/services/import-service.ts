import { createHash } from "node:crypto";

import { format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

import { getCurrentProfile } from "@/lib/auth";
import { normalizeDocument, roundCurrency } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canImport } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type {
  ImportLineError,
  ImportProcessResult,
  ImportType,
  PortalProfile,
} from "@/types/portal";

type ParsedRow = Record<string, unknown>;
type AdminClient = SupabaseClient<Database>;

type ClientRow = Database["public"]["Tables"]["clientes"]["Row"];
type ContractRow = Database["public"]["Tables"]["contratos"]["Row"];
type AgreementRow = Database["public"]["Tables"]["acordos"]["Row"];
type InstallmentRow = Database["public"]["Tables"]["acordo_parcelas"]["Row"];
type WriteOffRow = Database["public"]["Tables"]["acordo_baixas"]["Row"];

type AgreementInsert = Database["public"]["Tables"]["acordos"]["Insert"];
type PaymentInsert = Database["public"]["Tables"]["pagamentos"]["Insert"];
type ClientInsert = Database["public"]["Tables"]["clientes"]["Insert"];
type ClientWalletInsert =
  Database["public"]["Tables"]["cliente_carteiras"]["Insert"];
type ContractInsert = Database["public"]["Tables"]["contratos"]["Insert"];
type InstallmentInsert =
  Database["public"]["Tables"]["acordo_parcelas"]["Insert"];
type WriteOffInsert = Database["public"]["Tables"]["acordo_baixas"]["Insert"];
type GoalInsert = Database["public"]["Tables"]["metas"]["Insert"];
type ActionInsert = Database["public"]["Tables"]["acionamentos"]["Insert"];

interface CobwareAgreementDraft {
  externalKey: string;
  clientExternalKey: string;
  contractExternalKey: string;
  customerName: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string;
  originalValue: number;
  agreementValue: number;
  paidValue: number;
  remainingValue: number;
  installmentCount: number;
  regularInstallmentValue: number;
  entryValue: number;
  agreementDate: string;
  entryDueDate: string | null;
  firstInstallmentDue: string | null;
  lastPaymentDate: string | null;
  paymentMethod: string | null;
  observation: string | null;
  status: string;
}

interface CobwareClientDraft {
  externalKey: string;
  customerName: string;
  cpfCnpj: string;
  status: string;
}

interface CobwareContractDraft {
  externalKey: string;
  clientExternalKey: string;
  customerName: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string;
  originalValue: number;
  openValue: number;
  contractDate: string;
  dueDate: string | null;
  status: string;
}

interface CobwareInstallmentDraft {
  externalKey: string;
  agreementExternalKey: string;
  sourceInstallmentNumber: number;
  installmentNumber: number;
  installmentType: "entrada" | "parcela" | "avista";
  dueDate: string;
  installmentValue: number;
  paidValue: number;
  paymentDate: string | null;
  status: "pendente" | "pago" | "atrasado";
  observation: string | null;
}

interface CobwareWriteOffDraft {
  externalKey: string;
  agreementExternalKey: string;
  installmentExternalKey: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string;
  paymentDate: string;
  paidValue: number;
  feeValue: number;
  paymentMethod: string | null;
  observation: string | null;
}

interface CobwarePaymentDraft {
  externalKey: string;
  writeOffExternalKey: string;
  agreementExternalKey: string;
  installmentExternalKey: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string;
  paymentDate: string;
  paidValue: number;
  feeValue: number;
}

interface CobwareAnalysis {
  clients: CobwareClientDraft[];
  contracts: CobwareContractDraft[];
  agreements: CobwareAgreementDraft[];
  installments: CobwareInstallmentDraft[];
  writeOffs: CobwareWriteOffDraft[];
  payments: CobwarePaymentDraft[];
  errors: ImportLineError[];
  validSourceRows: number;
}

interface CobwareSourceInstallment {
  line: number;
  sourceInstallmentNumber: number;
  dueDate: string;
  installmentValue: number;
  paidValue: number;
  paymentDate: string | null;
  feeValue: number;
  status: "pendente" | "pago" | "atrasado";
  observation: string | null;
}

interface CobwareAgreementAccumulator {
  clientExternalKey: string;
  contractExternalKey: string;
  customerName: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string;
  agreementValue: number;
  installmentCount: number;
  agreementDateCandidates: string[];
  sourceStatuses: string[];
  observation: string | null;
  paymentMethod: string | null;
  sourceInstallments: CobwareSourceInstallment[];
}

const requiredColumns: Record<ImportType, string[]> = {
  cobware: [
    "credor",
    "nome_cliente",
    "cpf_cnpj",
    "contratos_fatura",
    "parcela",
    "qtd_parc",
    "vlr_parcela",
    "valor_pago",
    "ho_pago",
    "vlr_acordo",
    "data_de_vencimento",
    "data_pagamento",
    "pago",
    "status_acordo",
    "tipo_de_ho",
  ],
  pagamentos: [
    "data_pagamento",
    "operador",
    "equipe",
    "carteira",
    "credor",
    "cpf_cnpj",
    "contrato",
    "valor_pago",
    "valor_honorario",
  ],
  acordos: [
    "data_acordo",
    "operador",
    "equipe",
    "carteira",
    "cpf_cnpj",
    "contrato",
    "valor_acordo",
    "valor_entrada",
    "quantidade_parcelas",
    "status",
  ],
  operadores: ["nome", "email", "equipe"],
  metas: ["mes", "ano", "operador", "equipe", "carteira", "valor_meta"],
  carteiras: ["nome", "credor"],
  acionamentos: [
    "data_acionamento",
    "operador",
    "equipe",
    "carteira",
    "contrato",
    "evento",
    "descricao",
    "canal",
  ],
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRow(row: ParsedRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]),
  );
}

function asString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\u00A0/g, " ").trim();
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return roundCurrency(value);
  }

  const raw = asString(value);

  if (!raw) {
    return Number.NaN;
  }

  const cleaned = raw.replace(/[^\d,.-]/g, "");

  if (!cleaned) {
    return Number.NaN;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? roundCurrency(parsed) : Number.NaN;
}

function parseInteger(value: unknown) {
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, "yyyy-MM-dd");
  }

  const raw = asString(value);

  if (!raw) {
    return "";
  }

  const normalized = raw.includes("/") ? raw.split("/").reverse().join("-") : raw;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return format(parsed, "yyyy-MM-dd");
}

function isTruthyYes(value: unknown) {
  const normalized = asString(value).toLowerCase();
  return normalized === "sim" || normalized === "s" || normalized === "yes";
}

function buildErrorReport(errors: ImportLineError[]) {
  const header = "linha,mensagem,conteudo";
  const rows = errors.map((error) => {
    const message = error.message.replaceAll('"', '""');
    const content = JSON.stringify(error.row).replaceAll('"', '""');
    return `${error.line},"${message}","${content}"`;
  });

  return [header, ...rows].join("\n");
}

function buildExternalKey(type: string, parts: unknown[]) {
  return createHash("sha1")
    .update(`${type}:${JSON.stringify(parts)}`)
    .digest("hex");
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildWalletCacheKey(creditorName: string, walletName: string) {
  return `${creditorName.toLowerCase()}::${walletName.toLowerCase()}`;
}

function buildContractLookupKey(clientId: string, contractNumber: string) {
  return `${clientId}::${contractNumber}`;
}

async function parseFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, {
    defval: "",
  });

  return rows.map(normalizeRow);
}

function validateColumns(type: ImportType, rows: ParsedRow[]) {
  if (!rows.length) {
    return {
      ok: false,
      message: "O arquivo nao possui linhas de dados.",
    };
  }

  const headers = new Set(Object.keys(rows[0]));
  const missingColumns = requiredColumns[type].filter((column) => !headers.has(column));

  if (missingColumns.length) {
    return {
      ok: false,
      message: `Colunas obrigatorias ausentes: ${missingColumns.join(", ")}.`,
    };
  }

  return { ok: true, message: null };
}

function buildCobwareWalletName(creditorName: string, hoType: string) {
  const normalizedHoType = hoType || "CONTRATUAL";
  return `CobWare ${creditorName} - ${normalizedHoType}`;
}

function pickEarliestDate(values: string[]) {
  const sorted = values.filter(Boolean).sort();
  return sorted[0] ?? "";
}

function pickLatestDate(values: Array<string | null | undefined>) {
  const sorted = values.filter(Boolean).sort();
  return sorted.at(-1) ?? null;
}

function pushImportError(
  errors: ImportLineError[],
  seenLines: Set<number>,
  line: number,
  message: string,
  row: ParsedRow,
) {
  if (seenLines.has(line)) {
    return;
  }

  seenLines.add(line);
  errors.push({
    line,
    message,
    row,
  });
}

function normalizeContractField(value: unknown) {
  return asString(value).replace(/\s+/g, " ");
}

function inferPaymentMethod(product: string, observation: string | null) {
  const text = `${product} ${observation ?? ""}`.toLowerCase();

  if (text.includes("pix")) {
    return "PIX";
  }

  if (text.includes("boleto")) {
    return "Boleto";
  }

  if (text.includes("cartao")) {
    return "Cartao";
  }

  if (text.includes("ted") || text.includes("transfer")) {
    return "Transferencia";
  }

  return null;
}

function extractPrincipalValue(observation: string | null, fallbackValue: number) {
  if (!observation) {
    return fallbackValue;
  }

  const match = observation.match(/principal:\s*R\$\s*([\d.,]+)/i);

  if (!match?.[1]) {
    return fallbackValue;
  }

  const parsed = parseNumber(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function resolveCobwareInstallmentStatus(payload: {
  dueDate: string;
  paidValue: number;
  paymentDate: string | null;
  markedAsPaid: boolean;
}) {
  if (payload.markedAsPaid || (payload.paidValue > 0 && payload.paymentDate)) {
    return "pago" satisfies CobwareInstallmentDraft["status"];
  }

  if (payload.dueDate < new Date().toISOString().slice(0, 10)) {
    return "atrasado" satisfies CobwareInstallmentDraft["status"];
  }

  return "pendente" satisfies CobwareInstallmentDraft["status"];
}

function resolveCobwareAgreementStatus(
  sourceStatuses: string[],
  installments: CobwareInstallmentDraft[],
) {
  if (!installments.length) {
    return "ativo";
  }

  const paidCount = installments.filter((item) => item.status === "pago").length;
  const overdueCount = installments.filter((item) => item.status === "atrasado").length;

  if (paidCount === installments.length) {
    return "quitado";
  }

  if (overdueCount > 0) {
    return "atrasado";
  }

  if (paidCount > 0) {
    return "parcial";
  }

  const normalizedStatus = sourceStatuses.map((status) => status.toLowerCase());

  if (normalizedStatus.some((status) => status.includes("quit"))) {
    return "quitado";
  }

  return "ativo";
}

function resolveCobwareContractStatus(agreementStatuses: string[], openValue: number) {
  if (
    agreementStatuses.some((status) =>
      ["ativo", "aguardando_pagamento", "parcial", "atrasado", "quebrado"].includes(status),
    )
  ) {
    return "em_acordo";
  }

  if (agreementStatuses.length && agreementStatuses.every((status) => status === "cancelado")) {
    return "cancelado";
  }

  if (roundCurrency(openValue) <= 0) {
    return "quitado";
  }

  return "aberto";
}

function resolveCobwareClientStatus(agreementStatuses: string[]) {
  if (
    agreementStatuses.some((status) =>
      ["ativo", "aguardando_pagamento", "parcial", "atrasado", "quebrado"].includes(status),
    )
  ) {
    return "com_acordo";
  }

  if (agreementStatuses.length && agreementStatuses.every((status) => status === "quitado")) {
    return "quitado";
  }

  return "em_cobranca";
}

function analyzeCobwareRows(rows: ParsedRow[]): CobwareAnalysis {
  const errors: ImportLineError[] = [];
  const seenErrorLines = new Set<number>();
  const agreementMap = new Map<string, CobwareAgreementAccumulator>();

  let validSourceRows = 0;

  rows.forEach((row, index) => {
    const line = index + 2;
    const creditorName = asString(row.credor);
    const customerName = asString(row.nome_cliente);
    const cpfCnpj = normalizeDocument(row.cpf_cnpj ? String(row.cpf_cnpj) : "");
    const contract = normalizeContractField(row.contratos_fatura);
    const agreementValue = parseNumber(row.vlr_acordo);
    const installmentCount = parseInteger(row.qtd_parc);
    const sourceInstallmentNumber = parseInteger(row.parcela);
    const installmentValue = parseNumber(row.vlr_parcela);
    const paidValue = parseNumber(row.valor_pago);
    const feeValue = Number.isFinite(parseNumber(row.ho_pago))
      ? parseNumber(row.ho_pago)
      : Number.isFinite(parseNumber(row.ho))
        ? parseNumber(row.ho)
        : 0;
    const dueDate = parseDate(row.data_de_vencimento);
    const paymentDate = parseDate(row.data_pagamento);
    const hoType = asString(row.tipo_de_ho) || "CONTRATUAL";
    const contractType = asString(row.tipo_do_contrato) || "ADMINISTRATIVO";
    const walletName = buildCobwareWalletName(creditorName, hoType);
    const observation = asString(row.observacao) || null;
    const product = asString(row.produto);
    const markedAsPaid = isTruthyYes(row.pago) || (Number.isFinite(paidValue) && paidValue > 0);

    if (!creditorName || !customerName || !cpfCnpj || !contract) {
      pushImportError(
        errors,
        seenErrorLines,
        line,
        "Credor, nome do cliente, CPF/CNPJ e contrato/fatura sao obrigatorios.",
        row,
      );
      return;
    }

    if (!Number.isFinite(agreementValue) || agreementValue <= 0) {
      pushImportError(
        errors,
        seenErrorLines,
        line,
        "VLR ACORDO invalido para consolidacao do acordo.",
        row,
      );
      return;
    }

    if (!Number.isFinite(installmentCount) || installmentCount <= 0) {
      pushImportError(
        errors,
        seenErrorLines,
        line,
        "QTD PARC invalida para consolidacao do acordo.",
        row,
      );
      return;
    }

    if (!Number.isFinite(sourceInstallmentNumber) || sourceInstallmentNumber < 0) {
      pushImportError(
        errors,
        seenErrorLines,
        line,
        "PARCELA invalida para consolidacao do acordo.",
        row,
      );
      return;
    }

    if (!Number.isFinite(installmentValue) || installmentValue <= 0 || !dueDate) {
      pushImportError(
        errors,
        seenErrorLines,
        line,
        "Parcela sem valor positivo ou com data de vencimento invalida.",
        row,
      );
      return;
    }

    validSourceRows += 1;

    const clientExternalKey = buildExternalKey("cobware-cliente", [cpfCnpj]);
    const contractExternalKey = buildExternalKey("cobware-contrato", [cpfCnpj, contract]);
    const agreementKey = buildExternalKey("cobware-acordo", [
      creditorName,
      customerName,
      cpfCnpj,
      contract,
      agreementValue.toFixed(2),
      installmentCount,
      hoType,
      contractType,
      observation ?? "",
    ]);

    const agreementEntry =
      agreementMap.get(agreementKey) ??
      {
        clientExternalKey,
        contractExternalKey,
        customerName,
        creditorName,
        walletName,
        contract,
        cpfCnpj,
        agreementValue,
        installmentCount,
        agreementDateCandidates: [],
        sourceStatuses: [],
        observation,
        paymentMethod: inferPaymentMethod(product, observation),
        sourceInstallments: [],
      };

    agreementEntry.agreementDateCandidates.push(dueDate);

    if (paymentDate) {
      agreementEntry.agreementDateCandidates.push(paymentDate);
    }

    agreementEntry.sourceStatuses.push(asString(row.status_acordo));

    const effectivePaymentDate = markedAsPaid ? paymentDate || dueDate : null;
    const effectivePaidValue = markedAsPaid
      ? Number.isFinite(paidValue) && paidValue > 0
        ? paidValue
        : installmentValue
      : 0;

    if (
      markedAsPaid &&
      (!paymentDate || !Number.isFinite(paidValue) || paidValue <= 0)
    ) {
      pushImportError(
        errors,
        seenErrorLines,
        line,
        "Linha paga importada com fallback de data ou valor por ausencia de dado completo.",
        row,
      );
    }

    agreementEntry.sourceInstallments.push({
      line,
      sourceInstallmentNumber,
      dueDate,
      installmentValue,
      paidValue: roundCurrency(effectivePaidValue),
      paymentDate: effectivePaymentDate,
      feeValue: Number.isFinite(feeValue) ? roundCurrency(feeValue) : 0,
      status: resolveCobwareInstallmentStatus({
        dueDate,
        paidValue: effectivePaidValue,
        paymentDate: effectivePaymentDate,
        markedAsPaid,
      }),
      observation,
    });

    agreementMap.set(agreementKey, agreementEntry);
  });

  const installmentMap = new Map<string, CobwareInstallmentDraft>();
  const writeOffMap = new Map<string, CobwareWriteOffDraft>();
  const paymentMap = new Map<string, CobwarePaymentDraft>();

  const agreements = Array.from(agreementMap.entries()).map(([externalKey, item]) => {
    const sortedInstallments = item.sourceInstallments
      .slice()
      .sort((left, right) => {
        if (left.sourceInstallmentNumber === right.sourceInstallmentNumber) {
          return left.dueDate.localeCompare(right.dueDate);
        }

        return left.sourceInstallmentNumber - right.sourceInstallmentNumber;
      });
    const hasEntry = sortedInstallments.some(
      (installment) => installment.sourceInstallmentNumber === 0,
    );

    const normalizedInstallments = sortedInstallments.map((installment, index) => {
      const installmentType =
        installment.sourceInstallmentNumber === 0
          ? "entrada"
          : !hasEntry && item.installmentCount === 1
            ? "avista"
            : "parcela";
      const installmentExternalKey = buildExternalKey("cobware-parcela", [
        externalKey,
        installment.sourceInstallmentNumber,
        installment.dueDate,
        installment.installmentValue.toFixed(2),
      ]);
      const draft: CobwareInstallmentDraft = {
        externalKey: installmentExternalKey,
        agreementExternalKey: externalKey,
        sourceInstallmentNumber: installment.sourceInstallmentNumber,
        installmentNumber: index + 1,
        installmentType,
        dueDate: installment.dueDate,
        installmentValue: installment.installmentValue,
        paidValue: installment.paidValue,
        paymentDate: installment.paymentDate,
        status: installment.status,
        observation: installment.observation,
      };

      installmentMap.set(installmentExternalKey, draft);

      if (draft.status === "pago" && draft.paymentDate && draft.paidValue > 0) {
        const writeOffExternalKey = buildExternalKey("cobware-baixa", [
          installmentExternalKey,
          draft.paymentDate,
          draft.paidValue.toFixed(2),
        ]);
        const writeOffDraft: CobwareWriteOffDraft = {
          externalKey: writeOffExternalKey,
          agreementExternalKey: externalKey,
          installmentExternalKey,
          creditorName: item.creditorName,
          walletName: item.walletName,
          contract: item.contract,
          cpfCnpj: item.cpfCnpj,
          paymentDate: draft.paymentDate,
          paidValue: draft.paidValue,
          feeValue: installment.feeValue,
          paymentMethod: item.paymentMethod,
          observation: installment.observation,
        };

        writeOffMap.set(writeOffExternalKey, writeOffDraft);

        const paymentExternalKey = buildExternalKey("cobware-pagamento", [
          writeOffExternalKey,
          draft.paymentDate,
          draft.paidValue.toFixed(2),
        ]);

        paymentMap.set(paymentExternalKey, {
          externalKey: paymentExternalKey,
          writeOffExternalKey,
          agreementExternalKey: externalKey,
          installmentExternalKey,
          creditorName: item.creditorName,
          walletName: item.walletName,
          contract: item.contract,
          cpfCnpj: item.cpfCnpj,
          paymentDate: draft.paymentDate,
          paidValue: draft.paidValue,
          feeValue: installment.feeValue,
        });
      }

      return draft;
    });

    const entryInstallment = normalizedInstallments.find(
      (installment) => installment.installmentType === "entrada",
    );
    const regularInstallments = normalizedInstallments.filter(
      (installment) => installment.installmentType !== "entrada",
    );
    const paidTotal = roundCurrency(
      normalizedInstallments.reduce((total, installment) => total + installment.paidValue, 0),
    );

    return {
      externalKey,
      clientExternalKey: item.clientExternalKey,
      contractExternalKey: item.contractExternalKey,
      customerName: item.customerName,
      creditorName: item.creditorName,
      walletName: item.walletName,
      contract: item.contract,
      cpfCnpj: item.cpfCnpj,
      originalValue: extractPrincipalValue(item.observation, item.agreementValue),
      agreementValue: item.agreementValue,
      paidValue: paidTotal,
      remainingValue: roundCurrency(Math.max(item.agreementValue - paidTotal, 0)),
      installmentCount: item.installmentCount,
      regularInstallmentValue:
        regularInstallments.find((installment) => installment.installmentValue > 0)
          ?.installmentValue ??
        normalizedInstallments[0]?.installmentValue ??
        item.agreementValue,
      entryValue: entryInstallment?.installmentValue ?? 0,
      agreementDate:
        pickEarliestDate(item.agreementDateCandidates) || format(new Date(), "yyyy-MM-dd"),
      entryDueDate: entryInstallment?.dueDate ?? null,
      firstInstallmentDue: regularInstallments[0]?.dueDate ?? null,
      lastPaymentDate: pickLatestDate(
        normalizedInstallments.map((installment) => installment.paymentDate),
      ),
      paymentMethod: item.paymentMethod,
      observation: item.observation,
      status: resolveCobwareAgreementStatus(item.sourceStatuses, normalizedInstallments),
    } satisfies CobwareAgreementDraft;
  });

  const contractAccumulator = new Map<
    string,
    {
      externalKey: string;
      clientExternalKey: string;
      customerName: string;
      creditorName: string;
      walletName: string;
      contract: string;
      cpfCnpj: string;
      originalValue: number;
      openValue: number;
      contractDate: string;
      dueDates: string[];
      statuses: string[];
    }
  >();

  const clientAccumulator = new Map<
    string,
    {
      externalKey: string;
      customerName: string;
      cpfCnpj: string;
      statuses: string[];
    }
  >();

  for (const agreement of agreements) {
    const contractEntry =
      contractAccumulator.get(agreement.contractExternalKey) ??
      {
        externalKey: agreement.contractExternalKey,
        clientExternalKey: agreement.clientExternalKey,
        customerName: agreement.customerName,
        creditorName: agreement.creditorName,
        walletName: agreement.walletName,
        contract: agreement.contract,
        cpfCnpj: agreement.cpfCnpj,
        originalValue: 0,
        openValue: 0,
        contractDate: agreement.agreementDate,
        dueDates: [],
        statuses: [],
      };

    contractEntry.originalValue = roundCurrency(
      contractEntry.originalValue + agreement.originalValue,
    );
    contractEntry.openValue = roundCurrency(contractEntry.openValue + agreement.remainingValue);
    contractEntry.contractDate = pickEarliestDate([
      contractEntry.contractDate,
      agreement.agreementDate,
    ]);

    if (agreement.entryDueDate) {
      contractEntry.dueDates.push(agreement.entryDueDate);
    }

    if (agreement.firstInstallmentDue) {
      contractEntry.dueDates.push(agreement.firstInstallmentDue);
    }

    contractEntry.statuses.push(agreement.status);
    contractAccumulator.set(agreement.contractExternalKey, contractEntry);

    const clientEntry =
      clientAccumulator.get(agreement.clientExternalKey) ??
      {
        externalKey: agreement.clientExternalKey,
        customerName: agreement.customerName,
        cpfCnpj: agreement.cpfCnpj,
        statuses: [],
      };

    clientEntry.statuses.push(agreement.status);
    clientAccumulator.set(agreement.clientExternalKey, clientEntry);
  }

  const contracts = Array.from(contractAccumulator.values()).map((contract) => ({
    externalKey: contract.externalKey,
    clientExternalKey: contract.clientExternalKey,
    customerName: contract.customerName,
    creditorName: contract.creditorName,
    walletName: contract.walletName,
    contract: contract.contract,
    cpfCnpj: contract.cpfCnpj,
    originalValue: contract.originalValue,
    openValue: contract.openValue,
    contractDate: contract.contractDate,
    dueDate: pickLatestDate(contract.dueDates),
    status: resolveCobwareContractStatus(contract.statuses, contract.openValue),
  }));

  const clients = Array.from(clientAccumulator.values()).map((client) => ({
    externalKey: client.externalKey,
    customerName: client.customerName,
    cpfCnpj: client.cpfCnpj,
    status: resolveCobwareClientStatus(client.statuses),
  }));

  return {
    clients,
    contracts,
    agreements,
    installments: Array.from(installmentMap.values()),
    writeOffs: Array.from(writeOffMap.values()),
    payments: Array.from(paymentMap.values()),
    errors,
    validSourceRows,
  };
}

function buildCobwareWarning(analysis: CobwareAnalysis) {
  return [
    `${analysis.clients.length} cliente(s) consolidados`,
    `${analysis.contracts.length} contrato(s) consolidados`,
    `${analysis.agreements.length} acordo(s) consolidados`,
    `${analysis.installments.length} parcela(s) consolidadas`,
    `${analysis.writeOffs.length} baixa(s) consolidadas`,
    `${analysis.payments.length} pagamento(s) gerados`,
    `${analysis.errors.length} linha(s) com ressalva`,
  ].join(" - ");
}

async function ensureTeam(
  admin: AdminClient,
  cache: Map<string, string>,
  teamName: string,
) {
  const key = teamName.toLowerCase();
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const { data, error } = await admin
    .from("equipes")
    .upsert(
      {
        nome: teamName,
        ativo: true,
      },
      {
        onConflict: "nome",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Nao foi possivel registrar a equipe "${teamName}".`);
  }

  cache.set(key, data.id);
  return data.id;
}

async function ensureCreditor(
  admin: AdminClient,
  cache: Map<string, string>,
  creditorName: string,
) {
  const key = creditorName.toLowerCase();
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const { data, error } = await admin
    .from("credores")
    .upsert(
      {
        nome: creditorName,
        ativo: true,
      },
      {
        onConflict: "nome",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Nao foi possivel registrar o credor "${creditorName}".`);
  }

  cache.set(key, data.id);
  return data.id;
}

async function ensureWallet(
  admin: AdminClient,
  walletCache: Map<string, string>,
  creditorCache: Map<string, string>,
  walletName: string,
  creditorName: string,
) {
  await ensureCreditor(admin, creditorCache, creditorName);

  const key = buildWalletCacheKey(creditorName, walletName);
  const cached = walletCache.get(key);

  if (cached) {
    return cached;
  }

  const { data, error } = await admin
    .from("carteiras")
    .upsert(
      {
        nome: walletName,
        credor: creditorName,
        ativo: true,
      },
      {
        onConflict: "nome",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Nao foi possivel registrar a carteira "${walletName}".`);
  }

  walletCache.set(key, data.id);
  return data.id;
}

async function ensureOperator(
  admin: AdminClient,
  operatorCache: Map<string, string>,
  name: string,
  email: string | null,
  teamId: string,
) {
  const cacheKey = (email || name).toLowerCase();
  const cached = operatorCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const { data, error } = await admin
    .from("operadores")
    .upsert(
      {
        nome: name,
        email,
        equipe_id: teamId,
        ativo: true,
      },
      {
        onConflict: email ? "email" : "nome",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Nao foi possivel registrar o operador "${name}".`);
  }

  operatorCache.set(cacheKey, data.id);
  operatorCache.set(name.toLowerCase(), data.id);

  if (email) {
    operatorCache.set(email.toLowerCase(), data.id);
  }

  return data.id;
}

async function createImportRecord(
  admin: AdminClient,
  type: ImportType,
  fileName: string,
  profile: PortalProfile,
) {
  const { data, error } = await admin
    .from("importacoes")
    .insert({
      tipo: type,
      nome_arquivo: fileName,
      usuario_id: profile.user_id,
      status: "processando",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Nao foi possivel abrir o historico de importacao.");
  }

  return data.id;
}

async function finalizeImportRecord(
  admin: AdminClient,
  importId: string,
  payload: {
    totalRows: number;
    importedRows: number;
    errorRows: number;
    status: string;
    message?: string | null;
  },
) {
  await admin
    .from("importacoes")
    .update({
      total_linhas: payload.totalRows,
      linhas_importadas: payload.importedRows,
      linhas_erro: payload.errorRows,
      status: payload.status,
      mensagem_erro: payload.message ?? null,
    })
    .eq("id", importId);
}

async function upsertClientBatch(admin: AdminClient, rows: ClientInsert[]) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("clientes").upsert(chunk, {
      onConflict: "cpf_cnpj",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertClientWalletBatch(
  admin: AdminClient,
  rows: ClientWalletInsert[],
) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("cliente_carteiras").upsert(chunk, {
      onConflict: "cliente_id,carteira_id",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertContractBatch(admin: AdminClient, rows: ContractInsert[]) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("contratos").upsert(chunk, {
      onConflict: "cliente_id,numero_contrato",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertAgreementBatch(admin: AdminClient, rows: AgreementInsert[]) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("acordos").upsert(chunk, {
      onConflict: "chave_externa",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertInstallmentBatch(admin: AdminClient, rows: InstallmentInsert[]) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("acordo_parcelas").upsert(chunk, {
      onConflict: "chave_externa",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertWriteOffBatch(admin: AdminClient, rows: WriteOffInsert[]) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("acordo_baixas").upsert(chunk, {
      onConflict: "chave_externa",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertPaymentBatch(admin: AdminClient, rows: PaymentInsert[]) {
  if (!rows.length) {
    return;
  }

  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("pagamentos").upsert(chunk, {
      onConflict: "chave_externa",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function fetchClientsByDocuments(admin: AdminClient, documents: string[]) {
  const map = new Map<string, ClientRow>();
  const uniqueDocuments = Array.from(new Set(documents.filter(Boolean)));

  for (const chunk of chunkArray(uniqueDocuments, 500)) {
    const { data, error } = await admin.from("clientes").select("*").in("cpf_cnpj", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as ClientRow[]) {
      map.set(normalizeDocument(row.cpf_cnpj), row);
    }
  }

  return map;
}

async function fetchContractsByClientIds(admin: AdminClient, clientIds: string[]) {
  const map = new Map<string, ContractRow>();
  const uniqueIds = Array.from(new Set(clientIds.filter(Boolean)));

  for (const chunk of chunkArray(uniqueIds, 500)) {
    const { data, error } = await admin.from("contratos").select("*").in("cliente_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as ContractRow[]) {
      map.set(buildContractLookupKey(row.cliente_id, row.numero_contrato), row);
    }
  }

  return map;
}

async function fetchAgreementsByExternalKeys(admin: AdminClient, externalKeys: string[]) {
  const map = new Map<string, AgreementRow>();
  const uniqueKeys = Array.from(new Set(externalKeys.filter(Boolean)));

  for (const chunk of chunkArray(uniqueKeys, 500)) {
    const { data, error } = await admin.from("acordos").select("*").in("chave_externa", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as AgreementRow[]) {
      if (row.chave_externa) {
        map.set(row.chave_externa, row);
      }
    }
  }

  return map;
}

async function fetchInstallmentsByExternalKeys(
  admin: AdminClient,
  externalKeys: string[],
) {
  const map = new Map<string, InstallmentRow>();
  const uniqueKeys = Array.from(new Set(externalKeys.filter(Boolean)));

  for (const chunk of chunkArray(uniqueKeys, 500)) {
    const { data, error } = await admin
      .from("acordo_parcelas")
      .select("*")
      .in("chave_externa", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as InstallmentRow[]) {
      if (row.chave_externa) {
        map.set(row.chave_externa, row);
      }
    }
  }

  return map;
}

async function fetchWriteOffsByExternalKeys(admin: AdminClient, externalKeys: string[]) {
  const map = new Map<string, WriteOffRow>();
  const uniqueKeys = Array.from(new Set(externalKeys.filter(Boolean)));

  for (const chunk of chunkArray(uniqueKeys, 500)) {
    const { data, error } = await admin
      .from("acordo_baixas")
      .select("*")
      .in("chave_externa", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as WriteOffRow[]) {
      if (row.chave_externa) {
        map.set(row.chave_externa, row);
      }
    }
  }

  return map;
}

async function processCobwareImport(
  profile: PortalProfile,
  file: File,
  rows: ParsedRow[],
): Promise<ImportProcessResult> {
  const analysis = analyzeCobwareRows(rows);
  const importedRows = analysis.validSourceRows;
  const errorReport = analysis.errors.length ? buildErrorReport(analysis.errors) : undefined;
  const warning = buildCobwareWarning(analysis);

  if (!isSupabaseConfigured()) {
    return {
      type: "cobware",
      fileName: file.name,
      totalRows: rows.length,
      importedRows,
      errorRows: analysis.errors.length,
      status:
        analysis.errors.length === 0
          ? "success"
          : importedRows > 0
            ? "partial"
            : "error",
      errors: analysis.errors,
      errorReport,
      warning: `Modo demonstracao: ${warning}. Nenhum dado foi persistido.`,
    };
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    throw new Error(
      "Configure o SUPABASE_SERVICE_ROLE_KEY para habilitar a persistencia de importacoes.",
    );
  }

  const walletCache = new Map<string, string>();
  const creditorCache = new Map<string, string>();
  const importId = await createImportRecord(admin, "cobware", file.name, profile);

  try {
    for (const contract of analysis.contracts) {
      await ensureWallet(
        admin,
        walletCache,
        creditorCache,
        contract.walletName,
        contract.creditorName,
      );
    }

    const clientRows: ClientInsert[] = analysis.clients.map((client) => ({
      nome: client.customerName,
      cpf_cnpj: client.cpfCnpj,
      status: client.status,
      operador_id: null,
      equipe_id: null,
      chave_externa: client.externalKey,
    }));

    await upsertClientBatch(admin, clientRows);

    const clientMap = await fetchClientsByDocuments(
      admin,
      analysis.clients.map((client) => client.cpfCnpj),
    );

    const contractRows: ContractInsert[] = analysis.contracts.map((contract) => {
      const client = clientMap.get(contract.cpfCnpj);

      if (!client) {
        throw new Error(
          `Cliente nao localizado apos upsert para o documento ${contract.cpfCnpj}.`,
        );
      }

      const walletId = walletCache.get(
        buildWalletCacheKey(contract.creditorName, contract.walletName),
      );

      if (!walletId) {
        throw new Error(`Carteira nao localizada para ${contract.walletName}.`);
      }

      return {
        cliente_id: client.id,
        carteira_id: walletId,
        credor: contract.creditorName,
        numero_contrato: contract.contract,
        valor_original: contract.originalValue,
        valor_em_aberto: contract.openValue,
        data_contrato: contract.contractDate,
        data_vencimento: contract.dueDate,
        status: contract.status,
        operador_id: null,
        equipe_id: null,
        chave_externa: contract.externalKey,
      };
    });

    await upsertContractBatch(admin, contractRows);

    const contractMap = await fetchContractsByClientIds(
      admin,
      contractRows.map((contract) => contract.cliente_id),
    );

    const clientWalletRows: ClientWalletInsert[] = [];

    for (const contract of analysis.contracts) {
      const client = clientMap.get(contract.cpfCnpj);
      const walletId = walletCache.get(
        buildWalletCacheKey(contract.creditorName, contract.walletName),
      );

      if (!client || !walletId) {
        continue;
      }

      clientWalletRows.push({
        cliente_id: client.id,
        carteira_id: walletId,
        credor: contract.creditorName,
        ativo: true,
        chave_externa: buildExternalKey("cobware-cliente-carteira", [client.id, walletId]),
      });
    }

    await upsertClientWalletBatch(admin, clientWalletRows);

    const agreementRows: AgreementInsert[] = analysis.agreements.map((agreement) => {
      const client = clientMap.get(agreement.cpfCnpj);

      if (!client) {
        throw new Error(
          `Cliente nao localizado para o acordo do documento ${agreement.cpfCnpj}.`,
        );
      }

      const contract = contractMap.get(buildContractLookupKey(client.id, agreement.contract));
      const walletId = walletCache.get(
        buildWalletCacheKey(agreement.creditorName, agreement.walletName),
      );

      if (!walletId) {
        throw new Error(`Carteira nao localizada para ${agreement.walletName}.`);
      }

      return {
        cliente_id: client.id,
        contrato_id: contract?.id ?? null,
        data_acordo: agreement.agreementDate,
        operador_id: null,
        equipe_id: null,
        carteira_id: walletId,
        cpf_cnpj: agreement.cpfCnpj,
        contrato: agreement.contract,
        valor_original: agreement.originalValue,
        valor_acordo: agreement.agreementValue,
        valor_entrada: agreement.entryValue,
        quantidade_parcelas: agreement.installmentCount,
        valor_parcela: agreement.regularInstallmentValue,
        valor_pago: agreement.paidValue,
        data_vencimento_entrada: agreement.entryDueDate,
        primeiro_vencimento: agreement.firstInstallmentDue,
        forma_pagamento: agreement.paymentMethod,
        status: agreement.status,
        observacao: agreement.observation,
        criado_por: profile.id,
        importacao_id: importId,
        chave_externa: agreement.externalKey,
        ultimo_pagamento_em: agreement.lastPaymentDate,
      };
    });

    await upsertAgreementBatch(admin, agreementRows);

    const agreementMap = await fetchAgreementsByExternalKeys(
      admin,
      analysis.agreements.map((agreement) => agreement.externalKey),
    );

    const installmentRows: InstallmentInsert[] = analysis.installments.map((installment) => {
      const agreement = agreementMap.get(installment.agreementExternalKey);

      if (!agreement) {
        throw new Error("Acordo nao localizado apos upsert das parcelas.");
      }

      return {
        acordo_id: agreement.id,
        numero_parcela: installment.installmentNumber,
        tipo: installment.installmentType,
        data_vencimento: installment.dueDate,
        valor_parcela: installment.installmentValue,
        valor_pago: installment.paidValue,
        data_pagamento: installment.paymentDate,
        status: installment.status,
        observacao: installment.observation,
        chave_externa: installment.externalKey,
      };
    });

    await upsertInstallmentBatch(admin, installmentRows);

    const installmentMap = await fetchInstallmentsByExternalKeys(
      admin,
      analysis.installments.map((installment) => installment.externalKey),
    );

    const writeOffRows: WriteOffInsert[] = analysis.writeOffs.map((writeOff) => {
      const agreement = agreementMap.get(writeOff.agreementExternalKey);
      const installment = installmentMap.get(writeOff.installmentExternalKey);

      if (!agreement || !installment) {
        throw new Error("Acordo ou parcela nao localizado para registrar baixa.");
      }

      return {
        acordo_id: agreement.id,
        parcela_id: installment.id,
        cliente_id: agreement.cliente_id,
        data_pagamento: writeOff.paymentDate,
        valor_pago: writeOff.paidValue,
        forma_pagamento: writeOff.paymentMethod,
        observacao: writeOff.observation,
        registrado_por: profile.id,
        chave_externa: writeOff.externalKey,
      };
    });

    await upsertWriteOffBatch(admin, writeOffRows);

    const writeOffMap = await fetchWriteOffsByExternalKeys(
      admin,
      analysis.writeOffs.map((writeOff) => writeOff.externalKey),
    );

    const paymentRows: PaymentInsert[] = analysis.payments.map((payment) => {
      const agreement = agreementMap.get(payment.agreementExternalKey);
      const writeOff = writeOffMap.get(payment.writeOffExternalKey);

      if (!agreement || !writeOff) {
        throw new Error("Acordo ou baixa nao localizado para registrar pagamento.");
      }

      return {
        baixa_id: writeOff.id,
        acordo_id: agreement.id,
        cliente_id: agreement.cliente_id,
        data_pagamento: payment.paymentDate,
        operador_id: agreement.operador_id,
        equipe_id: agreement.equipe_id,
        carteira_id: agreement.carteira_id,
        cpf_cnpj: payment.cpfCnpj,
        contrato: payment.contract,
        valor_pago: payment.paidValue,
        valor_honorario: payment.feeValue,
        origem_arquivo: file.name,
        importacao_id: importId,
        chave_externa: payment.externalKey,
      };
    });

    await upsertPaymentBatch(admin, paymentRows);

    const status =
      analysis.errors.length === 0
        ? "success"
        : importedRows > 0
          ? "partial"
          : "error";

    await finalizeImportRecord(admin, importId, {
      totalRows: rows.length,
      importedRows,
      errorRows: analysis.errors.length,
      status:
        status === "success"
          ? "concluido"
          : status === "partial"
            ? "concluido_com_ressalvas"
            : "erro",
      message: analysis.errors.length ? warning : `Importacao CobWare concluida: ${warning}.`,
    });

    return {
      type: "cobware",
      fileName: file.name,
      totalRows: rows.length,
      importedRows,
      errorRows: analysis.errors.length,
      status,
      errors: analysis.errors,
      errorReport,
      warning,
      importId,
    };
  } catch (error) {
    await finalizeImportRecord(admin, importId, {
      totalRows: rows.length,
      importedRows,
      errorRows: analysis.errors.length,
      status: "erro",
      message:
        error instanceof Error ? error.message : "Falha geral na importacao CobWare.",
    });

    throw error;
  }
}

export async function processImport(
  profile: PortalProfile,
  type: ImportType,
  file: File,
): Promise<ImportProcessResult> {
  if (!canImport(profile.perfil)) {
    throw new Error("Seu perfil nao pode importar arquivos.");
  }

  const rows = await parseFile(file);
  const validation = validateColumns(type, rows);

  if (!validation.ok) {
    return {
      type,
      fileName: file.name,
      totalRows: rows.length,
      importedRows: 0,
      errorRows: rows.length,
      status: "error",
      errors: [
        {
          line: 1,
          message: validation.message ?? "Arquivo invalido.",
          row: {},
        },
      ],
      errorReport: buildErrorReport([
        {
          line: 1,
          message: validation.message ?? "Arquivo invalido.",
          row: {},
        },
      ]),
    };
  }

  if (type === "cobware") {
    return processCobwareImport(profile, file, rows);
  }

  if (!isSupabaseConfigured()) {
    const errors = rows.flatMap((row, index) => {
      const missing = requiredColumns[type].filter((column) => !asString(row[column]));

      if (!missing.length) {
        return [];
      }

      return [
        {
          line: index + 2,
          message: `Campos obrigatorios vazios: ${missing.join(", ")}.`,
          row,
        } satisfies ImportLineError,
      ];
    });

    const importedRows = rows.length - errors.length;

    return {
      type,
      fileName: file.name,
      totalRows: rows.length,
      importedRows,
      errorRows: errors.length,
      status: errors.length ? (importedRows ? "partial" : "error") : "success",
      errors,
      errorReport: errors.length ? buildErrorReport(errors) : undefined,
      warning:
        "Modo demonstracao: o arquivo foi validado, mas nao foi persistido em banco.",
    };
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    throw new Error(
      "Configure o SUPABASE_SERVICE_ROLE_KEY para habilitar a persistencia de importacoes.",
    );
  }

  const teamCache = new Map<string, string>();
  const operatorCache = new Map<string, string>();
  const creditorCache = new Map<string, string>();
  const walletCache = new Map<string, string>();
  const errors: ImportLineError[] = [];
  let importedRows = 0;
  const importId = await createImportRecord(admin, type, file.name, profile);

  try {
    for (const [index, row] of rows.entries()) {
      try {
        if (type === "pagamentos") {
          const paymentDate = parseDate(row.data_pagamento);
          const teamName = asString(row.equipe);
          const operatorName = asString(row.operador);
          const walletName = asString(row.carteira);
          const creditorName = asString(row.credor);
          const paidValue = parseNumber(row.valor_pago);
          const feeValue = parseNumber(row.valor_honorario);

          if (!paymentDate || !teamName || !operatorName || !walletName || !creditorName) {
            throw new Error("Preencha data, equipe, operador, carteira e credor.");
          }

          if (!Number.isFinite(paidValue)) {
            throw new Error("Valor pago invalido.");
          }

          const teamId = await ensureTeam(admin, teamCache, teamName);
          const walletId = await ensureWallet(
            admin,
            walletCache,
            creditorCache,
            walletName,
            creditorName,
          );
          const operatorId = await ensureOperator(
            admin,
            operatorCache,
            operatorName,
            null,
            teamId,
          );
          const externalKey = buildExternalKey("pagamentos", [
            paymentDate,
            operatorId,
            walletId,
            asString(row.cpf_cnpj),
            asString(row.contrato),
            paidValue.toFixed(2),
          ]);

          const { error } = await admin.from("pagamentos").upsert(
            {
              data_pagamento: paymentDate,
              operador_id: operatorId,
              equipe_id: teamId,
              carteira_id: walletId,
              cpf_cnpj: asString(row.cpf_cnpj) || null,
              contrato: asString(row.contrato) || null,
              valor_pago: paidValue,
              valor_honorario: Number.isFinite(feeValue) ? feeValue : 0,
              origem_arquivo: file.name,
              importacao_id: importId,
              chave_externa: externalKey,
            },
            {
              onConflict: "chave_externa",
            },
          );

          if (error) {
            throw new Error(error.message);
          }
        }

        if (type === "acordos") {
          const agreementDate = parseDate(row.data_acordo);
          const teamName = asString(row.equipe);
          const operatorName = asString(row.operador);
          const walletName = asString(row.carteira);
          const agreementValue = parseNumber(row.valor_acordo);
          const downPayment = parseNumber(row.valor_entrada);
          const parcels = parseInteger(row.quantidade_parcelas);

          if (!agreementDate || !teamName || !operatorName || !walletName) {
            throw new Error("Preencha data, equipe, operador e carteira.");
          }

          if (!Number.isFinite(agreementValue)) {
            throw new Error("Valor de acordo invalido.");
          }

          const teamId = await ensureTeam(admin, teamCache, teamName);
          const walletId = await ensureWallet(
            admin,
            walletCache,
            creditorCache,
            walletName,
            asString(row.credor) || "Credor nao informado",
          );
          const operatorId = await ensureOperator(
            admin,
            operatorCache,
            operatorName,
            null,
            teamId,
          );
          const externalKey = buildExternalKey("acordos", [
            agreementDate,
            operatorId,
            walletId,
            asString(row.cpf_cnpj),
            asString(row.contrato),
            agreementValue.toFixed(2),
            Number.isFinite(parcels) ? parcels : 1,
          ]);

          const { error } = await admin.from("acordos").upsert(
            {
              data_acordo: agreementDate,
              operador_id: operatorId,
              equipe_id: teamId,
              carteira_id: walletId,
              cpf_cnpj: asString(row.cpf_cnpj) || null,
              contrato: asString(row.contrato) || null,
              valor_acordo: agreementValue,
              valor_entrada: Number.isFinite(downPayment) ? downPayment : 0,
              quantidade_parcelas: Number.isFinite(parcels) ? parcels : 1,
              status: asString(row.status) || "ativo",
              importacao_id: importId,
              chave_externa: externalKey,
            },
            {
              onConflict: "chave_externa",
            },
          );

          if (error) {
            throw new Error(error.message);
          }
        }

        if (type === "operadores") {
          const teamName = asString(row.equipe);
          const operatorName = asString(row.nome);
          const email = asString(row.email) || null;

          if (!operatorName || !teamName) {
            throw new Error("Nome e equipe sao obrigatorios.");
          }

          const teamId = await ensureTeam(admin, teamCache, teamName);
          await ensureOperator(admin, operatorCache, operatorName, email, teamId);
        }

        if (type === "metas") {
          const month = parseInteger(row.mes);
          const year = parseInteger(row.ano);
          const goalValue = parseNumber(row.valor_meta);
          const teamName = asString(row.equipe);
          const walletName = asString(row.carteira);
          const operatorName = asString(row.operador);

          if (
            !Number.isFinite(month) ||
            !Number.isFinite(year) ||
            !Number.isFinite(goalValue)
          ) {
            throw new Error("Mes, ano e valor_meta precisam ser numericos.");
          }

          const teamId = teamName
            ? await ensureTeam(admin, teamCache, teamName)
            : null;
          const walletId = walletName
            ? await ensureWallet(
                admin,
                walletCache,
                creditorCache,
                walletName,
                asString(row.credor) || "Credor nao informado",
              )
            : null;
          const operatorId =
            operatorName && teamId
              ? await ensureOperator(admin, operatorCache, operatorName, null, teamId)
              : null;
          const externalKey = buildExternalKey("metas", [
            month,
            year,
            operatorId,
            teamId,
            walletId,
          ]);

          const { error } = await admin.from("metas").upsert(
            {
              mes: month,
              ano: year,
              operador_id: operatorId,
              equipe_id: teamId,
              carteira_id: walletId,
              valor_meta: goalValue,
              chave_externa: externalKey,
            } satisfies GoalInsert,
            {
              onConflict: "chave_externa",
            },
          );

          if (error) {
            throw new Error(error.message);
          }
        }

        if (type === "carteiras") {
          const walletName = asString(row.nome);
          const creditorName = asString(row.credor);

          if (!walletName || !creditorName) {
            throw new Error("Carteira e credor sao obrigatorios.");
          }

          await ensureWallet(
            admin,
            walletCache,
            creditorCache,
            walletName,
            creditorName,
          );
        }

        if (type === "acionamentos") {
          const actionDate = parseDate(row.data_acionamento);
          const teamName = asString(row.equipe);
          const operatorName = asString(row.operador);
          const walletName = asString(row.carteira);
          const event = asString(row.evento);

          if (!actionDate || !teamName || !operatorName || !walletName || !event) {
            throw new Error("Data, equipe, operador, carteira e evento sao obrigatorios.");
          }

          const teamId = await ensureTeam(admin, teamCache, teamName);
          const walletId = await ensureWallet(
            admin,
            walletCache,
            creditorCache,
            walletName,
            asString(row.credor) || "Credor nao informado",
          );
          const operatorId = await ensureOperator(
            admin,
            operatorCache,
            operatorName,
            null,
            teamId,
          );
          const externalKey = buildExternalKey("acionamentos", [
            actionDate,
            operatorId,
            walletId,
            asString(row.contrato),
            event,
          ]);

          const { error } = await admin.from("acionamentos").upsert(
            {
              data_acionamento: actionDate,
              operador_id: operatorId,
              equipe_id: teamId,
              carteira_id: walletId,
              cpf_cnpj: asString(row.cpf_cnpj) || null,
              contrato: asString(row.contrato) || null,
              evento: event,
              descricao: asString(row.descricao) || null,
              canal: asString(row.canal) || null,
              importacao_id: importId,
              chave_externa: externalKey,
            } satisfies ActionInsert,
            {
              onConflict: "chave_externa",
            },
          );

          if (error) {
            throw new Error(error.message);
          }
        }

        importedRows += 1;
      } catch (error) {
        errors.push({
          line: index + 2,
          message:
            error instanceof Error ? error.message : "Erro desconhecido ao processar a linha.",
          row,
        });
      }
    }

    const status =
      errors.length === 0 ? "success" : importedRows > 0 ? "partial" : "error";
    const dbStatus =
      status === "success"
        ? "concluido"
        : status === "partial"
          ? "concluido_com_ressalvas"
          : "erro";
    const errorReport = errors.length ? buildErrorReport(errors) : undefined;

    await finalizeImportRecord(admin, importId, {
      totalRows: rows.length,
      importedRows,
      errorRows: errors.length,
      status: dbStatus,
      message: errors.length ? `${errors.length} linha(s) apresentaram erro.` : null,
    });

    return {
      type,
      fileName: file.name,
      totalRows: rows.length,
      importedRows,
      errorRows: errors.length,
      status,
      errors,
      errorReport,
      importId,
    };
  } catch (error) {
    await finalizeImportRecord(admin, importId, {
      totalRows: rows.length,
      importedRows,
      errorRows: rows.length - importedRows,
      status: "erro",
      message: error instanceof Error ? error.message : "Falha geral na importacao.",
    });

    throw error;
  }
}

export async function getImportRequestProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Sessao invalida ou expirada.");
  }

  return profile;
}
