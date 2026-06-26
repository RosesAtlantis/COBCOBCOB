"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatCurrency, formatDate } from "@/lib/format";
import { formatCurrencyInputValue } from "@/lib/formatters";
import { maskCurrencyInput } from "@/lib/masks";
import {
  formatDocument,
  getAgreementStatusLabel,
  getAgreementStatusVariant,
  getInstallmentStatusLabel,
  getInstallmentStatusVariant,
  getRevenueTypeOriginLabel,
  resolveAgreementTypeLabel,
  roundCurrency,
} from "@/lib/clientes-utils";
import { parseCurrencyBR, parsePercent } from "@/lib/validators";
import type { AgreementInstallment, ClientAgreementRow, FilterOption } from "@/types/portal";

interface BaixaFormProps {
  clientId: string;
  clientName?: string;
  agreement: ClientAgreementRow | null;
  wallets: FilterOption[];
  operators: FilterOption[];
  initialParcelId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BaixaFormContentProps {
  clientId: string;
  clientName?: string;
  agreement: ClientAgreementRow;
  wallets: FilterOption[];
  operators: FilterOption[];
  initialParcelId?: string | null;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodOptions: FilterOption[] = [
  { value: "PIX", label: "PIX" },
  { value: "Boleto", label: "Boleto" },
  { value: "Transferencia", label: "Transferencia" },
  { value: "Cartao", label: "Cartao" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "Debito em conta", label: "Debito em conta" },
  { value: "Ajuste interno", label: "Ajuste interno" },
];

function inferRevenueTypeCode(agreement: ClientAgreementRow, parcelId: string) {
  const installment = agreement.parcelas.find((item) => item.id === parcelId) ?? null;

  if (!installment) {
    return "NOVO";
  }

  if (installment.tipo_receita === "COLCHAO" || installment.tipo_receita === "NOVO") {
    return installment.tipo_receita;
  }

  if (
    installment.tipo === "avista" ||
    installment.tipo === "entrada" ||
    installment.numero_parcela <= 1
  ) {
    return "NOVO";
  }

  return "COLCHAO";
}

function inferRevenueTypeOrigin(agreement: ClientAgreementRow, parcelId: string) {
  const installment = agreement.parcelas.find((item) => item.id === parcelId) ?? null;

  if (!installment) {
    return "Automatico";
  }

  return getRevenueTypeOriginLabel(
    installment.tipo_receita_origem ??
      (installment.tipo_receita ? "manual" : "automatico"),
  );
}

function resolveInitialWalletId(
  agreement: ClientAgreementRow,
  wallets: FilterOption[],
) {
  if (
    agreement.carteira_id &&
    wallets.some((wallet) => wallet.value === agreement.carteira_id)
  ) {
    return agreement.carteira_id;
  }

  return wallets[0]?.value ?? "";
}

function resolveSelectValue(
  options: FilterOption[],
  value: string | null | undefined,
) {
  return value && options.some((item) => item.value === value)
    ? value
    : null;
}

function sanitizeText(
  value: string | null | undefined,
  fallback = "-",
) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  if (["none", "null", "undefined", "__empty__"].includes(trimmed.toLowerCase())) {
    return fallback;
  }

  return trimmed;
}

function buildInstallmentTitle(installment: AgreementInstallment) {
  if (installment.tipo === "entrada") {
    return "Entrada";
  }

  if (installment.tipo === "avista") {
    return "A vista";
  }

  return `Parcela ${installment.numero_parcela}`;
}

function buildInstallmentFriendlyLabel(
  agreement: ClientAgreementRow,
  installment: AgreementInstallment,
) {
  const currentBalance = Math.max(
    installment.valor_parcela - installment.valor_pago,
    0,
  );

  return `${buildInstallmentTitle(installment)} - Venc. ${formatDate(installment.data_vencimento)} - ${formatCurrency(currentBalance)} - ${inferRevenueTypeCode(agreement, installment.id)}`;
}

function resolveInitialOperatorId(
  agreement: ClientAgreementRow,
  installment: AgreementInstallment | null,
  operators: FilterOption[],
) {
  const candidates = [installment?.operador_id, agreement.operador_id];

  return (
    candidates.find(
      (candidate) =>
        candidate && operators.some((operator) => operator.value === candidate),
    ) ?? ""
  );
}

function getRevenueBadgeVariant(type: "NOVO" | "COLCHAO") {
  return type === "COLCHAO" ? "secondary" : "default";
}

function ReadonlyValue({
  value,
  align = "left",
}: {
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-h-11 items-center rounded-lg border border-border/70 bg-muted/15 px-3 text-sm ${
        align === "right" ? "justify-end font-mono whitespace-nowrap" : "justify-start"
      }`}
    >
      <span className="block min-w-0 truncate">{value}</span>
    </div>
  );
}

function CompactField({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className={align === "right" ? "text-right" : "text-left"}>{value}</div>
    </div>
  );
}

function BaixaFormContent({
  clientId,
  clientName,
  agreement,
  wallets,
  operators,
  initialParcelId,
  onOpenChange,
}: BaixaFormContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [parcelId, setParcelId] = useState(() => {
    const availableInstallments = agreement.parcelas.filter(
      (item) => !["pago", "cancelado"].includes(item.status),
    );

    return (
      availableInstallments.find((item) => item.id === initialParcelId)?.id ??
      availableInstallments[0]?.id ??
      ""
    );
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidValue, setPaidValue] = useState(() => {
    const installment =
      agreement.parcelas.find((item) => item.id === initialParcelId) ??
      agreement.parcelas.find((item) => !["pago", "cancelado"].includes(item.status)) ??
      null;

    return installment
      ? formatCurrencyInputValue(
          Math.max(installment.valor_parcela - installment.valor_pago, 0),
        )
      : "";
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");
  const [percentualHonorarios, setPercentualHonorarios] = useState(() => {
    const installment =
      agreement.parcelas.find((item) => item.id === initialParcelId) ??
      agreement.parcelas.find((item) => !["pago", "cancelado"].includes(item.status)) ??
      null;

    if (
      installment?.percentual_honorarios !== null &&
      installment?.percentual_honorarios !== undefined
    ) {
      return String(installment.percentual_honorarios);
    }

    return agreement.percentual_honorarios !== null &&
      agreement.percentual_honorarios !== undefined
      ? String(agreement.percentual_honorarios)
      : "";
  });
  const initialInstallment =
    agreement.parcelas.find((item) => item.id === initialParcelId) ??
    agreement.parcelas.find((item) => !["pago", "cancelado"].includes(item.status)) ??
    null;
  const [operatorId, setOperatorId] = useState(() =>
    resolveInitialOperatorId(agreement, initialInstallment, operators),
  );
  const [showParcelDetails, setShowParcelDetails] = useState(false);
  const [confirmOverpayment, setConfirmOverpayment] = useState(false);
  const [contractNumber, setContractNumber] = useState(agreement.contratoNumero ?? "");
  const [contractWalletId, setContractWalletId] = useState(
    resolveInitialWalletId(agreement, wallets),
  );
  const [contractOpenValue, setContractOpenValue] = useState(
    formatCurrencyInputValue(Math.max(agreement.valorRestante, 0)),
  );

  const availableInstallments = agreement.parcelas.filter(
    (item) => !["pago", "cancelado"].includes(item.status),
  );
  const selectedInstallment =
    availableInstallments.find((item) => item.id === parcelId) ??
    availableInstallments[0] ??
    null;
  const requiresContractCreation = !agreement.contrato_id;
  const remainingAmount = selectedInstallment
    ? Math.max(selectedInstallment.valor_parcela - selectedInstallment.valor_pago, 0)
    : 0;
  const numericValue = parseCurrencyBR(paidValue);
  const parsedFeePercent = percentualHonorarios.trim()
    ? parsePercent(percentualHonorarios)
    : null;
  const feePercent = percentualHonorarios.trim()
    ? parsedFeePercent ?? Number.NaN
    : roundCurrency(
        selectedInstallment?.percentual_honorarios ??
          agreement.percentual_honorarios ??
          0,
      );
  const safePaidValue = numericValue !== null && numericValue > 0 ? numericValue : 0;
  const projectedHonorarios = roundCurrency((safePaidValue * feePercent) / 100);
  const projectedOfficeValue = projectedHonorarios;
  const revenueTypeCode = selectedInstallment
    ? inferRevenueTypeCode(agreement, selectedInstallment.id)
    : "NOVO";
  const revenueTypeOriginLabel = selectedInstallment
    ? inferRevenueTypeOrigin(agreement, selectedInstallment.id)
    : "Automatico";
  const parsedContractOpenValue = parseCurrencyBR(contractOpenValue);

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

    if (numericValue === null || numericValue <= 0) {
      toast.error("Informe um valor pago maior que zero.");
      return;
    }

    if (numericValue > remainingAmount && !confirmOverpayment) {
      toast.error("Confirme explicitamente quando o valor pago ultrapassar o saldo.");
      return;
    }

    if (
      percentualHonorarios.trim() &&
      (parsedFeePercent === null || feePercent < 0 || feePercent > 100)
    ) {
      toast.error("O percentual de honorarios deve ficar entre 0 e 100.");
      return;
    }

    if (!paymentMethod.trim()) {
      toast.error("Informe a forma de pagamento.");
      return;
    }

    if (requiresContractCreation) {
      if (!contractNumber.trim()) {
        toast.error("Informe o numero do contrato para concluir a baixa.");
        return;
      }

      if (!contractWalletId) {
        toast.error("Selecione a carteira do novo contrato.");
        return;
      }

      if (parsedContractOpenValue === null || parsedContractOpenValue <= 0) {
        toast.error("Informe um valor em aberto valido para o novo contrato.");
        return;
      }
    }

    const requestBody = {
      cliente_id: clientId,
      parcela_id: selectedInstallment.id,
      data_pagamento: paymentDate,
      valor_pago: numericValue,
      operador_id: operatorId || null,
      percentual_honorarios: percentualHonorarios.trim() ? feePercent : null,
      confirmar_acima_saldo: confirmOverpayment,
      forma_pagamento: paymentMethod,
      observacao: note.trim() || null,
      criar_contrato_agora: requiresContractCreation,
      novo_contrato: requiresContractCreation
        ? {
            numero_contrato: contractNumber.trim(),
            carteira_id: contractWalletId,
            valor_em_aberto: parsedContractOpenValue,
            operador_id: operatorId || null,
          }
        : null,
    };

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/acordos/${agreement.id}/baixas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const payload = (await response.json()) as {
          message?: string;
        };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel registrar a baixa.");
          return;
        }

        toast.success(payload.message ?? "Baixa registrada com sucesso.");
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
    <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-6">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border/70 bg-muted/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <CompactField
                label="Cliente"
                value={
                  <p className="truncate text-sm font-semibold">
                    {sanitizeText(clientName, "Cliente vinculado")}
                  </p>
                }
              />
              <CompactField
                label="CPF/CNPJ"
                value={
                  <p className="truncate text-sm text-muted-foreground">
                    {sanitizeText(formatDocument(agreement.cpf_cnpj))}
                  </p>
                }
              />
              <CompactField
                label="Contrato"
                value={
                  <p className="truncate text-sm font-medium">
                    {sanitizeText(agreement.contratoNumero, "Nao cadastrado")}
                  </p>
                }
              />
              <CompactField
                label="Status"
                value={
                  <Badge variant={getAgreementStatusVariant(agreement.status)}>
                    {getAgreementStatusLabel(agreement.status)}
                  </Badge>
                }
              />
              <CompactField
                label="Saldo do acordo"
                align="right"
                value={
                  <p className="font-mono text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(agreement.valorRestante)}
                  </p>
                }
              />
            </div>
          </section>

          {requiresContractCreation ? (
            <section className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold">Contrato obrigatorio para concluir a baixa</p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre os dados minimos do contrato para preservar o historico.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 md:col-span-2 xl:col-span-1">
                  <Label htmlFor="contractNumber">Numero do contrato</Label>
                  <Input
                    id="contractNumber"
                    value={contractNumber}
                    onChange={(event) => setContractNumber(event.target.value)}
                    placeholder="Ex.: 126"
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractWallet">Carteira</Label>
                  <Select
                    value={resolveSelectValue(wallets, contractWalletId)}
                    onValueChange={(value) => setContractWalletId(value ?? "")}
                  >
                    <SelectTrigger
                      id="contractWallet"
                      className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                    >
                      <SelectValue placeholder="Selecione a carteira" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.value} value={wallet.value}>
                          {wallet.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractOpenValue">Valor em aberto</Label>
                  <Input
                    id="contractOpenValue"
                    value={contractOpenValue}
                    inputMode="numeric"
                    onChange={(event) =>
                      setContractOpenValue(maskCurrencyInput(event.target.value))
                    }
                    placeholder="R$ 0,00"
                    className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)]">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="parcelId">Parcela</Label>
                <Select
                  value={parcelId}
                  onValueChange={(value) => {
                    const nextParcelId = value ?? "";
                    const nextInstallment =
                      availableInstallments.find((item) => item.id === nextParcelId) ??
                      null;

                    setParcelId(nextParcelId);
                    setPaidValue(
                      nextInstallment
                        ? formatCurrencyInputValue(
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
                        : agreement.percentual_honorarios !== null &&
                            agreement.percentual_honorarios !== undefined
                          ? String(agreement.percentual_honorarios)
                          : "",
                    );
                    setOperatorId(
                      resolveInitialOperatorId(agreement, nextInstallment, operators),
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
                        {buildInstallmentFriendlyLabel(agreement, installment)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Resumo da parcela
                </p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3 xl:grid-cols-1">
                  <div>
                    <span className="text-muted-foreground">Saldo: </span>
                    <span className="font-mono font-semibold whitespace-nowrap">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Classificacao:</span>
                    <Badge variant={getRevenueBadgeVariant(revenueTypeCode)}>
                      {revenueTypeCode}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={getInstallmentStatusVariant(selectedInstallment.status)}>
                      {getInstallmentStatusLabel(selectedInstallment.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                  value={paidValue}
                  inputMode="numeric"
                  onChange={(event) => {
                    const nextValue = maskCurrencyInput(event.target.value);
                    const normalizedValue = parseCurrencyBR(nextValue) ?? 0;

                    setPaidValue(nextValue);

                    if (normalizedValue <= remainingAmount) {
                      setConfirmOverpayment(false);
                    }
                  }}
                  placeholder="R$ 0,00"
                  className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de pagamento</Label>
                <Select
                  value={resolveSelectValue(paymentMethodOptions, paymentMethod)}
                  onValueChange={(value) => setPaymentMethod(value ?? "")}
                >
                  <SelectTrigger
                    id="paymentMethod"
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  >
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                <Label>Valor honorarios</Label>
                <ReadonlyValue value={formatCurrency(projectedHonorarios)} align="right" />
              </div>

              <div className="space-y-2">
                <Label>Valor escritorio</Label>
                <ReadonlyValue value={formatCurrency(projectedOfficeValue)} align="right" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Observacao</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Comprovante, ajuste operacional, motivo da diferenca ou contexto da baixa."
                className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>
          </section>

          {safePaidValue > remainingAmount ? (
            <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    Valor acima do saldo da parcela
                  </p>
                  <p className="text-sm text-destructive/80">
                    Ative a confirmacao apenas se a baixa realmente precisa exceder o saldo.
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
            </section>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-border/70 bg-muted/10">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setShowParcelDetails((current) => !current)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">Detalhes da parcela</p>
                <p className="text-sm text-muted-foreground">
                  Informacoes auxiliares e operador responsavel.
                </p>
              </div>
              {showParcelDetails ? (
                <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {showParcelDetails ? (
              <div className="border-t border-border/70 px-4 py-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <CompactField
                    label="Valor original"
                    value={
                      <p className="font-mono text-sm font-semibold">
                        {formatCurrency(selectedInstallment.valor_parcela)}
                      </p>
                    }
                  />
                  <CompactField
                    label="Valor ja pago"
                    value={
                      <p className="font-mono text-sm font-semibold">
                        {formatCurrency(selectedInstallment.valor_pago)}
                      </p>
                    }
                  />
                  <CompactField
                    label="Saldo"
                    value={
                      <p className="font-mono text-sm font-semibold">
                        {formatCurrency(remainingAmount)}
                      </p>
                    }
                  />
                  <CompactField
                    label="Vencimento"
                    value={<p className="text-sm font-medium">{formatDate(selectedInstallment.data_vencimento)}</p>}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="operatorId">Operador responsavel</Label>
                    {operators.length ? (
                      <Select
                        value={resolveSelectValue(operators, operatorId)}
                        onValueChange={(value) => setOperatorId(value ?? "")}
                      >
                        <SelectTrigger
                          id="operatorId"
                          className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                        >
                          <SelectValue placeholder="Selecione o operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ReadonlyValue value="Sem operador definido" />
                    )}
                  </div>
                  <CompactField
                    label="Origem da classificacao"
                    value={
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getRevenueBadgeVariant(revenueTypeCode)}>
                          {revenueTypeCode}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {revenueTypeOriginLabel}
                        </span>
                      </div>
                    }
                  />
                  <CompactField
                    label="Status"
                    value={
                      <Badge variant={getInstallmentStatusVariant(selectedInstallment.status)}>
                        {getInstallmentStatusLabel(selectedInstallment.status)}
                      </Badge>
                    }
                  />
                  <CompactField
                    label="Tipo da parcela"
                    value={
                      <p className="text-sm font-medium">
                        {buildInstallmentTitle(selectedInstallment)} -{" "}
                        {resolveAgreementTypeLabel(selectedInstallment.tipo)}
                      </p>
                    }
                  />
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/70 bg-muted/15 px-5 py-4 sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-lg"
            disabled={isPending || !selectedInstallment}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Registrando..." : "Registrar baixa"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function BaixaForm({
  clientId,
  clientName,
  agreement,
  wallets,
  operators,
  initialParcelId,
  open,
  onOpenChange,
}: BaixaFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-1rem)] max-w-4xl gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] [&>button]:right-4 [&>button]:top-4">
        <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-5 pr-14 sm:px-6">
          <DialogTitle>Dar baixa</DialogTitle>
          <DialogDescription>Registre o recebimento de uma parcela.</DialogDescription>
        </DialogHeader>

        {agreement ? (
          <BaixaFormContent
            key={`${agreement.id}-${initialParcelId ?? "all"}-${open ? "open" : "closed"}`}
            clientId={clientId}
            clientName={clientName}
            agreement={agreement}
            wallets={wallets}
            operators={operators}
            initialParcelId={initialParcelId}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
