"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getRevenueTypeLabel,
  getRevenueTypeOriginLabel,
  resolveAgreementTypeLabel,
} from "@/lib/clientes-utils";
import type { InstallmentCenterRow, RevenueType } from "@/types/portal";

interface ClassificacaoParcelaFormProps {
  installment: InstallmentCenterRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassificacaoParcelaForm({
  installment,
  open,
  onOpenChange,
}: ClassificacaoParcelaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tipoReceita, setTipoReceita] = useState<RevenueType | null>(null);
  const resolvedTipoReceita =
    tipoReceita ?? (installment?.tipoReceita === "COLCHAO" ? "COLCHAO" : "NOVO");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!installment) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(
          `/api/parcelas/${installment.id}/classificacao`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipoReceita: resolvedTipoReceita,
              clientId: installment.clientId,
            }),
          },
        );
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(
            payload.message ?? "Nao foi possivel alterar a classificacao.",
          );
          return;
        }

        toast.success(payload.message ?? "Classificacao atualizada.");
        onOpenChange(false);
        router.refresh();
      })();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Alterar classificacao</DialogTitle>
          <DialogDescription>
            Ajuste manualmente a classificacao da parcela. O Portal marca a
            origem como manual e sincroniza as baixas ja vinculadas.
          </DialogDescription>
        </DialogHeader>

        {installment ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="mt-1 font-semibold">{installment.cliente}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {installment.contrato}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Parcela</p>
                <p className="mt-1 font-semibold">
                  {installment.numeroParcela} -{" "}
                  {resolveAgreementTypeLabel(installment.tipo)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vencimento {formatDate(installment.vencimento)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-sm text-muted-foreground">Valor da parcela</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(installment.valorParcela)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-sm text-muted-foreground">Atual</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {getRevenueTypeLabel(installment.tipoReceita)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getRevenueTypeOriginLabel(installment.tipoReceitaOrigem)}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-sm text-muted-foreground">Operador</p>
                <p className="mt-1 font-semibold">{installment.operador}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoReceita">Nova classificacao</Label>
              <Select
                value={resolvedTipoReceita}
                onValueChange={(value) => setTipoReceita(value as RevenueType)}
              >
                <SelectTrigger
                  id="tipoReceita"
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOVO">NOVO</SelectItem>
                  <SelectItem value="COLCHAO">COLCHAO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" className="rounded-lg" disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar classificacao
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
