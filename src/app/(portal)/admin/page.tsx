import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureRole, requireActiveProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

const sections = [
  {
    href: "/admin/usuarios",
    title: "Usuarios",
    description: "Perfis, papeis de acesso e status de atividade.",
  },
  {
    href: "/operadores",
    title: "Operadores",
    description: "Base operacional e vinculacao por equipe.",
  },
  {
    href: "/equipes",
    title: "Equipes",
    description: "Supervisao e organizacao dos times.",
  },
  {
    href: "/carteiras",
    title: "Carteiras",
    description: "Carteiras, credores e visibilidade financeira.",
  },
  {
    href: "/credores",
    title: "Credores",
    description: "Cadastro mestre dos credores atendidos.",
  },
  {
    href: "/clientes",
    title: "Clientes",
    description: "Casos manuais, ficha operacional e contratos vinculados.",
  },
  {
    href: "/contratos",
    title: "Contratos",
    description: "Consulta central da base contratual e atalho para as fichas.",
  },
  {
    href: "/metas",
    title: "Metas",
    description: "Metas mensais por operador, equipe e carteira.",
  },
  {
    href: "/admin/importacoes",
    title: "Importacoes",
    description: "Historico de cargas processadas.",
  },
  {
    href: "/admin/configuracoes",
    title: "Configuracoes",
    description: "Checklist tecnico para ambiente e seguranca.",
  },
];

export default async function AdminIndexPage() {
  const profile = await requireActiveProfile();

  if (!["admin", "gerente"].includes(profile.perfil)) {
    return (
      <EmptyState
        title="Area administrativa restrita"
        description="Somente Admin e Gerente podem navegar pelas secoes administrativas do Portal BKO."
        actionHref="/dashboard"
        actionLabel="Voltar ao dashboard"
      />
    );
  }

  ensureRole(profile, ["admin", "gerente"]);

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <Card key={section.href} className="dashboard-surface">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </CardHeader>
          <CardContent>
            <Link
              href={section.href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Abrir cadastro
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
