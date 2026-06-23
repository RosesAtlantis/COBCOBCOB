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
  formatDocument,
  getInstallmentStatusLabel,
  getRevenueTypeLabel,
  resolveAgreementTypeLabel,
  roundCurrency,
} from "@/lib/clientes-utils";
import type { ClientAgreementRow } from "@/types/portal";

interface BaixaFormProps {
  clientId: string;
  clientName?: string;
  agreement: ClientAgreementRow | null;
  initialParcelId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BaixaFormContentProps {
  clientId: string;
  clientName?: string;
  agreement: ClientAgreementRow;
  initialParcelId?: string | null;
  onOpenChange: (open: boolean) => void;
}

function inferRevenueType(agreement: ClientAgreementRow, parcelId: string) {
  const installment = agreement.parcelas.find((item) => item.id === parcelId) ?? null;

  if (!installment) {
    return "-";
  }

  if (installment.tipo_receita) {
    return getRevenueTypeLabel(installment.tipo_receita);
  }

  if (installment.tipo === "avista" || installment.tipo === "entrada" || installment.numero_parcela <= 1) {
    return "Novo";
  }

  return "Colchao";
}

function BaixaFormContent({
  clientId,
  clientName,
  agreement,
  initialParcelId,
  onOpenChange,
}: BaixaFormContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const availableInstallments = agreement.parcelas.filter(
    (item) => !["pago", "cancelado"].includes(item.status),
  );
  const defaultInstallment =
    availableInstallments.find((item) => item.id === initialParcelId) ??
    availableInstallments[0] ??
    null;
  const [parcelId, setParcelId] = useState(defaultInstallment?.id ?? "");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
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
  const [percentualHonorarios, setPercentualHonorarios] = useState(
    defaultInstallment?.percentual_honorarios !== null &&
      defaultInstallment?.percentual_honorarios !== undefined
      ? String(defaultInstallment.percentual_honorarios)
      : agreement.percentual_honorarios !== null && agreement.percentual_honorarios !== undefined
        ? String(agreement.percentual_honorarios)
        : "",
  );
  const [confirmOverpayment, setConfirmOverpayment] = useState(false);

  const selectedInstallment =
    availableInstallments.find((item) => item.id === parcelId) ?? defaultInstallment;
  const remainingAmount = selectedInstallment
    ? Math.max(selectedInstallment.valor_parcela - selectedInstallment.valor_pago, 0)
    : 0;
  const numericValue = Number(paidValue);
  const feePercent = percentualHonorarios.trim()
    ? roundCurrency(Number(percentualHonorarios))
    : roundCurrency(
        selectedInstallment?.percentual_honorarios ??
          agreement.percentual_honorarios ??
          0,
      );
  const safePaidValue = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  const projectedHonorarios = roundCurrency((safePaidValue * feePercent) / 100);
  const projectedOfficeValue = projectedHonorarios;
  const projectedTransferValue = roundCurrency(Math.max(safePaidValue - projectedOfficeValue, 0));
  const revenueTypeLabel = selectedInstallment
    ? inferRevenueType(agreement, selectedInstallment.id)
    : "-";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedInstallment) {
      toast.error("Selecione uma parcela valida para registrar a baixa.");
      return;
    }

