import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Download,
  Gauge,
  Layers3,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import type { PortalRole } from "@/types/portal";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const defaultItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
    description: "Resumo executivo da operação.",
  },
  {
    title: "Ranking",
    href: "/ranking",
    icon: Trophy,
    description: "Comparativo entre operadores.",
  },
  {
    title: "Equipes",
    href: "/equipes",
    icon: Building2,
    description: "Performance consolidada por time.",
  },
  {
    title: "Carteiras",
    href: "/carteiras",
    icon: Layers3,
    description: "Visão por carteira e credor.",
  },
];

const operatorItems: NavigationItem[] = [
  {
    title: "Meu painel",
    href: "/operador",
    icon: BarChart3,
    description: "Seu desempenho individual.",
  },
  {
    title: "Ranking",
    href: "/ranking",
    icon: Trophy,
    description: "Posição no ranking geral.",
  },
];

export function getNavigationByRole(role: PortalRole): NavigationItem[] {
  if (role === "operador") {
    return operatorItems;
  }

  const items = [...defaultItems];

  if (["admin", "gerente", "supervisor", "financeiro"].includes(role)) {
    items.push({
      title: "Importações",
      href: "/importacoes",
      icon: Download,
      description: "Carga de arquivos e histórico.",
    });
  }

  if (["admin", "gerente"].includes(role)) {
    items.push({
      title: "Administração",
      href: "/admin",
      icon: ShieldCheck,
      description: "Cadastros e governança.",
    });
  }

  if (["admin", "gerente", "financeiro"].includes(role)) {
    items.push({
      title: "Financeiro",
      href: "/dashboard?teamId=&operatorId=&walletId=",
      icon: BriefcaseBusiness,
      description: "Atalhos para visão financeira ampla.",
    });
  }

  return items;
}
