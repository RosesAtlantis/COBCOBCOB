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
import { formatDate, formatNumber } from "@/lib/format";
import type { ImportRecord } from "@/types/portal";

interface ImportReversalDialogProps {
  record: ImportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportReversalDialog({
  record,
  open,
  onOpenChange,
}: ImportReversalDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!record) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/import/${record.id}/reverter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo: reason }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel reverter a importacao.");
          return;
        }

        toast.success("Importacao revertida com sucesso.");
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
          <DialogTitle>Reverter importacao</DialogTitle>
          <DialogDescription>
            A reversao vai marcar os registros importados, recalcular baixas e acordos
            relacionados e registrar auditoria da operacao.
          </DialogDescription>
        </DialogHeader>

        {record ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
              <p className="font-medium">{record.nome_arquivo}</p>
              <div className="mt-2 grid gap-2 text-muted-foreground md:grid-cols-2">
                <p>Tipo: {record.tipo}</p>
                <p>Status: {record.status}</p>
                <p>Data: {formatDate(record.criado_em)}</p>
                <p>Linhas importadas: {formatNumber(record.linhas_importadas)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da reversao</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explique o motivo da reversao para a trilha de auditoria."
                className="min-h-28 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="rounded-lg"
                disabled={isPending || record.revertida}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirmar reversao
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
