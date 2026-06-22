import { addDays, format, startOfMonth, subDays, subMonths } from "date-fns";

import { DEMO_ROLE_COOKIE } from "@/lib/env";
import type {
  Agreement,
  ContactAction,
  Creditor,
  Goal,
  ImportRecord,
  Operator,
  Payment,
  PortalDataset,
  PortalProfile,
  PortalRole,
  Team,
  Wallet,
} from "@/types/portal";

const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();

function dateString(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function timestampString(value: Date) {
  return value.toISOString();
}

const creditors: Creditor[] = [
  {
    id: "cred-1",
    nome: "Banco Aurora",
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "cred-2",
    nome: "Financeira Horizonte",
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "cred-3",
    nome: "Varejo Prisma",
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
];

const wallets: Wallet[] = [
  {
    id: "wallet-1",
    nome: "Carteira Premium",
    credor: creditors[0].nome,
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "wallet-2",
    nome: "Carteira PJ",
    credor: creditors[0].nome,
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "wallet-3",
    nome: "Carteira Varejo Sul",
    credor: creditors[1].nome,
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "wallet-4",
    nome: "Carteira Varejo Norte",
    credor: creditors[2].nome,
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "wallet-5",
    nome: "Carteira Recuperacao",
    credor: creditors[2].nome,
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
];

const teams: Team[] = [
  {
    id: "team-1",
    nome: "Time Atlas",
    supervisor_id: "profile-sup-1",
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "team-2",
    nome: "Time Bora",
    supervisor_id: "profile-sup-2",
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
  {
    id: "team-3",
    nome: "Time Cobalto",
    supervisor_id: "profile-sup-2",
    ativo: true,
    criado_em: timestampString(subMonths(today, 6)),
    atualizado_em: timestampString(today),
  },
];

const operators: Array<Operator & { primary_wallet_id: string }> = [
  {
    id: "op-1",
    nome: "Bianca Lima",
    email: "bianca.lima@portalbko.local",
    equipe_id: teams[0].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 5)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[0].id,
  },
  {
    id: "op-2",
    nome: "Carlos Prado",
    email: "carlos.prado@portalbko.local",
    equipe_id: teams[0].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 5)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[1].id,
  },
  {
    id: "op-3",
    nome: "Daniele Rocha",
    email: "daniele.rocha@portalbko.local",
    equipe_id: teams[0].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 4)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[2].id,
  },
  {
    id: "op-4",
    nome: "Eduardo Salles",
    email: "eduardo.salles@portalbko.local",
    equipe_id: teams[1].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 4)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[2].id,
  },
  {
    id: "op-5",
    nome: "Fernanda Paz",
    email: "fernanda.paz@portalbko.local",
    equipe_id: teams[1].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 4)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[3].id,
  },
  {
    id: "op-6",
    nome: "Guilherme Viana",
    email: "guilherme.viana@portalbko.local",
    equipe_id: teams[1].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 4)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[0].id,
  },
  {
    id: "op-7",
    nome: "Helena Nobre",
    email: "helena.nobre@portalbko.local",
    equipe_id: teams[2].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 3)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[4].id,
  },
  {
    id: "op-8",
    nome: "Igor Faria",
    email: "igor.faria@portalbko.local",
    equipe_id: teams[2].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 3)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[4].id,
  },
  {
    id: "op-9",
    nome: "Juliana Costa",
    email: "juliana.costa@portalbko.local",
    equipe_id: teams[2].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 3)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[3].id,
  },
  {
    id: "op-10",
    nome: "Leandro Vieira",
    email: "leandro.vieira@portalbko.local",
    equipe_id: teams[2].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 3)),
    atualizado_em: timestampString(today),
    primary_wallet_id: wallets[1].id,
  },
];

