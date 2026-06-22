import { redirect } from "next/navigation";
import { BarChart3, ShieldCheck, UploadCloud } from "lucide-react";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,193,73,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(72,146,255,0.12),transparent_24%)]" />
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="dashboard-surface flex flex-col justify-between p-8 sm:p-10">
          <div className="space-y-5">
            <div className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              Portal BKO
            </div>
            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Central de Performance e Indicadores de Cobranca
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Monitore arrecadacao, metas, ranking operacional e historico financeiro
                em um unico portal interno, com visao por perfil e seguranca por RLS.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border-border/70 bg-card/50">
              <CardHeader className="pb-2">
                <BarChart3 className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <CardTitle className="text-base">Dashboards executivos</CardTitle>
                <p className="text-muted-foreground">
                  KPIs diarios, mensais e comparativos por operador, equipe e carteira.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/50">
              <CardHeader className="pb-2">
                <UploadCloud className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <CardTitle className="text-base">Importacao guiada</CardTitle>
                <p className="text-muted-foreground">
                  Carga de CSV e XLSX com validacao, historico e relatorio de erros.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/50">
              <CardHeader className="pb-2">
                <ShieldCheck className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <CardTitle className="text-base">Seguranca real</CardTitle>
                <p className="text-muted-foreground">
                  Auth Supabase, RLS e bloqueio de acesso fora do escopo do usuario.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="dashboard-surface border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Entrar no Portal BKO</CardTitle>
            <p className="text-sm text-muted-foreground">
              {demoMode
                ? "Ambiente pronto para demonstração local."
                : "Use o e-mail corporativo e a senha cadastrada no Supabase Auth."}
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm demoMode={demoMode} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
