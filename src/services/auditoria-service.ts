import "server-only";

import { requireActiveProfile } from "@/lib/auth";
import { getAgreementStatusLabel } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import type { AuditEvent } from "@/types/portal";

import {
  buildResolvedCollections,
  getClientsContext,
} from "@/services/clientes-service";

type AuditRow = Database["public"]["Tables"]["auditoria_eventos"]["Row"];

interface CreateAuditEventInput {
  entidade: string;
  entidadeId: string;
  acao: string;
  descricao?: string | null;
  acordoId?: string | null;
  parcelaId?: string | null;
  baixaId?: string | null;
  pagamentoId?: string | null;
  clienteId?: string | null;
  contratoId?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
  carteiraId?: string | null;
  usuarioId?: string | null;
  payload?: Record<string, unknown>;
}

function toAuditPayload(payload: Json) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return {};
  }

  return payload as Record<string, unknown>;
}

function mapAuditRow(row: AuditRow, userNames: Map<string, string>): AuditEvent {
  return {
    id: row.id,
    entidade: row.entidade,
    entidadeId: row.entidade_id,
    acao: row.acao,
    descricao: row.descricao,
    acordoId: row.acordo_id,
    parcelaId: row.parcela_id,
    baixaId: row.baixa_id,
    pagamentoId: row.pagamento_id,
    clienteId: row.cliente_id,
    contratoId: row.contrato_id,
    operadorId: row.operador_id,
    equipeId: row.equipe_id,
    carteiraId: row.carteira_id,
    usuarioId: row.usuario_id,
    usuarioNome: row.usuario_id
      ? userNames.get(row.usuario_id) ?? "Portal BKO"
      : "Portal BKO",
    payload: toAuditPayload(row.payload),
    criadoEm: row.criado_em,
  };
}

function sortAuditEvents(events: AuditEvent[]) {
  return [...events].sort((left, right) => right.criadoEm.localeCompare(left.criadoEm));
}

async function buildFallbackAuditEvents(acordoId: string) {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const agreement = resolved.agreementById.get(acordoId);

  if (!agreement) {
    return [] satisfies AuditEvent[];
  }

  const client = agreement.cliente_id
    ? resolved.clientById.get(agreement.cliente_id)
    : undefined;
  const userNames = new Map(context.profiles.map((profile) => [profile.id, profile.nome]));
  const events: AuditEvent[] = [
    {
      id: `fallback-acordo-${agreement.id}`,
      entidade: "acordo",
      entidadeId: agreement.id,
      acao: "acordo_criado",
      descricao: agreement.observacao ?? "Acordo registrado no Portal BKO.",
      acordoId: agreement.id,
      parcelaId: null,
      baixaId: null,
      pagamentoId: null,
      clienteId: agreement.cliente_id,
      contratoId: agreement.contrato_id,
      operadorId: agreement.operador_id,
      equipeId: agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: agreement.criado_por,
      usuarioNome: agreement.criado_por
        ? userNames.get(agreement.criado_por) ?? "Portal BKO"
        : "Portal BKO",
      payload: {
        status: agreement.resolvedStatus,
        valorAcordo: agreement.valor_acordo,
        quantidadeParcelas: agreement.resolvedInstallments.length,
      },
      criadoEm: agreement.criado_em,
    },
  ];

  if (agreement.resolvedStatus !== "ativo") {
    events.push({
      id: `fallback-status-${agreement.id}`,
      entidade: "acordo",
      entidadeId: agreement.id,
      acao: "acordo_status_alterado",
      descricao: `Status atual: ${getAgreementStatusLabel(agreement.resolvedStatus)}.`,
      acordoId: agreement.id,
      parcelaId: null,
      baixaId: null,
      pagamentoId: null,
      clienteId: agreement.cliente_id,
      contratoId: agreement.contrato_id,
      operadorId: agreement.operador_id,
      equipeId: agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: agreement.criado_por,
      usuarioNome: agreement.criado_por
        ? userNames.get(agreement.criado_por) ?? "Portal BKO"
        : "Portal BKO",
      payload: {
        status: agreement.resolvedStatus,
        valorPago: agreement.valor_pago,
        saldo: agreement.remainingValue,
      },
      criadoEm: agreement.atualizado_em,
    });
  }

  if (agreement.resolvedStatus === "cancelado") {
    events.push({
      id: `fallback-cancel-${agreement.id}`,
      entidade: "acordo",
      entidadeId: agreement.id,
      acao: "acordo_cancelado",
      descricao: agreement.observacao ?? "Acordo cancelado manualmente.",
      acordoId: agreement.id,
      parcelaId: null,
      baixaId: null,
      pagamentoId: null,
      clienteId: agreement.cliente_id,
      contratoId: agreement.contrato_id,
      operadorId: agreement.operador_id,
      equipeId: agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: agreement.criado_por,
      usuarioNome: agreement.criado_por
        ? userNames.get(agreement.criado_por) ?? "Portal BKO"
        : "Portal BKO",
      payload: {},
      criadoEm: agreement.atualizado_em,
    });
  }

  const writeOffs = resolved.resolvedWriteOffs.filter((writeOff) => writeOff.acordo_id === acordoId);

  for (const writeOff of writeOffs) {
    events.push({
      id: `fallback-baixa-${writeOff.id}`,
      entidade: "baixa",
      entidadeId: writeOff.id,
      acao: "baixa_registrada",
      descricao:
        writeOff.forma_pagamento
          ? `Baixa registrada via ${writeOff.forma_pagamento}.`
          : "Baixa registrada no acordo.",
      acordoId: writeOff.acordo_id,
      parcelaId: writeOff.parcela_id,
      baixaId: writeOff.id,
      pagamentoId: null,
      clienteId: writeOff.cliente_id ?? client?.id ?? null,
      contratoId: agreement.contrato_id,
      operadorId: agreement.operador_id,
      equipeId: agreement.equipe_id,
      carteiraId: agreement.carteira_id,
      usuarioId: writeOff.registrado_por,
      usuarioNome: writeOff.registrado_por
        ? userNames.get(writeOff.registrado_por) ?? "Portal BKO"
        : "Portal BKO",
      payload: {
        valorPago: writeOff.valor_pago,
        observacao: writeOff.observacao,
      },
      criadoEm: writeOff.criado_em,
    });

    if (writeOff.estornada) {
      events.push({
        id: `fallback-estorno-${writeOff.id}`,
        entidade: "baixa",
        entidadeId: writeOff.id,
        acao: "baixa_estornada",
        descricao: writeOff.motivo_estorno ?? "Baixa estornada manualmente.",
        acordoId: writeOff.acordo_id,
        parcelaId: writeOff.parcela_id,
        baixaId: writeOff.id,
        pagamentoId: null,
        clienteId: writeOff.cliente_id ?? client?.id ?? null,
        contratoId: agreement.contrato_id,
        operadorId: agreement.operador_id,
        equipeId: agreement.equipe_id,
        carteiraId: agreement.carteira_id,
        usuarioId: writeOff.estornada_por,
        usuarioNome: writeOff.estornada_por
          ? userNames.get(writeOff.estornada_por) ?? "Portal BKO"
          : "Portal BKO",
        payload: {
          valorPago: writeOff.valor_pago,
          motivoEstorno: writeOff.motivo_estorno,
        },
        criadoEm: writeOff.estornada_em ?? writeOff.criado_em,
      });
    }
  }

  return sortAuditEvents(events);
}

