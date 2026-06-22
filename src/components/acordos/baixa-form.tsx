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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import {
  getInstallmentStatusLabel,
  resolveAgreementTypeLabel,
} from "@/lib/clientes-utils";
import type { ClientAgreementRow } from "@/types/portal";

interface BaixaFormProps {
  clientId: string;
  agreement: ClientAgreementRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BaixaFormContentProps {
  clientId: string;
  agreement: ClientAgreementRow;
  onOpenChange: (open: boolean) => void;
}

function BaixaFormContent({
  clientId,
  agreement,
  onOpenChange,
}: BaixaFormContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const availableInstallments = agreement.parcelas.filter(
    (item) => !["pago", "cancelado"].includes(item.status),
  );
  const defaultInstallment = availableInstallments[0] ?? null;
  const [parcelId, setParcelId] = useState(defaultInstallment?.id ?? "");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paidValue, setPaidValue] = useState(
    defaultInstallment
      ? String(
          Math.max(
            defaultInstallment.valor_parcela - defaultInstallment.valor_pago,
            0,
          ),
        )
      : "",
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");

  const selectedInstallment =
    availableInstallments.find((item) => item.id === parcelId) ?? defaultInstallment;
  const remainingAmount = selectedInstallment
    ? Math.max(selectedInstallment.valor_parcela - selectedInstallment.valor_pago, 0)
    : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedInstallment) {
      toast.error("Selecione uma parcela valida para registrar a baixa.");
      return;
    }

    const numericValue = Number(paidValue);

    if (!paymentDate) {
      toast.error("Informe a data de pagamento.");
      return;
    }

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Informe um valor pago maior que zero.");
      return;
    }

    if (numericValue > remainingAmount) {
      toast.error("O valor pago nao pode ser maior que o saldo da parcela.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/acordos/${agreement.id}/baixas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId: clientId,
            parcelaId: parcelId,
            dataPagamento: paymentDate,
            valorPago: numericValue,
            formaPagamento: paymentMethod || null,
            observacao: note || null,
          }),
        });
        const payload = (await response.json()) as {
          message?: string;
        };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel registrar a baixa.");
          return;
        }

        toast.success("Baixa registrada com sucesso.");
        onOpenChange(false);
        router.refresh();
      })();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium">{agreement.contratoNumero}</p>
        <p className="mt-1 text-muted-foreground">
          Saldo atual do acordo: {formatCurrency(agreement.valorRestante)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="parcelId">Parcela</Label>
          <Select
            value={parcelId}
            onValueChange={(value) => {
              const nextParcelId = value ?? "";
              const nextInstallment =
                availableInstallments.find((item) => item.id === nextParcelId) ?? null;

              setParcelId(nextParcelId);
              setPaidValue(
                nextInstallment
                  ? String(
                      Math.max(
                        nextInstallment.valor_parcela - nextInstallment.valor_pago,
                        0,
                      ),
                    )
                  : "",
              );
            }}
          >
            <SelectTrigger
              id="parcelId"
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            >
              <SelectValue placeholder="Selecione a parcela" />
            </SelectTrigger>
            <SelectContent>
              {availableInstallments.map((installment) => (
                <SelectItem key={installment.id} value={installment.id}>
                  {`${installment.numero_parcela} - ${resolveAgreementTypeLabel(installment.tipo)} - ${getInstallmentStatusLabel(installment.status)} - ${formatCurrency(Math.max(installment.valor_parcela - installment.valor_pago, 0))}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentDate">Data de pagamento</Label>
          <Input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidValue">Valor pago</Label>
          <Input
            id="paidValue"
            type="number"
            min="0"
            step="0.01"
            value={paidValue}
            onChange={(event) => setPaidValue(event.target.value)}
            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
          />
          <p className="text-xs text-muted-foreground">
            Saldo da parcela: {formatCurrency(remainingAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Forma de pagamento</Label>
          <Input
            id="paymentMethod"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            placeholder="PIX, boleto, transferencia..."
            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="note">Observacao</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anote comprovante, ajuste operacional ou comentario da baixa."
            className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" className="rounded-lg" disabled={isPending || !selectedInstallment}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirmar baixa
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BaixaForm({
  clientId,
  agreement,
  open,
  onOpenChange,
}: BaixaFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dar baixa</DialogTitle>
          <DialogDescription>
            Registre o recebimento e atualize a parcela, o acordo e o historico de
            pagamentos do cliente.
          </DialogDescription>
        </DialogHeader>

        {agreement ? (
          <BaixaFormContent
            key={`${agreement.id}-${open ? "open" : "closed"}`}
            clientId={clientId}
            agreement={agreement}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
