import { createHash } from "node:crypto";

import { format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

import { getCurrentProfile } from "@/lib/auth";
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

type AgreementInsert = Database["public"]["Tables"]["acordos"]["Insert"];
type PaymentInsert = Database["public"]["Tables"]["pagamentos"]["Insert"];
type GoalInsert = Database["public"]["Tables"]["metas"]["Insert"];
type ActionInsert = Database["public"]["Tables"]["acionamentos"]["Insert"];

interface CobwareAgreementDraft {
  externalKey: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string | null;
  agreementValue: number;
  installmentCount: number;
  entryValue: number;
  agreementDate: string;
  status: string;
}

interface CobwarePaymentDraft {
  externalKey: string;
  creditorName: string;
  walletName: string;
  contract: string;
  cpfCnpj: string | null;
  paymentDate: string;
  paidValue: number;
  feeValue: number;
}

interface CobwareAnalysis {
  agreements: CobwareAgreementDraft[];
  payments: CobwarePaymentDraft[];
  errors: ImportLineError[];
  validSourceRows: number;
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
    return value;
  }

  const raw = asString(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
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
  return `CobWare • ${normalizedHoType}`;
}

function pickEarliestDate(values: string[]) {
  const sorted = values.filter(Boolean).sort();
  return sorted[0] ?? "";
}

function resolveCobwareAgreementStatus(sourceStatuses: string[], paidCount: number, installmentCount: number) {
  if (paidCount >= installmentCount && installmentCount > 0) {
    return "quitado";
  }

  const normalizedStatus = sourceStatuses
    .map((status) => status.toLowerCase())
    .find((status) => status.includes("quit"));

  if (normalizedStatus) {
    return "quitado";
  }

  return "andamento";
}

function analyzeCobwareRows(rows: ParsedRow[]): CobwareAnalysis {
  const errors: ImportLineError[] = [];
  const paymentMap = new Map<string, CobwarePaymentDraft>();
  const agreementMap = new Map<
    string,
    {
      creditorName: string;
      walletName: string;
      contract: string;
      cpfCnpj: string | null;
      agreementValue: number;
      installmentCount: number;
      entryValue: number;
      dates: string[];
      sourceStatuses: string[];
      paidCount: number;
      installmentCandidates: number[];
    }
  >();

  let validSourceRows = 0;

  rows.forEach((row, index) => {
    const line = index + 2;
    const creditorName = asString(row.credor);
    const customerName = asString(row.nome_cliente);
    const cpfCnpj = asString(row.cpf_cnpj) || null;
    const contract = asString(row.contratos_fatura);
    const agreementValue = parseNumber(row.vlr_acordo);
    const installmentCount = parseInteger(row.qtd_parc);
    const installmentNumber = parseInteger(row.parcela);
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
    const isPaid = isTruthyYes(row.pago);

    if (!creditorName || !customerName || !contract) {
      errors.push({
        line,
        message: "Credor, nome do cliente e contrato/fatura sao obrigatorios.",
        row,
      });
      return;
    }

    if (!Number.isFinite(agreementValue) || agreementValue <= 0) {
      errors.push({
        line,
        message: "VLR ACORDO invalido para consolidacao do acordo.",
        row,
      });
      return;
    }

    if (!Number.isFinite(installmentCount) || installmentCount <= 0) {
      errors.push({
        line,
        message: "QTD PARC invalida para consolidacao do acordo.",
        row,
      });
      return;
    }

    validSourceRows += 1;

    const agreementKey = buildExternalKey("cobware-acordo", [
      creditorName,
      customerName,
      cpfCnpj,
      contract,
      agreementValue.toFixed(2),
      installmentCount,
      hoType,
      contractType,
    ]);

    const agreementEntry =
      agreementMap.get(agreementKey) ??
      {
        creditorName,
        walletName,
        contract,
        cpfCnpj,
        agreementValue,
        installmentCount,
        entryValue: 0,
        dates: [],
        sourceStatuses: [],
        paidCount: 0,
        installmentCandidates: [],
      };

    if (dueDate) {
      agreementEntry.dates.push(dueDate);
    }

    if (paymentDate) {
      agreementEntry.dates.push(paymentDate);
    }

    agreementEntry.sourceStatuses.push(asString(row.status_acordo));

    if (Number.isFinite(installmentValue) && installmentValue > 0) {
      agreementEntry.installmentCandidates.push(installmentValue);
      if (installmentNumber === 1 && agreementEntry.entryValue === 0) {
        agreementEntry.entryValue = installmentValue;
      }
    }

    if (isPaid) {
      agreementEntry.paidCount += 1;

      if (!paymentDate || !Number.isFinite(paidValue) || paidValue <= 0) {
        errors.push({
          line,
          message:
            "Linha marcada como paga, mas sem Data Pagamento valida ou Valor Pago positivo.",
          row,
        });
      } else {
        const paymentContract = Number.isFinite(installmentNumber) && installmentNumber > 0
          ? `${contract} :: parcela ${installmentNumber}/${installmentCount}`
          : contract;
        const paymentKey = buildExternalKey("cobware-pagamento", [
          agreementKey,
          installmentNumber,
          paymentDate,
          paidValue.toFixed(2),
        ]);

        paymentMap.set(paymentKey, {
          externalKey: paymentKey,
          creditorName,
          walletName,
          contract: paymentContract,
          cpfCnpj,
          paymentDate,
          paidValue,
          feeValue: Number.isFinite(feeValue) ? feeValue : 0,
        });
      }
    }

    agreementMap.set(agreementKey, agreementEntry);
  });

  const agreements = Array.from(agreementMap.entries()).map(([externalKey, item]) => ({
    externalKey,
    creditorName: item.creditorName,
    walletName: item.walletName,
    contract: item.contract,
    cpfCnpj: item.cpfCnpj,
    agreementValue: item.agreementValue,
    installmentCount: item.installmentCount,
    entryValue:
      item.entryValue ||
      item.installmentCandidates.find((value) => value > 0) ||
      0,
    agreementDate: pickEarliestDate(item.dates) || format(new Date(), "yyyy-MM-dd"),
    status: resolveCobwareAgreementStatus(
      item.sourceStatuses,
      item.paidCount,
      item.installmentCount,
    ),
  }));

  return {
    agreements,
    payments: Array.from(paymentMap.values()),
    errors,
    validSourceRows,
  };
}

function buildCobwareWarning(analysis: CobwareAnalysis) {
  return [
    `${analysis.agreements.length} acordo(s) consolidados`,
    `${analysis.payments.length} pagamento(s) gerados`,
    `${analysis.errors.length} linha(s) com ressalva`,
  ].join(" • ");
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

  const key = `${creditorName.toLowerCase()}::${walletName.toLowerCase()}`;
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

async function upsertAgreementBatch(admin: AdminClient, rows: AgreementInsert[]) {
  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("acordos").upsert(chunk, {
      onConflict: "chave_externa",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertPaymentBatch(admin: AdminClient, rows: PaymentInsert[]) {
  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await admin.from("pagamentos").upsert(chunk, {
      onConflict: "chave_externa",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function processCobwareImport(
  profile: PortalProfile,
  file: File,
  rows: ParsedRow[],
): Promise<ImportProcessResult> {
  const analysis = analyzeCobwareRows(rows);
  const importedRows = analysis.agreements.length + analysis.payments.length;
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
    const agreementRows: AgreementInsert[] = [];
    const paymentRows: PaymentInsert[] = [];

    for (const agreement of analysis.agreements) {
      const walletId = await ensureWallet(
        admin,
        walletCache,
        creditorCache,
        agreement.walletName,
        agreement.creditorName,
      );

      agreementRows.push({
        data_acordo: agreement.agreementDate,
        operador_id: null,
        equipe_id: null,
        carteira_id: walletId,
        cpf_cnpj: agreement.cpfCnpj,
        contrato: agreement.contract,
        valor_acordo: agreement.agreementValue,
        valor_entrada: agreement.entryValue,
        quantidade_parcelas: agreement.installmentCount,
        status: agreement.status,
        importacao_id: importId,
        chave_externa: agreement.externalKey,
      });
    }

    for (const payment of analysis.payments) {
      const walletId = await ensureWallet(
        admin,
        walletCache,
        creditorCache,
        payment.walletName,
        payment.creditorName,
      );

      paymentRows.push({
        data_pagamento: payment.paymentDate,
        operador_id: null,
        equipe_id: null,
        carteira_id: walletId,
        cpf_cnpj: payment.cpfCnpj,
        contrato: payment.contract,
        valor_pago: payment.paidValue,
        valor_honorario: payment.feeValue,
        origem_arquivo: file.name,
        importacao_id: importId,
        chave_externa: payment.externalKey,
      });
    }

    await upsertAgreementBatch(admin, agreementRows);
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
