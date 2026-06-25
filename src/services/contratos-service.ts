import "server-only";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth";
import { roundCurrency } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { canCreateCases, canEditContracts } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registrarAuditoriaSegura } from "@/services/auditoria-service";
import {
  buildResolvedCollections,
  criarContrato as criarContratoCliente,
  getClientsContext,
} from "@/services/clientes-service";
import type { Database } from "@/types/database";
import type {
  ContractRegistryPageData,
  ContractRegistryRow,
  FlowContractInput,
  PortalRole,
} from "@/types/portal";

type ContractRow = Database["public"]["Tables"]["contratos"]["Row"];

const flowContractSchema = z.object({
  clientId: z.string().uuid("Cliente invalido."),
  agreementId: z.string().uuid().nullable().optional(),
  numeroContrato: z.string().trim().min(1, "Numero do contrato obrigatorio."),
  carteiraId: z.string().uuid("Carteira invalida."),
  credor: z.string().trim().nullable().optional(),
  credorId: z.string().uuid().nullable().optional(),
  valorOriginal: z.coerce.number().min(0, "Valor original invalido.").nullable().optional(),
  valorEmAberto: z.coerce.number().min(0, "Valor em aberto invalido."),
  dataContrato: z.string().trim().nullable().optional(),
  dataVencimento: z.string().trim().nullable().optional(),
  operadorId: z.string().uuid().nullable().optional(),
  equipeId: z.string().uuid().nullable().optional(),
  status: z.string().trim().nullable().optional(),
  observacao: z.string().trim().nullable().optional(),
  origemFluxo: z.enum(["acordo", "baixa"]),
});

export interface ContractFlowResult {
  contract: ContractRow | null;
  contractId: string;
  demoMode: boolean;
}

async function criarContratoNoFluxo(
  rawInput: FlowContractInput & {
    clientId: string;
    agreementId?: string | null;
    origemFluxo: "acordo" | "baixa";
  },
  allowedRoles: PortalRole[],
): Promise<ContractFlowResult> {
  const profile = await requireActiveProfile(allowedRoles);
  const input = flowContractSchema.parse(rawInput);

  if (!isSupabaseConfigured()) {
    return {
      contract: null,
      contractId: `demo-contract-${Date.now()}`,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      contract: null,
      contractId: `demo-contract-${Date.now()}`,
      demoMode: true,
    };
  }

  const { data: wallet, error: walletError } = await supabase
    .from("carteiras")
    .select("id, nome, credor, credor_id")
    .eq("id", input.carteiraId)
    .single();

  if (walletError || !wallet) {
    throw new Error("Carteira nao encontrada para criar o contrato.");
  }

  const { data: contract, error: contractError } = await supabase
    .from("contratos")
    .insert({
      cliente_id: input.clientId,
      carteira_id: wallet.id,
      credor: input.credor?.trim() || wallet.credor,
      credor_id: input.credorId ?? wallet.credor_id ?? null,
      numero_contrato: input.numeroContrato,
      valor_original: roundCurrency(input.valorOriginal ?? input.valorEmAberto),
      valor_em_aberto: roundCurrency(input.valorEmAberto),
      data_contrato: input.dataContrato?.trim() || null,
      data_vencimento: input.dataVencimento?.trim() || null,
      status:
        input.status?.trim() ||
        (roundCurrency(input.valorEmAberto) <= 0 ? "quitado" : "aberto"),
      operador_id: input.operadorId ?? null,
      equipe_id: input.equipeId ?? null,
      observacao: input.observacao?.trim() || null,
      origem_manual: true,
    })
    .select("*")
    .single();

  if (contractError || !contract) {
    throw new Error(contractError?.message ?? "Nao foi possivel criar o contrato.");
  }

  await registrarAuditoriaSegura({
    entidade: "contrato",
    entidadeId: contract.id,
    acao: "contrato_criado",
    descricao:
      input.origemFluxo === "acordo"
        ? "Contrato criado durante o cadastro do acordo."
        : "Contrato criado durante o fluxo de baixa.",
    clienteId: input.clientId,
    acordoId: input.agreementId ?? null,
    contratoId: contract.id,
    operadorId: contract.operador_id,
    equipeId: contract.equipe_id,
    carteiraId: contract.carteira_id,
    usuarioId: profile.id,
    usuarioNome: profile.nome,
    origem: "manual",
    dadosNovos: {
      numeroContrato: contract.numero_contrato,
      valorOriginal: contract.valor_original,
      valorEmAberto: contract.valor_em_aberto,
      carteira: wallet.nome,
    },
  });

  return {
    contract,
    contractId: contract.id,
    demoMode: false,
  };
}

export async function criarContratoDuranteAcordo(
  rawInput: FlowContractInput & { clientId: string; agreementId?: string | null },
) {
  return criarContratoNoFluxo(
    {
      ...rawInput,
      origemFluxo: "acordo",
    },
    ["admin", "gerente", "supervisor", "operador"],
  );
}

export async function criarContratoDuranteBaixa(
  rawInput: FlowContractInput & { clientId: string; agreementId?: string | null },
) {
  return criarContratoNoFluxo(
    {
      ...rawInput,
      origemFluxo: "baixa",
    },
    ["admin", "gerente", "supervisor", "financeiro"],
  );
}

export { criarContratoCliente };

export async function getContratosPageData(): Promise<ContractRegistryPageData> {
  const context = await getClientsContext();
  const resolved = buildResolvedCollections(context);
  const today = new Date().toISOString().slice(0, 10);

  const contracts: ContractRegistryRow[] = context.contracts
    .map((contract) => {
      const client = resolved.clientById.get(contract.cliente_id);
      const wallet = contract.carteira_id ? resolved.walletById.get(contract.carteira_id) : null;
      const operator = contract.operador_id
        ? resolved.operatorById.get(contract.operador_id)
        : null;
      const team = contract.equipe_id ? resolved.teamById.get(contract.equipe_id) : null;

      return {
        ...contract,
        clientName: client?.nome ?? "Cliente nao localizado",
        clientDocument: client?.cpf_cnpj ?? "-",
        walletName: wallet?.nome ?? "-",
        creditorName: contract.credor ?? wallet?.credor ?? "-",
        operatorName: operator?.nome ?? "-",
        teamName: team?.nome ?? "-",
      };
    })
    .sort((left, right) => right.atualizado_em.localeCompare(left.atualizado_em));

  return {
    profile: context.profile,
    contracts,
    canCreateCase: canCreateCases(context.profile.perfil),
    canEditContracts: canEditContracts(context.profile.perfil),
    demoMode: context.demoMode,
    summary: {
      total: contracts.length,
      active: contracts.filter((contract) => contract.status !== "inativo").length,
      withWallet: contracts.filter((contract) => contract.carteira_id).length,
      updatedToday: contracts.filter(
        (contract) => contract.atualizado_em.slice(0, 10) === today,
      ).length,
    },
  };
}
