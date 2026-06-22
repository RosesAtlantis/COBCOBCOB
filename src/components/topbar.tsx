"use client";

import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/permissions";
import type { PortalProfile } from "@/types/portal";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Visao geral da performance de cobranca.",
  },
  "/ranking": {
    title: "Ranking de operadores",
    subtitle: "Performance comparativa e atingimento de meta.",
  },
  "/equipes": {
    title: "Visao por equipe",
    subtitle: "Indicadores operacionais por time e supervisao.",
  },
  "/carteiras": {
    title: "Visao por carteira",
    subtitle: "Recebimento, acordos e recuperacao por carteira.",
  },
  "/clientes": {
    title: "Clientes",
    subtitle: "Consulta operacional, ficha do cliente, acordos e baixas.",
  },
  "/operador": {
    title: "Meu desempenho",
    subtitle: "Meta, ranking e evolucao individual no periodo.",
  },
  "/importacoes": {
    title: "Importacoes",
    subtitle: "Carga de arquivos, validacoes e auditoria.",
  },
  "/admin": {
    title: "Administracao",
    subtitle: "Cadastros mestres, perfis e configuracoes do portal.",
  },
};

function getCurrentPageContent(pathname: string) {
  if (pathname.startsWith("/admin/")) {
    return pageTitles["/admin"];
  }

  if (pathname.startsWith("/clientes/")) {
    return pageTitles["/clientes"];
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
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="flex min-h-18 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="border-border/80 bg-card lg:hidden"
            onClick={onOpenSidebar}
            type="button"
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Portal BKO
            </p>
            <p className="truncate text-lg font-semibold tracking-tight">{content.title}</p>
            <p className="truncate text-sm text-muted-foreground">{content.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {demoMode ? (
            <Badge
              variant="outline"
              className="hidden rounded-md border-border/80 bg-card px-2 py-0.5 text-[11px] sm:inline-flex"
            >
              Ambiente demo
            </Badge>
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{profile.nome}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <Badge className="hidden rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground sm:inline-flex">
            {roleLabels[profile.perfil]}
          </Badge>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="gap-2">
              <ShieldCheck className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
