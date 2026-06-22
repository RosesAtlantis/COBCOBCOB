"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="dashboard-surface flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Algo saiu do esperado</h2>
        <p className="text-sm text-muted-foreground">
          Tente recarregar esta tela. Se o problema persistir, revise a integracao com o Supabase.
        </p>
      </div>
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
