import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const accessDeniedMessages = {
  "profile-ausente": {
    title: "Acesso bloqueado por falta de profile",
    description:
      "Seu usuario autenticado ainda nao possui cadastro na tabela profiles. Peca para um administrador criar seu acesso antes de tentar novamente.",
  },
  "profile-inativo": {
    title: "Acesso bloqueado por profile inativo",
    description:
      "Seu cadastro foi encontrado, mas esta marcado como inativo. Peca para um administrador revisar o campo ativo no profile.",
  },
  "profile-invalido": {
    title: "Acesso bloqueado por perfil invalido",
    description:
      "Seu cadastro existe, mas o campo perfil nao corresponde a um papel valido do Portal BKO.",
  },
  default: {
    title: "Acesso negado",
    description:
      "Nao foi possivel liberar o acesso a esta conta. Revise o cadastro do usuario no Supabase e tente novamente.",
  },
} as const;

interface AccessDeniedPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccessDeniedPage({
  searchParams,
}: AccessDeniedPageProps) {
  const params = await searchParams;
  const rawReason = params.motivo;
  const reason = Array.isArray(rawReason) ? rawReason[0] : rawReason;
  const content =
    (reason && reason in accessDeniedMessages
      ? accessDeniedMessages[reason as keyof typeof accessDeniedMessages]
      : null) ?? accessDeniedMessages.default;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <Card className="dashboard-surface w-full max-w-2xl border-border/70">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{content.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{content.description}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-3">
          <form action="/auth/signout" method="post">
            <Button type="submit">Sair desta conta</Button>
          </form>
          <a href="/login">
            <Button variant="outline" type="button">
              Ir para o login
            </Button>
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