    if (!paymentDate) {
      toast.error("Informe a data de pagamento.");
      return;
    }

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Informe um valor pago maior que zero.");
      return;
    }

    if (numericValue > remainingAmount && !confirmOverpayment) {
      toast.error("Confirme explicitamente quando o valor pago ultrapassar o saldo.");
      return;
    }

    if (feePercent < 0 || feePercent > 100) {
      toast.error("O percentual de honorarios deve ficar entre 0 e 100.");
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
            percentualHonorarios: percentualHonorarios.trim() ? feePercent : null,
            confirmarAcimaSaldo: confirmOverpayment || undefined,
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

  if (!selectedInstallment) {
    return (
      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        Todas as parcelas elegiveis deste acordo ja foram quitadas ou canceladas.
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 xl:col-span-2">
          <p className="text-sm text-muted-foreground">Cliente</p>
          <p className="mt-1 text-base font-semibold">{clientName ?? "Cliente vinculado"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDocument(agreement.cpf_cnpj)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Contrato</p>
          <p className="mt-1 text-base font-semibold">{agreement.contratoNumero}</p>
          <p className="mt-1 text-sm text-muted-foreground">{agreement.carteira}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Acordo</p>
          <p className="mt-1 text-base font-semibold">{agreement.id.slice(0, 8)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo total {formatCurrency(agreement.valorRestante)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-2">
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
              setPercentualHonorarios(
                nextInstallment?.percentual_honorarios !== null &&
                  nextInstallment?.percentual_honorarios !== undefined
                  ? String(nextInstallment.percentual_honorarios)
                  : agreement.percentual_honorarios !== null && agreement.percentual_honorarios !== undefined
                    ? String(agreement.percentual_honorarios)
                    : "",
              );
              setConfirmOverpayment(false);
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
                  {`${installment.numero_parcela} - ${resolveAgreementTypeLabel(installment.tipo)} - ${getInstallmentStatusLabel(installment.status)} - saldo ${formatCurrency(Math.max(installment.valor_parcela - installment.valor_pago, 0))}`}
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
            onChange={(event) => {
              const nextValue = event.target.value;
              setPaidValue(nextValue);

              if (Number(nextValue) <= remainingAmount) {
                setConfirmOverpayment(false);
              }
            }}
            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
          />
          <p className="text-xs text-muted-foreground">
            Saldo da parcela: {formatCurrency(remainingAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="percentualHonorarios">Honorarios (%)</Label>
          <Input
            id="percentualHonorarios"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={percentualHonorarios}
            onChange={(event) => setPercentualHonorarios(event.target.value)}
            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
          />
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
            placeholder="Comprovante, ajuste operacional, motivo de diferenca ou contexto da baixa."
            className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Tipo da parcela</p>
          <p className="mt-1 text-base font-semibold">
            {resolveAgreementTypeLabel(selectedInstallment.tipo)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Parcela {selectedInstallment.numero_parcela}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Vencimento e status</p>
          <p className="mt-1 text-base font-semibold">{selectedInstallment.data_vencimento}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getInstallmentStatusLabel(selectedInstallment.status)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Operador responsavel</p>
          <p className="mt-1 text-base font-semibold">{agreement.operador}</p>
          <p className="mt-1 text-sm text-muted-foreground">{agreement.equipe}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Receita</p>
          <p className="mt-1 text-base font-semibold">{revenueTypeLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">Herdada da parcela</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <p className="text-sm text-muted-foreground">Honorarios calculados</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(projectedHonorarios)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <p className="text-sm text-muted-foreground">Valor do escritorio</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(projectedOfficeValue)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <p className="text-sm text-muted-foreground">Valor repassado</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(projectedTransferValue)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <p className="text-sm text-muted-foreground">Saldo restante</p>
          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(Math.max(remainingAmount - safePaidValue, 0))}
          </p>
        </div>
      </div>

      {safePaidValue > remainingAmount ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">
                Valor acima do saldo da parcela
              </p>
              <p className="text-sm text-destructive/80">
                Confirme explicitamente se esta baixa precisa exceder o saldo atual.
              </p>
            </div>
            <Button
              type="button"
              variant={confirmOverpayment ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setConfirmOverpayment((current) => !current)}
            >
              {confirmOverpayment ? "Confirmacao ativa" : "Permitir valor acima do saldo"}
            </Button>
          </div>
        </div>
      ) : null}

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
  clientName,
  agreement,
  initialParcelId,
  open,
  onOpenChange,
}: BaixaFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Dar baixa</DialogTitle>
          <DialogDescription>
            Registre o recebimento com conferencia de saldo, receita e honorarios antes de
            atualizar a parcela e o historico oficial de baixas.
          </DialogDescription>
        </DialogHeader>

        {agreement ? (
          <BaixaFormContent
            key={`${agreement.id}-${initialParcelId ?? "all"}-${open ? "open" : "closed"}`}
            clientId={clientId}
            clientName={clientName}
            agreement={agreement}
            initialParcelId={initialParcelId}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