const profiles: PortalProfile[] = [
  {
    id: "profile-admin",
    user_id: "user-admin",
    nome: "Ana Borges",
    email: "admin@portalbko.local",
    perfil: "admin",
    operador_id: null,
    equipe_id: null,
    ativo: true,
    criado_em: timestampString(subMonths(today, 12)),
    atualizado_em: timestampString(today),
  },
  {
    id: "profile-manager",
    user_id: "user-manager",
    nome: "Mateus Ramires",
    email: "gerente@portalbko.local",
    perfil: "gerente",
    operador_id: null,
    equipe_id: null,
    ativo: true,
    criado_em: timestampString(subMonths(today, 12)),
    atualizado_em: timestampString(today),
  },
  {
    id: "profile-finance",
    user_id: "user-finance",
    nome: "Paula Medeiros",
    email: "financeiro@portalbko.local",
    perfil: "financeiro",
    operador_id: null,
    equipe_id: null,
    ativo: true,
    criado_em: timestampString(subMonths(today, 12)),
    atualizado_em: timestampString(today),
  },
  {
    id: "profile-sup-1",
    user_id: "user-sup-1",
    nome: "Rafaela Teles",
    email: "supervisor.atlas@portalbko.local",
    perfil: "supervisor",
    operador_id: null,
    equipe_id: teams[0].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 10)),
    atualizado_em: timestampString(today),
  },
  {
    id: "profile-sup-2",
    user_id: "user-sup-2",
    nome: "Thiago Benevides",
    email: "supervisor.bora@portalbko.local",
    perfil: "supervisor",
    operador_id: null,
    equipe_id: teams[1].id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 10)),
    atualizado_em: timestampString(today),
  },
  ...operators.map((operator, index) => ({
    id: `profile-operator-${index + 1}`,
    user_id: `user-operator-${index + 1}`,
    nome: operator.nome,
    email: operator.email ?? `operador${index + 1}@portalbko.local`,
    perfil: "operador" as const,
    operador_id: operator.id,
    equipe_id: operator.equipe_id,
    ativo: true,
    criado_em: timestampString(subMonths(today, 8)),
    atualizado_em: timestampString(today),
  })),
];

const goals: Goal[] = operators.map((operator, index) => ({
  id: `goal-${index + 1}`,
  mes: currentMonth,
  ano: currentYear,
  operador_id: operator.id,
  equipe_id: operator.equipe_id,
  carteira_id: operator.primary_wallet_id,
  valor_meta: 32000 + index * 2200,
  chave_externa: null,
  criado_em: timestampString(startOfMonth(today)),
  atualizado_em: timestampString(today),
}));

const previousGoals: Goal[] = operators.map((operator, index) => ({
  id: `goal-prev-${index + 1}`,
  mes: subMonths(today, 1).getMonth() + 1,
  ano: subMonths(today, 1).getFullYear(),
  operador_id: operator.id,
  equipe_id: operator.equipe_id,
  carteira_id: operator.primary_wallet_id,
  valor_meta: 30000 + index * 2100,
  chave_externa: null,
  criado_em: timestampString(startOfMonth(subMonths(today, 1))),
  atualizado_em: timestampString(subMonths(today, 1)),
}));

const payments: Payment[] = [];
const agreements: Agreement[] = [];
const actions: ContactAction[] = [];

