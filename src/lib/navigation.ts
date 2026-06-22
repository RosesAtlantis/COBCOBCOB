import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileSpreadsheet,
  FolderClock,
  Gauge,
  Landmark,
  Layers3,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";

import type { PortalRole } from "@/types/portal";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  matchPrefixes?: string[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const dashboardItem: NavigationItem = {
  title: "Dashboard",
  href: "/dashboard",
  icon: Gauge,
  description: "KPIs consolidados da operacao.",
};

const rankingItem: NavigationItem = {
  title: "Ranking",
  href: "/ranking",
  icon: Trophy,
  description: "Comparativo de performance por operador.",
};

const operatorItem: NavigationItem = {
  title: "Meu desempenho",
  href: "/operador",
  icon: BarChart3,
  description: "Visao individual com meta e evolucao.",
};

const teamsItem: NavigationItem = {
  title: "Equipes",
  href: "/equipes",
  icon: Building2,
  description: "Leitura operacional por time.",
};

const walletsItem: NavigationItem = {
  title: "Carteiras",
  href: "/carteiras",
  icon: Layers3,
  description: "Carteiras, credores e recuperacao.",
};

const importsItem: NavigationItem = {
  title: "Importacoes",
  href: "/importacoes",
  icon: FileSpreadsheet,
  description: "Entrada de arquivos e validacoes.",
};

const adminHomeItem: NavigationItem = {
  title: "Painel administrativo",
  href: "/admin",
  icon: ShieldCheck,
  description: "Governanca e cadastros do portal.",
  matchPrefixes: ["/admin"],
};

const adminUsersItem: NavigationItem = {
  title: "Usuarios",
  href: "/admin/usuarios",
  icon: Users,
  description: "Perfis autenticados e papeis.",
};

const adminOperatorsItem: NavigationItem = {
  title: "Operadores",
  href: "/admin/operadores",
  icon: UserCog,
  description: "Base operacional e vinculacoes.",
};

const adminCreditorsItem: NavigationItem = {
  title: "Credores",
  href: "/admin/credores",
  icon: Landmark,
  description: "Cadastro mestre de credores.",
};

const adminGoalsItem: NavigationItem = {
  title: "Metas",
  href: "/admin/metas",
  icon: Target,
  description: "Metas mensais e direcionadores.",
};

const adminImportsItem: NavigationItem = {
  title: "Historico de importacoes",
  href: "/admin/importacoes",
  icon: FolderClock,
  description: "Cargas realizadas e auditoria.",
};

const adminSettingsItem: NavigationItem = {
  title: "Configuracoes",
  href: "/admin/configuracoes",
  icon: Settings2,
  description: "Checklist tecnico e ambiente.",
};

function cloneItem(item: NavigationItem): NavigationItem {
  return {
    ...item,
    matchPrefixes: item.matchPrefixes ? [...item.matchPrefixes] : undefined,
  };
}

function cloneGroup(group: NavigationGroup): NavigationGroup {
  return {
    title: group.title,
    items: group.items.map(cloneItem),
  };
}

const operatorNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [operatorItem, rankingItem],
  },
];

const supervisorNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [dashboardItem, rankingItem],
  },
  {
    title: "Operacao",
    items: [teamsItem, walletsItem],
  },
  {
    title: "Dados",
    items: [importsItem],
  },
];

const financeNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [dashboardItem, rankingItem],
  },
  {
    title: "Financeiro",
    items: [
      {
        title: "Carteiras",
        href: "/carteiras",
        icon: BriefcaseBusiness,
        description: "Recebimento, acordos e recuperacao.",
      },
    ],
  },
  {
    title: "Dados",
    items: [importsItem],
  },
];

const managementNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [dashboardItem, rankingItem],
  },
  {
    title: "Operacao",
    items: [teamsItem, walletsItem],
  },
  {
    title: "Dados",
    items: [importsItem],
  },
  {
    title: "Administracao",
    items: [
      adminHomeItem,
      adminUsersItem,
      adminOperatorsItem,
      adminCreditorsItem,
      adminGoalsItem,
      adminImportsItem,
      adminSettingsItem,
    ],
  },
];

export function getNavigationByRole(role: PortalRole): NavigationGroup[] {
  switch (role) {
    case "operador":
      return operatorNavigation.map(cloneGroup);
    case "supervisor":
      return supervisorNavigation.map(cloneGroup);
    case "financeiro":
      return financeNavigation.map(cloneGroup);
    case "admin":
    case "gerente":
      return managementNavigation.map(cloneGroup);
    default:
      return supervisorNavigation.map(cloneGroup);
  }
}
