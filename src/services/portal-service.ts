import { cache } from "react";

import { requireActiveProfile } from "@/lib/auth";
import { buildFilterOptions, scopeDatasetToProfile } from "@/lib/portal-scope";
import {
  buildDashboardSummary,
  buildDailyEvolution,
  buildMonthlyEvolution,
  buildOperatorOverview,
  buildOperatorRanking,
  buildTeamPerformance,
  buildWalletPerformance,
} from "@/lib/portal-analytics";
import { isSupabaseConfigured } from "@/lib/env";
import { getMockPortalDataset } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  AdminSectionData,
  AdminSectionKey,
  DashboardFilters,
  DashboardPageData,
  ImportRecord,
  OperatorPageData,
  TeamPageData,
  WalletPageData,
} from "@/types/portal";

function toRows<T>(data: { data: T[] | null }) {
  return data.data ?? [];
}

function mapProfileRows(rows: Database["public"]["Tables"]["profiles"]["Row"][]) {
  return rows.map((row) => ({
    ...row,
    perfil: row.perfil as DashboardPageData["profile"]["perfil"],
  }));
}

const getPortalContext = cache(async () => {
  const profile = await requireActiveProfile();
  const demoMode = !isSupabaseConfigured();

  if (demoMode) {
    const dataset = scopeDatasetToProfile(getMockPortalDataset(), profile);
    return {
      profile,
      dataset,
      demoMode,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const dataset = scopeDatasetToProfile(getMockPortalDataset(), profile);
    return {
      profile,
      dataset,
      demoMode: true,
    };
  }

  const [
    profilesResult,
    operatorsResult,
    teamsResult,
    creditorsResult,
    walletsResult,
    goalsResult,
    paymentsResult,
    agreementsResult,
    actionsResult,
    importsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("nome"),
    supabase.from("operadores").select("*").order("nome"),
    supabase.from("equipes").select("*").order("nome"),
    supabase.from("credores").select("*").order("nome"),
    supabase.from("carteiras").select("*").order("nome"),
    supabase.from("metas").select("*").order("ano", { ascending: false }),
    supabase
      .from("pagamentos")
      .select("*")
      .order("data_pagamento", { ascending: false }),
    supabase
      .from("acordos")
      .select("*")
      .order("data_acordo", { ascending: false }),
    supabase
      .from("acionamentos")
      .select("*")
      .order("data_acionamento", { ascending: false }),
    supabase.from("importacoes").select("*").order("criado_em", { ascending: false }),
  ]);

  const dataset = scopeDatasetToProfile(
    {
      profiles: mapProfileRows(toRows(profilesResult)),
      operators: toRows(operatorsResult),
      teams: toRows(teamsResult),
      creditors: toRows(creditorsResult),
      wallets: toRows(walletsResult),
      goals: toRows(goalsResult),
      payments: toRows(paymentsResult),
      agreements: toRows(agreementsResult),
      actions: toRows(actionsResult),
      imports: toRows(importsResult) as ImportRecord[],
    },
    profile,
  );

  return {
    profile,
    dataset,
    demoMode,
  };
});

export async function getDashboardPageData(
  filters: DashboardFilters,
): Promise<DashboardPageData> {
  const { profile, dataset, demoMode } = await getPortalContext();
  const options = buildFilterOptions(dataset);

  return {
    profile,
    filters,
    options,
    summary: buildDashboardSummary(dataset, filters),
    dailyEvolution: buildDailyEvolution(dataset, filters),
    monthlyEvolution: buildMonthlyEvolution(dataset, filters),
    operatorRanking: buildOperatorRanking(dataset, filters),
    teamPerformance: buildTeamPerformance(dataset, filters),
    walletPerformance: buildWalletPerformance(dataset, filters),
    demoMode,
  };
}

export async function getTeamPageData(
  filters: DashboardFilters,
): Promise<TeamPageData> {
  const { profile, dataset, demoMode } = await getPortalContext();
  const options = buildFilterOptions(dataset);

  return {
    profile,
    filters,
    options,
    teams: buildTeamPerformance(dataset, filters),
    evolution: buildMonthlyEvolution(dataset, filters),
    demoMode,
  };
}

export async function getWalletPageData(
  filters: DashboardFilters,
): Promise<WalletPageData> {
  const { profile, dataset, demoMode } = await getPortalContext();
  const options = buildFilterOptions(dataset);

  return {
    profile,
    filters,
    options,
    wallets: buildWalletPerformance(dataset, filters),
    evolution: buildMonthlyEvolution(dataset, filters),
    demoMode,
  };
}

export async function getOperatorPageData(
  filters: DashboardFilters,
): Promise<OperatorPageData> {
  const { profile, dataset, demoMode } = await getPortalContext();
  const options = buildFilterOptions(dataset);
  const operatorId =
    profile.operador_id ?? dataset.operators.find((item) => item.id)?.id ?? "";

  return {
    profile,
    filters,
    options,
    overview: buildOperatorOverview(dataset, filters, operatorId),
    teamRanking: buildOperatorRanking(dataset, {
      ...filters,
      operatorId: undefined,
      teamId: profile.equipe_id ?? filters.teamId,
    }),
    overallRanking: buildOperatorRanking(dataset, {
      ...filters,
      operatorId: undefined,
      teamId: undefined,
    }),
    demoMode,
  };
}