for (let offset = 0; offset < 45; offset += 1) {
  const workday = subDays(today, offset);
  const dayIndex = offset + 1;

  operators.forEach((operator, operatorIndex) => {
    const shouldCreatePayment = (dayIndex + operatorIndex) % 3 === 0;
    const wallet =
      wallets[(operatorIndex + dayIndex) % wallets.length] ??
      wallets[operatorIndex % wallets.length];

    if (shouldCreatePayment) {
      const amount = 780 + operatorIndex * 145 + (dayIndex % 6) * 110;
      payments.push({
        id: `pay-${dayIndex}-${operator.id}`,
        baixa_id: null,
        acordo_id: null,
        cliente_id: null,
        data_pagamento: dateString(workday),
        operador_id: operator.id,
        equipe_id: operator.equipe_id,
        carteira_id: wallet.id,
        cpf_cnpj: `000.000.000-${String((operatorIndex + dayIndex) % 99).padStart(2, "0")}`,
        contrato: `CTR-${operatorIndex + 1}-${String(dayIndex).padStart(3, "0")}`,
        valor_pago: amount,
        valor_honorario: Number((amount * 0.18).toFixed(2)),
        origem_arquivo: `pagamentos_${format(workday, "yyyy_MM")}.csv`,
        chave_externa: null,
        importacao_id: `import-pay-${Math.max(1, Math.ceil(dayIndex / 7))}`,
        criado_em: timestampString(addDays(workday, 1)),
      });
    }

    if ((dayIndex + operatorIndex) % 4 === 0) {
      const agreementAmount = 1650 + operatorIndex * 180 + (dayIndex % 5) * 120;
      agreements.push({
        id: `agr-${dayIndex}-${operator.id}`,
        cliente_id: null,
        contrato_id: null,
        data_acordo: dateString(workday),
        operador_id: operator.id,
        equipe_id: operator.equipe_id,
        carteira_id: wallet.id,
        cpf_cnpj: `111.111.111-${String((operatorIndex + dayIndex) % 99).padStart(2, "0")}`,
        contrato: `AGR-${operatorIndex + 1}-${String(dayIndex).padStart(3, "0")}`,
        valor_original: agreementAmount,
        valor_acordo: agreementAmount,
        valor_entrada: Number((agreementAmount * 0.35).toFixed(2)),
        quantidade_parcelas: 4 + (operatorIndex % 6),
        valor_parcela: Number((agreementAmount / Math.max(1, 4 + (operatorIndex % 6))).toFixed(2)),
        valor_pago: 0,
        data_vencimento_entrada: null,
        primeiro_vencimento: dateString(addDays(workday, 30)),
        forma_pagamento: null,
        status: dayIndex % 2 === 0 ? "ativo" : "formalizado",
        observacao: null,
        criado_por: null,
        chave_externa: null,
        importacao_id: `import-agr-${Math.max(1, Math.ceil(dayIndex / 8))}`,
        ultimo_pagamento_em: null,
        criado_em: timestampString(addDays(workday, 1)),
        atualizado_em: timestampString(addDays(workday, 1)),
      });
    }

    if ((dayIndex + operatorIndex) % 5 === 0) {
      actions.push({
        id: `act-${dayIndex}-${operator.id}`,
        data_acionamento: dateString(workday),
        operador_id: operator.id,
        equipe_id: operator.equipe_id,
        carteira_id: wallet.id,
        cpf_cnpj: null,
        contrato: `ACT-${operatorIndex + 1}-${String(dayIndex).padStart(3, "0")}`,
        evento: dayIndex % 2 === 0 ? "Ligacao" : "WhatsApp",
        descricao: "Contato realizado com proposta ativa.",
        canal: dayIndex % 2 === 0 ? "voz" : "mensageria",
        importacao_id: `import-act-${Math.max(1, Math.ceil(dayIndex / 9))}`,
        criado_em: timestampString(addDays(workday, 1)),
      });
    }
  });
}

const imports: ImportRecord[] = [
  {
    id: "import-pay-1",
    tipo: "pagamentos",
    nome_arquivo: "pagamentos_semana_01.csv",
    usuario_id: "user-admin",
    total_linhas: 120,
    linhas_importadas: 118,
    linhas_erro: 2,
    status: "concluido_com_ressalvas",
    mensagem_erro: "2 linhas com carteira nao localizada.",
    criado_em: timestampString(subDays(today, 21)),
  },
  {
    id: "import-pay-2",
    tipo: "pagamentos",
    nome_arquivo: "pagamentos_semana_02.csv",
    usuario_id: "user-manager",
    total_linhas: 136,
    linhas_importadas: 136,
    linhas_erro: 0,
    status: "concluido",
    mensagem_erro: null,
    criado_em: timestampString(subDays(today, 14)),
  },
  {
    id: "import-agr-1",
    tipo: "acordos",
    nome_arquivo: "acordos_semana_02.xlsx",
    usuario_id: "user-finance",
    total_linhas: 84,
    linhas_importadas: 84,
    linhas_erro: 0,
    status: "concluido",
    mensagem_erro: null,
    criado_em: timestampString(subDays(today, 10)),
  },
];

const dataset: PortalDataset = {
  profiles,
  operators,
  teams,
  creditors,
  wallets,
  goals: [...goals, ...previousGoals],
  payments,
  agreements,
  actions,
  imports,
};

const demoProfilesByRole: Record<PortalRole, PortalProfile> = {
  admin: profiles[0],
  gerente: profiles[1],
  financeiro: profiles[2],
  supervisor: profiles[3],
  operador: profiles.find((profile) => profile.perfil === "operador") as PortalProfile,
};

export function getMockPortalDataset() {
  return dataset;
}

export function getDemoProfileByRole(role?: string | null) {
  const resolvedRole = (role ?? "admin") as PortalRole;
  return demoProfilesByRole[resolvedRole] ?? demoProfilesByRole.admin;
}

export const demoCookieName = DEMO_ROLE_COOKIE;
