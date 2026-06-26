import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Banknote,
  Building2,
  FileSpreadsheet,
  Gauge,
  History,
  Layers3,
  ListTodo,
  Settings2,
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
};

const rankingItem: NavigationItem = {
  title: "Ranking",
  href: "/ranking",
  icon: Trophy,
};

const operatorItem: NavigationItem = {
  title: "Meu desempenho",
  href: "/operador",
  icon: BarChart3,
};

const teamsItem: NavigationItem = {
  title: "Equipes",
  href: "/equipes",
  icon: Building2,
};

const walletsItem: NavigationItem = {
  title: "Carteiras",
  href: "/carteiras",
  icon: Layers3,
};

const clientsItem: NavigationItem = {
  title: "Clientes",
  href: "/clientes",
  icon: Users,
};

const agreementsItem: NavigationItem = {
  title: "Acordos",
  href: "/acordos",
  icon: ListTodo,
  matchPrefixes: ["/acordos"],
};

const installmentsItem: NavigationItem = {
  title: "Parcelas",
  href: "/parcelas",
  icon: ListTodo,
  matchPrefixes: ["/parcelas"],
};

const writeOffsItem: NavigationItem = {
  title: "Baixas",
  href: "/baixas",
  icon: Banknote,
  matchPrefixes: ["/baixas"],
};

const importsItem: NavigationItem = {
  title: "Importacoes",
  href: "/importacoes",
  icon: FileSpreadsheet,
};

const auditItem: NavigationItem = {
  title: "Auditoria",
  href: "/auditoria",
  icon: History,
  matchPrefixes: ["/auditoria"],
};

const adminItem: NavigationItem = {
  title: "Administracao",
  href: "/admin",
  icon: Settings2,
  matchPrefixes: ["/admin"],
};

const adminOperatorsItem: NavigationItem = {
  title: "Operadores",
  href: "/operadores",
  icon: UserCog,
  matchPrefixes: ["/operadores"],
};

const adminGoalsItem: NavigationItem = {
  title: "Metas",
  href: "/metas",
  icon: Target,
  matchPrefixes: ["/metas"],
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
  {
    title: "Operacao",
    items: [clientsItem, agreementsItem, installmentsItem],
  },
];

const supervisorNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [dashboardItem, rankingItem],
  },
  {
    title: "Operacao",
    items: [clientsItem, agreementsItem, installmentsItem, writeOffsItem],
  },
  {
    title: "Cadastros",
    items: [walletsItem, adminOperatorsItem, teamsItem],
  },
  {
    title: "Dados",
    items: [importsItem, auditItem],
  },
];

const financeNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [dashboardItem, rankingItem],
  },
  {
    title: "Operacao",
    items: [clientsItem, agreementsItem, installmentsItem, writeOffsItem],
  },
  {
    title: "Cadastros",
    items: [walletsItem, adminGoalsItem],
  },
  {
    title: "Dados",
    items: [importsItem, auditItem],
  },
];

const managementNavigation: NavigationGroup[] = [
  {
    title: "Visao Geral",
    items: [dashboardItem, rankingItem],
  },
  {
    title: "Operacao",
    items: [clientsItem, agreementsItem, installmentsItem, writeOffsItem],
  },
  {
    title: "Cadastros",
    items: [
      walletsItem,
      adminItem,
    ],
  },
  {
    title: "Dados",
    items: [importsItem, auditItem],
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