export async function listarHistoricoAcordo(acordoId: string) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);

  if (!acordoId.trim()) {
    return [] satisfies AuditEvent[];
  }

  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);

  if (!resolved.agreementById.has(acordoId)) {
    return [] satisfies AuditEvent[];
  }

  if (!isSupabaseConfigured()) {
    return buildFallbackAuditEvents(acordoId);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return buildFallbackAuditEvents(acordoId);
  }

  const { data, error } = await supabase
    .from("auditoria_eventos")
    .select("*")
    .eq("acordo_id", acordoId)
    .order("criado_em", { ascending: false });

  if (error || !data?.length) {
    return buildFallbackAuditEvents(acordoId);
  }

  const userNames = new Map(context.profiles.map((profile) => [profile.id, profile.nome]));
  return data.map((row) => mapAuditRow(row, userNames));
}

export async function criarEventoAuditoria(input: CreateAuditEventInput) {
  await requireActiveProfile(["admin", "gerente", "supervisor", "operador", "financeiro"]);

  if (!isSupabaseConfigured()) {
    return {
      id: `demo-auditoria-${Date.now()}`,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: `demo-auditoria-${Date.now()}`,
      demoMode: true,
    };
  }

  const { data, error } = await supabase
    .from("auditoria_eventos")
    .insert({
      entidade: input.entidade,
      entidade_id: input.entidadeId,
      acao: input.acao,
      descricao: input.descricao ?? null,
      acordo_id: input.acordoId ?? null,
      parcela_id: input.parcelaId ?? null,
      baixa_id: input.baixaId ?? null,
      pagamento_id: input.pagamentoId ?? null,
      cliente_id: input.clienteId ?? null,
      contrato_id: input.contratoId ?? null,
      operador_id: input.operadorId ?? null,
      equipe_id: input.equipeId ?? null,
      carteira_id: input.carteiraId ?? null,
      usuario_id: input.usuarioId ?? null,
      payload: (input.payload ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar o evento de auditoria.");
  }

  return {
    id: data.id,
    demoMode: false,
  };
}
