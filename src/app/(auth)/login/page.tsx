import { redirect } from "next/navigation";
import { ChartNoAxesColumn, LockKeyhole, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getHomePathByRole } from "@/lib/permissions";

export default async function LoginPage() {
  const currentProfile = await getCurrentProfile();
  const currentUser = await getCurrentUser();
  const demoMode = !isSupabaseConfigured();

  if (currentProfile?.ativo) {
    redirect(getHomePathByRole(currentProfile.perfil));
  }

  if (currentUser && !currentProfile) {
    redirect("/acesso-negado?motivo=profile-ausente");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="dashboard-surface flex flex-col justify-between p-8 sm:p-10">
          <div className="space-y-6">
            <div className="inline-flex w-fit rounded-full border border-border bg-muted/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Portal BKO
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Acesso ao portal corporativo de cobranca e performance.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Ambiente interno para acompanhamento de arrecadacao, metas, ranking
                operacional, importacoes e governanca de dados com permissao por perfil.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border-border/70 bg-muted/20 shadow-none">
              <CardHeader className="pb-3">
                <ChartNoAxesColumn className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <CardTitle className="text-base">BI operacional</CardTitle>
                <p className="text-muted-foreground">
                  KPIs diarios, mensais e comparativos por operador, equipe e carteira.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-muted/20 shadow-none">
              <CardHeader className="pb-3">
                <ShieldCheck className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <CardTitle className="text-base">Governanca por perfil</CardTitle>
                <p className="text-muted-foreground">
                  Supabase Auth, RLS e escopo operacional aplicado por usuario.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-muted/20 shadow-none">
              <CardHeader className="pb-3">
                <LockKeyhole className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <CardTitle className="text-base">Acesso seguro</CardTitle>
                <p className="text-muted-foreground">
                  Login com e-mail e senha para uso interno do time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="dashboard-surface border-border/70">
          <CardHeader className="space-y-2 border-b border-border/70 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Acesso do usuario
            </p>
            <CardTitle className="text-2xl">Entrar no Portal BKO</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {demoMode
                ? "Ambiente pronto para demonstracao local controlada."
                : "Use o e-mail corporativo e a senha cadastrada no Supabase Auth."}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <LoginForm demoMode={demoMode} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
