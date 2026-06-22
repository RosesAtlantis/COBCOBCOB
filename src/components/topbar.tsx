"use client";

import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/permissions";
import type { PortalProfile } from "@/types/portal";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard geral",
    subtitle: "Visao consolidada da operacao de cobranca.",
  },
  "/ranking": {
    title: "Ranking de operadores",
    subtitle: "Performance comparativa com filtros globais.",
  },
  "/equipes": {
    title: "Visao por equipe",
    subtitle: "Metas, lideres e evolucao por time.",
  },
  "/carteiras": {
    title: "Visao por carteira",
    subtitle: "Arrecadacao, acordos e recuperacao por carteira.",
  },
  "/operador": {
    title: "Meu desempenho",
    subtitle: "Meta, ranking e comparativo com sua equipe.",
  },
  "/importacoes": {
    title: "Importacoes",
    subtitle: "Carga de arquivos com historico e validacoes.",
  },
  "/admin": {
    title: "Administracao",
    subtitle: "Cadastros, governanca e configuracoes do portal.",
  },
};

function getCurrentPageContent(pathname: string) {
  if (pathname.startsWith("/admin/")) {
    return pageTitles["/admin"];
  }

  return pageTitles[pathname] ?? pageTitles["/dashboard"];
}

interface TopbarProps {
  profile: PortalProfile;
  demoMode: boolean;
  onOpenSidebar: () => void;
}

export function Topbar({ profile, demoMode, onOpenSidebar }: TopbarProps) {
  const pathname = usePathname();
  const content = getCurrentPageContent(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/72 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onOpenSidebar}
            type="button"
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight">
              {content.title}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {content.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {demoMode ? (
            <Badge variant="outline" className="hidden border-primary/35 text-primary sm:inline-flex">
              Modo demonstracao
            </Badge>
          ) : null}
          <Badge className="hidden bg-secondary text-secondary-foreground sm:inline-flex">
            {roleLabels[profile.perfil]}
          </Badge>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              <ShieldCheck className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