export async function getImportsPageData() {
  const { profile, dataset, demoMode } = await getPortalContext();

  return {
    profile,
    imports: dataset.imports,
    demoMode,
  };
}

export async function getAdminSectionData(
  key: AdminSectionKey,
): Promise<{ profile: DashboardPageData["profile"]; data: AdminSectionData }> {
  const { profile, dataset } = await getPortalContext();

  const sections: Record<AdminSectionKey, AdminSectionData> = {
    usuarios: {
      key,
      title: "Usuarios",
      description: "Perfis autenticados e papeis de acesso.",
      columns: [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "perfil", header: "Perfil" },
        { key: "ativo", header: "Ativo", align: "center" },
      ],
      rows: dataset.profiles.map((item) => ({
        nome: item.nome,
        email: item.email,
        perfil: item.perfil,
        ativo: item.ativo ? "Sim" : "Nao",
      })),
    },
    operadores: {
      key,
      title: "Operadores",
      description: "Base operacional vinculada as equipes.",
      columns: [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "equipe", header: "Equipe" },
        { key: "ativo", header: "Ativo", align: "center" },
      ],
      rows: dataset.operators.map((item) => ({
        nome: item.nome,
        email: item.email,
        equipe:
          dataset.teams.find((team) => team.id === item.equipe_id)?.nome ?? "-",
        ativo: item.ativo ? "Sim" : "Nao",
      })),
    },
    equipes: {
      key,
      title: "Equipes",
      description: "Estrutura de times e supervisao.",
      columns: [
        { key: "nome", header: "Equipe" },
        { key: "supervisor", header: "Supervisor" },
        { key: "ativo", header: "Ativo", align: "center" },
      ],
      rows: dataset.teams.map((item) => ({
        nome: item.nome,
        supervisor:
          dataset.profiles.find((profileRow) => profileRow.id === item.supervisor_id)
            ?.nome ?? "-",
        ativo: item.ativo ? "Sim" : "Nao",
      })),
    },
    carteiras: {
      key,
      title: "Carteiras",
      description: "Carteiras e credores associados.",
      columns: [
        { key: "nome", header: "Carteira" },
        { key: "credor", header: "Credor" },
        { key: "ativo", header: "Ativo", align: "center" },
      ],
      rows: dataset.wallets.map((item) => ({
        nome: item.nome,
        credor: item.credor,
        ativo: item.ativo ? "Sim" : "Nao",
      })),
    },
    credores: {
      key,
      title: "Credores",
      description: "Cadastro mestre de credores.",
      columns: [
        { key: "nome", header: "Credor" },
        { key: "ativo", header: "Ativo", align: "center" },
      ],
      rows: dataset.creditors.map((item) => ({
        nome: item.nome,
        ativo: item.ativo ? "Sim" : "Nao",
      })),
    },
    metas: {
      key,
      title: "Metas",
      description: "Metas mensais por operador, equipe e carteira.",
      columns: [
        { key: "mes_ano", header: "Competencia" },
        { key: "operador", header: "Operador" },
        { key: "equipe", header: "Equipe" },
        { key: "carteira", header: "Carteira" },
        { key: "valor_meta", header: "Meta", align: "right" },
      ],
      rows: dataset.goals.map((item) => ({
        mes_ano: `${String(item.mes).padStart(2, "0")}/${item.ano}`,
        operador:
          dataset.operators.find((operator) => operator.id === item.operador_id)?.nome ??
          "-",
        equipe:
          dataset.teams.find((team) => team.id === item.equipe_id)?.nome ?? "-",
        carteira:
          dataset.wallets.find((wallet) => wallet.id === item.carteira_id)?.nome ?? "-",
        valor_meta: item.valor_meta,
      })),
    },
    importacoes: {
      key,
      title: "Importacoes",
      description: "Historico de cargas processadas.",
      columns: [
        { key: "tipo", header: "Tipo" },
        { key: "nome_arquivo", header: "Arquivo" },
        { key: "linhas_importadas", header: "Importadas", align: "right" },
        { key: "linhas_erro", header: "Erros", align: "right" },
        { key: "status", header: "Status" },
      ],
      rows: dataset.imports.map((item) => ({
        tipo: item.tipo,
        nome_arquivo: item.nome_arquivo,
        linhas_importadas: item.linhas_importadas,
        linhas_erro: item.linhas_erro,
        status: item.status,
      })),
    },
    configuracoes: {
      key,
      title: "Configuracoes",
      description: "Checklist rapido de integracoes e seguranca.",
      columns: [
        { key: "item", header: "Item" },
        { key: "status", header: "Status" },
        { key: "detalhe", header: "Detalhe" },
      ],
      rows: [
        {
          item: "Supabase",
          status: isSupabaseConfigured() ? "Configurado" : "Pendente",
          detalhe: isSupabaseConfigured()
            ? "Variaveis publicas presentes."
            : "Preencha o arquivo .env.local.",
        },
        {
          item: "Modo demo",
          status: isSupabaseConfigured() ? "Desativado" : "Ativo",
          detalhe: isSupabaseConfigured()
            ? "Autenticacao real habilitada."
            : "A aplicacao usa dataset ficticio local.",
        },
        {
          item: "RLS",
          status: "Pronto",
          detalhe: "Policies e funcoes entregues nas migrations.",
        },
      ],
    },
  };

  return {
    profile,
    data: sections[key],
  };
}
