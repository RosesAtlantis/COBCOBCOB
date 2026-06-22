"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signInWithEmailPassword } from "@/lib/auth-client";
import { getHomePathByRole } from "@/lib/permissions";
import type { PortalRole } from "@/types/portal";

const demoRoleOptions: Array<{ value: PortalRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "gerente", label: "Gerente" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operador", label: "Operador" },
  { value: "financeiro", label: "Financeiro" },
];

interface LoginFormProps {
  demoMode: boolean;
}

export function LoginForm({ demoMode }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoRole, setDemoRole] = useState<PortalRole>("admin");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDemoAccess() {
    setErrorMessage(null);

    const response = await fetch("/api/demo-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: demoRole }),
    });

    if (!response.ok) {
      setErrorMessage("Nao foi possivel iniciar o modo demonstracao.");
      return;
    }

    router.replace(getHomePathByRole(demoRole));
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (demoMode) {
      startTransition(() => {
        void handleDemoAccess();
      });
      return;
    }

    const result = await signInWithEmailPassword(email, password);

    if (result.error || !result.redirectTo) {
      setErrorMessage(
        result.error ?? "Nao foi possivel validar o acesso ao Portal BKO.",
      );
      return;
    }

    router.replace(result.redirectTo);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {demoMode ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="demo-role" className="text-sm font-medium">
              Perfil para testar
            </Label>
            <Select value={demoRole} onValueChange={(value) => setDemoRole(value as PortalRole)}>
              <SelectTrigger
                id="demo-role"
                className="h-11 rounded-lg border-border/70 bg-background shadow-none"
              >
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {demoRoleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert className="rounded-xl border-border/70 bg-muted/25">
            <UserRound className="size-4" />
            <AlertTitle>Modo demonstracao ativo</AlertTitle>
            <AlertDescription>
              O ambiente ainda nao esta conectado ao Supabase. O portal usa dados
              ficticios locais para voce validar fluxo, dashboard e permissoes.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nome@empresa.com.br"
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </>
      )}

      {errorMessage ? (
        <Alert variant="destructive" className="rounded-xl">
          <LockKeyhole className="size-4" />
          <AlertTitle>Acesso nao concluido</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="h-11 w-full rounded-lg" size="lg" type="submit" disabled={isPending}>
        {demoMode ? "Entrar no portal" : "Entrar com e-mail e senha"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
