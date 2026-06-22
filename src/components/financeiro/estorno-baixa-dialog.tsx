"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { getWriteOffStatusLabel, getWriteOffStatusVariant } from "@/lib/financeiro-utils";
import { Badge } from "@/components/ui/badge";
import type { WriteOffCenterRow } from "@/types/portal";

interface EstornoBaixaDialogProps {
  writeOff: WriteOffCenterRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstornoBaixaDialog({
  writeOff,
  open,
  onOpenChange,
}: EstornoBaixaDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!writeOff) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/baixas/${writeOff.id}/estornar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acordoId: writeOff.agreementId,
            clienteId: writeOff.clientId,
            motivoEstorno: reason || null,
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel estornar a baixa.");
          return;
        }

        toast.success("Baixa estornada com sucesso.");
        onOpenChange(false);
        router.refresh();
      })();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setReason("");
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Estornar baixa</DialogTitle>
          <DialogDescription>
            O registro sera preservado no historico, marcado como estornado e refletido
            nas parcelas, no acordo e na auditoria.
          </DialogDescription>
        </DialogHeader>

        {writeOff ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{writeOff.cliente}</p>
                <Badge variant={getWriteOffStatusVariant(writeOff.estornada)}>
                  {getWriteOffStatusLabel(writeOff.estornada)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-muted-foreground md:grid-cols-2">
                <p>Contrato: {writeOff.contrato}</p>
                <p>Parcela: {writeOff.numeroParcela || "-"}</p>
                <p>Pagamento: {formatDate(writeOff.dataPagamento)}</p>
                <p>Valor: {formatCurrency(writeOff.valorPago)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do estorno</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explique o motivo do estorno para a trilha de auditoria."
                className="min-h-28 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="rounded-lg"
                disabled={isPending || writeOff.estornada}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirmar estorno
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
