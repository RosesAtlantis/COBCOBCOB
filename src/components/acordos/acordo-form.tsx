"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { QuickCreateCarteiraModal } from "@/components/carteiras/quick-create-carteira-modal";
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
import {
  formatDocument,
  generateAgreementInstallments,
  getRevenueTypeLabel,
  getRevenueTypeOriginLabel,
  resolveAgreementTypeLabel,
  roundCurrency,
} from "@/lib/clientes-utils";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AgreementInstallmentDraft,
  Client,
  ClientContractRow,
  FilterOption,
  RevenueType,
} from "@/types/portal";

interface AcordoFormProps {
  client: Client;
  contracts: ClientContractRow[];
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  canCreate: boolean;
  canManageCreditors?: boolean;
  canManageWallets?: boolean;
}

type AgreementMode = "avista" | "entrada_parcelas" | "parcelado";

const today = new Date().toISOString().slice(0, 10);

function findOptionValue(
  options: FilterOption[],
  preferredValue?: string | null,
  fallbackValue?: string | null,
) {
  return (
    (preferredValue && options.some((item) => item.value === preferredValue) ? preferredValue : null) ??
    (fallbackValue && options.some((item) => item.value === fallbackValue) ? fallbackValue : null) ??
    options[0]?.value ??
    ""
  );
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildAgreementModeLabel(mode: AgreementMode) {
  if (mode === "avista") {
    return "A vista";
  }

  if (mode === "entrada_parcelas") {
    return "Entrada + parcelas";
  }

  return "Parcelado";
}

function buildFlowContractState(walletId: string) {
  return {
    numeroContrato: "",
    carteiraId: walletId,
    valorEmAberto: "",
  };
}

export function AcordoForm({
  client,
  contracts,
  operators,
  teams,
  wallets,
  canCreate,
  canManageWallets = false,
}: AcordoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [quickWalletOpen, setQuickWalletOpen] = useState(false);
  const [walletOptions, setWalletOptions] = useState(wallets);
  const defaultContract = contracts[0] ?? null;
  const [agreementMode, setAgreementMode] = useState<AgreementMode>("parcelado");
  const [contractId, setContractId] = useState<string>(defaultContract?.id ?? "");
  const [walletId, setWalletId] = useState<string>(
    findOptionValue(walletOptions, defaultContract?.carteira_id, null),
  );
  const [operatorId, setOperatorId] = useState<string>(
    findOptionValue(operators, client.operador_id, defaultContract?.operador_id ?? null),
  );
  const [teamId, setTeamId] = useState<string>(
    findOptionValue(teams, client.equipe_id, defaultContract?.equipe_id ?? null),
  );
  const [agreementDate, setAgreementDate] = useState(today);
  const [originalValue, setOriginalValue] = useState(
    String(defaultContract?.valor_original ?? 0),
  );
  const [agreementValue, setAgreementValue] = useState(
    String(defaultContract?.valor_em_aberto ?? defaultContract?.valor_original ?? 0),
  );
  const [entryValue, setEntryValue] = useState("0");
  const [entryDueDate, setEntryDueDate] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("2");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [intervalMonths, setIntervalMonths] = useState("1");
  const [percentualHonorarios, setPercentualHonorarios] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Boleto");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("ativo");
  const [createContractNow, setCreateContractNow] = useState(false);
  const [flowContract, setFlowContract] = useState(() =>
    buildFlowContractState(findOptionValue(walletOptions, defaultContract?.carteira_id, null)),
  );
  const [parcelDrafts, setParcelDrafts] = useState<AgreementInstallmentDraft[]>([]);
  const [hasManualAdjustments, setHasManualAdjustments] = useState(false);

  const agreementValueNumber = roundCurrency(toNumber(agreementValue));
  const originalValueNumber = roundCurrency(toNumber(originalValue));
  const isCashAgreement = agreementMode === "avista";
  const hasEntry = agreementMode === "entrada_parcelas";
  const entryValueNumber = hasEntry ? roundCurrency(toNumber(entryValue)) : 0;
  const intervalMonthsNumber = Math.max(1, Math.trunc(toNumber(intervalMonths) || 1));
  const installmentsCountNumber = isCashAgreement
    ? 1
    : Math.max(1, Math.trunc(toNumber(installmentsCount) || 1));
  const autoInstallmentValue = isCashAgreement
    ? agreementValueNumber
    : roundCurrency(Math.max(agreementValueNumber - entryValueNumber, 0) / installmentsCountNumber);
  const fullSuggestedPreview = useMemo(
    () =>
      generateAgreementInstallments({
        valorAcordo: agreementValueNumber,
        valorEntrada: entryValueNumber,
        quantidadeParcelas: installmentsCountNumber,
        valorParcela: autoInstallmentValue,
        dataVencimentoEntrada: hasEntry ? entryDueDate || null : null,
        primeiroVencimento: firstDueDate || null,
        intervaloMeses: intervalMonthsNumber,
      }),
    [
      agreementValueNumber,
      autoInstallmentValue,
      entryDueDate,
      entryValueNumber,
      firstDueDate,
      hasEntry,
      installmentsCountNumber,
      intervalMonthsNumber,
    ],
  );
  const suggestedBalanceInstallments = useMemo(
    () => fullSuggestedPreview.filter((installment) => installment.tipo !== "entrada"),
    [fullSuggestedPreview],
  );
  const entryPreview = useMemo(
    () => fullSuggestedPreview.find((installment) => installment.tipo === "entrada") ?? null,
    [fullSuggestedPreview],
  );
  const displayedParcelDrafts = hasManualAdjustments ? parcelDrafts : suggestedBalanceInstallments;
  const previewTotal = roundCurrency(
    (entryPreview?.valorParcela ?? 0) +
      displayedParcelDrafts.reduce((total, installment) => total + installment.valorParcela, 0),
  );
  const previewDifference = roundCurrency(agreementValueNumber - previewTotal);
  const percentualHonorariosNumber = percentualHonorarios.trim()
    ? roundCurrency(toNumber(percentualHonorarios))
    : null;
  const honorariosPrevistos = percentualHonorariosNumber
    ? roundCurrency((agreementValueNumber * percentualHonorariosNumber) / 100)
    : 0;
  const shouldShowCreateContractPrompt = !contractId;

  function resetForm(nextContract: ClientContractRow | null = defaultContract) {
    const nextOpenValue = String(
      nextContract?.valor_em_aberto ?? nextContract?.valor_original ?? 0,
    );
    const nextWalletId = findOptionValue(walletOptions, nextContract?.carteira_id, null);

    setAgreementMode("parcelado");
    setContractId(nextContract?.id ?? "");
    setWalletId(nextWalletId);
    setOperatorId(
      findOptionValue(operators, client.operador_id, nextContract?.operador_id ?? null),
    );
    setTeamId(findOptionValue(teams, client.equipe_id, nextContract?.equipe_id ?? null));
    setAgreementDate(today);
    setOriginalValue(String(nextContract?.valor_original ?? 0));
    setAgreementValue(nextOpenValue);
    setEntryValue("0");
    setEntryDueDate("");
    setInstallmentsCount("2");
    setFirstDueDate("");
    setIntervalMonths("1");
    setPercentualHonorarios("");
    setPaymentMethod("Boleto");
    setNote("");
    setStatus("ativo");
    setCreateContractNow(false);
    setFlowContract(buildFlowContractState(nextWalletId));
    setHasManualAdjustments(false);
    setParcelDrafts([]);
  }

  function handleContractChange(nextValue: string) {
    const nextContract = contracts.find((item) => item.id === nextValue) ?? null;
    setContractId(nextValue);

    if (!nextContract) {
      return;
    }

    if (nextContract.carteira_id && walletOptions.some((item) => item.value === nextContract.carteira_id)) {
      setWalletId(nextContract.carteira_id);
    }

    if (nextContract.operador_id && operators.some((item) => item.value === nextContract.operador_id)) {
      setOperatorId(nextContract.operador_id);
    }

    if (nextContract.equipe_id && teams.some((item) => item.value === nextContract.equipe_id)) {
      setTeamId(nextContract.equipe_id);
    }

    setOriginalValue(String(nextContract.valor_original));
    setAgreementValue(String(nextContract.valor_em_aberto || nextContract.valor_original));
    setCreateContractNow(false);
    setFlowContract(buildFlowContractState(nextContract.carteira_id ?? walletId));
    setHasManualAdjustments(false);
  }

  function handleModeChange(nextMode: AgreementMode) {
    setAgreementMode(nextMode);
    setHasManualAdjustments(false);

    if (nextMode === "avista") {
      setEntryValue("0");
      setEntryDueDate("");
      setInstallmentsCount("1");
    }

    if (nextMode === "parcelado") {
      setEntryValue("0");
      setEntryDueDate("");

      if (Math.trunc(toNumber(installmentsCount) || 0) < 2) {
        setInstallmentsCount("2");
      }
    }
  }

  function updateInstallmentDraft(
    index: number,
    patch: Partial<AgreementInstallmentDraft>,
  ) {
    setHasManualAdjustments(true);
    setParcelDrafts((current) => {
      const source = current.length ? current : suggestedBalanceInstallments;

      return source.map((installment, currentIndex) =>
        currentIndex === index ? { ...installment, ...patch } : installment,
      );
    });
  }

  function updateFlowContract(
    patch: Partial<typeof flowContract>,
  ) {
    setFlowContract((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agreementDate) {
      toast.error("Informe a data do acordo.");
      return;
    }

    if (!walletId) {
      toast.error("Selecione a carteira do acordo.");
      return;
    }

    if (!Number.isFinite(agreementValueNumber) || agreementValueNumber <= 0) {
      toast.error("Informe um valor de acordo valido.");
      return;
    }

    if (hasEntry && (!Number.isFinite(entryValueNumber) || entryValueNumber <= 0)) {
      toast.error("Informe um valor de entrada maior que zero.");
      return;
    }

    if (agreementMode === "parcelado" && installmentsCountNumber < 2) {
      toast.error("Acordos parcelados sem entrada precisam ter ao menos 2 parcelas.");
      return;
    }

    if (entryValueNumber > agreementValueNumber) {
      toast.error("A entrada nao pode ser maior que o valor negociado.");
      return;
    }

    if (hasEntry && !entryDueDate) {
      toast.error("Informe o vencimento da entrada.");
      return;
    }

    if (!firstDueDate) {
      toast.error("Informe o primeiro vencimento do acordo.");
      return;
    }

    if (
      percentualHonorariosNumber !== null &&
      (percentualHonorariosNumber < 0 || percentualHonorariosNumber > 100)
    ) {
      toast.error("O percentual de honorarios deve ficar entre 0 e 100.");
      return;
    }

    if (!displayedParcelDrafts.length) {
      toast.error("Gere ao menos uma parcela antes de salvar.");
      return;
    }

    if (createContractNow) {
      if (!flowContract.numeroContrato.trim()) {
        toast.error("Informe o numero do contrato para continuar.");
        return;
      }

      if (!flowContract.carteiraId) {
        toast.error("Selecione a carteira do novo contrato.");
        return;
      }

      if (
        !Number.isFinite(Number(flowContract.valorEmAberto)) ||
        Number(flowContract.valorEmAberto) <= 0
      ) {
        toast.error("Informe um valor em aberto valido para o novo contrato.");
        return;
      }
    }

    const invalidInstallment = displayedParcelDrafts.find(
      (installment) =>
        !installment.dataVencimento ||
        !Number.isFinite(installment.valorParcela) ||
        installment.valorParcela <= 0,
    );

    if (invalidInstallment) {
      toast.error("Revise as parcelas manuais antes de salvar.");
      return;
    }

    if (Math.abs(previewDifference) > 0.05) {
      toast.error("A soma das parcelas precisa bater com o valor negociado.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/clientes/${client.id}/acordos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contratoId: contractId || null,
            operadorId: operatorId || null,
            equipeId: teamId || null,
            carteiraId: walletId || null,
            dataAcordo: agreementDate,
            valorOriginal: originalValueNumber,
            valorAcordo: agreementValueNumber,
            valorEntrada: entryValueNumber,
            dataVencimentoEntrada: hasEntry ? entryDueDate || null : null,
            quantidadeParcelas: isCashAgreement ? 1 : displayedParcelDrafts.length,
            valorParcela: displayedParcelDrafts[0]?.valorParcela ?? autoInstallmentValue,
            primeiroVencimento:
              (displayedParcelDrafts[0]?.dataVencimento ?? firstDueDate) || null,
            intervaloMeses: intervalMonthsNumber,
            percentualHonorarios: percentualHonorariosNumber,
            formaPagamento: paymentMethod || null,
            observacao: note || null,
            status,
            criarContratoAgora: createContractNow,
            novoContrato: createContractNow
              ? {
                  numeroContrato: flowContract.numeroContrato,
                  carteiraId: flowContract.carteiraId,
                  valorEmAberto: Number(flowContract.valorEmAberto),
                  valorOriginal: originalValueNumber,
                  operadorId: operatorId || null,
                  equipeId: teamId || null,
                  observacao: note || null,
                  status: "em_acordo",
                }
              : null,
            parcelasCustomizadas: displayedParcelDrafts.map((installment, index) => ({
              numeroParcela: index + 1,
              tipo: installment.tipo,
              dataVencimento: installment.dataVencimento,
              valorParcela: installment.valorParcela,
              observacao: installment.observacao ?? null,
              operadorId: installment.operadorId ?? null,
              tipoReceita: installment.tipoReceita ?? null,
              tipoReceitaOrigem: installment.tipoReceita ? "manual" : null,
            })),
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel cadastrar o acordo.");
          return;
        }

        toast.success("Acordo cadastrado com sucesso.");
        setOpen(false);
        router.refresh();
      })();
    });
  }

  return (
    <>
      <Button
        type="button"
        className="rounded-lg"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        disabled={!canCreate}
      >
        <Plus className="size-4" />
        Cadastrar acordo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Novo acordo</DialogTitle>
            <DialogDescription>
              Monte o acordo completo, ajuste os valores das parcelas quando precisar e grave
              tudo de forma auditavel no Supabase.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Modelo do acordo</p>
                <p className="text-sm text-muted-foreground">
                  Escolha como a negociacao sera estruturada antes de distribuir as parcelas.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {(["avista", "entrada_parcelas", "parcelado"] as AgreementMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-left transition-colors",
                      agreementMode === mode
                        ? "border-primary/30 bg-primary/10"
                        : "border-border/70 bg-background hover:bg-muted/20",
                    )}
                  >
                    <p className="text-sm font-semibold">{buildAgreementModeLabel(mode)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {mode === "avista"
                        ? "Uma unica parcela do tipo a vista."
                        : mode === "entrada_parcelas"
                          ? "Entrada imediata e parcelas para o saldo."
                          : "Parcelas sem entrada, com vencimentos recorrentes."}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="clientName">Cliente</Label>
                <Input
                  id="clientName"
                  value={client.nome}
                  readOnly
                  className="h-11 rounded-lg border-border/70 bg-muted/25 shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientDocument">CPF/CNPJ</Label>
                <Input
                  id="clientDocument"
                  value={formatDocument(client.cpf_cnpj)}
                  readOnly
                  className="h-11 rounded-lg border-border/70 bg-muted/25 shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status inicial</Label>
                <Select value={status} onValueChange={(value) => setStatus(value ?? "ativo")}>
                  <SelectTrigger id="status" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="aguardando_pagamento">Aguardando pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="contractId">Contrato</Label>
                <Select
                  value={contractId || "none"}
                  onValueChange={(value) =>
                    handleContractChange(!value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="contractId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione o contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem contrato vinculado</SelectItem>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {`${contract.numero_contrato} - aberto ${formatCurrency(contract.valor_em_aberto)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {shouldShowCreateContractPrompt ? (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 xl:col-span-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-amber-600" />
                        <p className="text-sm font-semibold">
                          Cliente sem contrato vinculado neste acordo
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Voce pode salvar o acordo sem contrato ou criar um
                        contrato minimo agora para deixar o fluxo completo desde a origem.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={createContractNow ? "default" : "outline"}
                      className="rounded-lg"
                      onClick={() => {
                        setCreateContractNow((current) => !current);
                        setFlowContract((current) => ({
                          ...current,
                          carteiraId: current.carteiraId || walletId,
                        }));
                      }}
                    >
                      {createContractNow ? "Remover contrato em fluxo" : "Criar contrato agora"}
                    </Button>
                  </div>

                  {createContractNow ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2 xl:col-span-2">
                        <Label htmlFor="flowContractNumber">Numero do contrato</Label>
                        <Input
                          id="flowContractNumber"
                          value={flowContract.numeroContrato}
                          onChange={(event) =>
                            updateFlowContract({ numeroContrato: event.target.value })
                          }
                          className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="flowContractWallet">Carteira</Label>
                          {canManageWallets ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-auto rounded-lg px-2 py-1 text-xs"
                              onClick={() => setQuickWalletOpen(true)}
                            >
                              <Plus className="size-3.5" />
                              Nova carteira
                            </Button>
                          ) : null}
                        </div>
                        <Select
                          value={flowContract.carteiraId || "none"}
                          onValueChange={(value) => {
                            const nextWalletId = !value || value === "none" ? "" : value;

                            updateFlowContract({
                              carteiraId: nextWalletId,
                            });
                          }}
                        >
                          <SelectTrigger
                            id="flowContractWallet"
                            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                          >
                            <SelectValue placeholder="Selecione a carteira" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecione</SelectItem>
                            {walletOptions.map((wallet) => (
                              <SelectItem key={wallet.value} value={wallet.value}>
                                {wallet.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flowContractOpenValue">Valor em aberto</Label>
                        <Input
                          id="flowContractOpenValue"
                          type="number"
                          min="0"
                          step="0.01"
                          value={flowContract.valorEmAberto}
                          onChange={(event) =>
                            updateFlowContract({ valorEmAberto: event.target.value })
                          }
                          className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="walletId">Carteira</Label>
                  {canManageWallets ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto rounded-lg px-2 py-1 text-xs"
                      onClick={() => setQuickWalletOpen(true)}
                    >
                      <Plus className="size-3.5" />
                      Nova carteira
                    </Button>
                  ) : null}
                </div>
                <Select
                  value={walletId || "none"}
                  onValueChange={(value) => {
                    const nextWalletId = !value || value === "none" ? "" : value;

                    setWalletId(nextWalletId);

                    if (createContractNow) {
                      updateFlowContract({
                        carteiraId: flowContract.carteiraId || nextWalletId,
                      });
                    }
                  }}
                >
                  <SelectTrigger id="walletId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione a carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {walletOptions.map((wallet) => (
                      <SelectItem key={wallet.value} value={wallet.value}>
                        {wallet.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatorId">Operador responsavel</Label>
                <Select
                  value={operatorId || "none"}
                  onValueChange={(value) => setOperatorId(!value || value === "none" ? "" : value)}
                >
                  <SelectTrigger id="operatorId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione o operador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Herdar do cliente</SelectItem>
                    {operators.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamId">Equipe</Label>
                <Select
                  value={teamId || "none"}
                  onValueChange={(value) => setTeamId(!value || value === "none" ? "" : value)}
                >
                  <SelectTrigger id="teamId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Herdar do cliente</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreementDate">Data do acordo</Label>
                <Input
                  id="agreementDate"
                  type="date"
                  value={agreementDate}
                  onChange={(event) => setAgreementDate(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalValue">Valor original</Label>
                <Input
                  id="originalValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalValue}
                  onChange={(event) => setOriginalValue(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreementValue">Valor negociado</Label>
                <Input
                  id="agreementValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={agreementValue}
                  onChange={(event) => {
                    setAgreementValue(event.target.value);
                    setHasManualAdjustments(false);
                  }}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
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
                  placeholder="Em branco usa a carteira"
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              {hasEntry ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="entryValue">Valor de entrada</Label>
                    <Input
                      id="entryValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={entryValue}
                      onChange={(event) => {
                        setEntryValue(event.target.value);
                        setHasManualAdjustments(false);
                      }}
                      className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entryDueDate">Vencimento da entrada</Label>
                    <Input
                      id="entryDueDate"
                      type="date"
                      value={entryDueDate}
                      onChange={(event) => {
                        setEntryDueDate(event.target.value);
                        setHasManualAdjustments(false);
                      }}
                      className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                    />
                  </div>
                </>
              ) : null}

              {!isCashAgreement ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="installmentsCount">Quantidade de parcelas</Label>
                    <Input
                      id="installmentsCount"
                      type="number"
                      min={hasEntry ? "1" : "2"}
                      step="1"
                      value={installmentsCount}
                      onChange={(event) => {
                        setInstallmentsCount(event.target.value);
                        setHasManualAdjustments(false);
                      }}
                      className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intervalMonths">Intervalo em meses</Label>
                    <Input
                      id="intervalMonths"
                      type="number"
                      min="1"
                      step="1"
                      value={intervalMonths}
                      onChange={(event) => {
                        setIntervalMonths(event.target.value);
                        setHasManualAdjustments(false);
                      }}
                      className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                    />
                  </div>
                </>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="firstDueDate">
                  {isCashAgreement ? "Vencimento" : "Primeiro vencimento"}
                </Label>
                <Input
                  id="firstDueDate"
                  type="date"
                  value={firstDueDate}
                  onChange={(event) => {
                    setFirstDueDate(event.target.value);
                    setHasManualAdjustments(false);
                  }}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="paymentMethod">Forma de pagamento</Label>
                <Input
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  placeholder="PIX, boleto, transferencia..."
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label htmlFor="note">Observacao</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Condicoes comerciais, ressalvas e detalhes operacionais."
                  className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Valor negociado</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(agreementValueNumber)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Entrada</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(entryValueNumber)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Saldo parcelado</p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(Math.max(agreementValueNumber - entryValueNumber, 0))}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Honorarios previstos</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(honorariosPrevistos)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold">Parcelas do acordo</p>
                  <p className="text-sm text-muted-foreground">
                    A sugestao inicial pode ser recalculada. Depois disso, voce ajusta valores,
                    vencimentos, operador e classificacao NOVO/COLCHAO por parcela.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    setParcelDrafts([]);
                    setHasManualAdjustments(false);
                  }}
                >
                  <RefreshCcw className="size-4" />
                  Regerar sugestao
                </Button>
              </div>

              {entryPreview ? (
                <div className="mt-4 rounded-2xl border border-border/70 bg-background px-4 py-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        Parcela {entryPreview.numeroParcela} - {resolveAgreementTypeLabel(entryPreview.tipo)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento {entryPreview.dataVencimento}
                      </p>
                    </div>
                    <p className="font-mono text-sm">{formatCurrency(entryPreview.valorParcela)}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {displayedParcelDrafts.length ? (
                  displayedParcelDrafts.map((installment, index) => (
                    <div
                      key={`${installment.numeroParcela}-${index}`}
                      className="rounded-2xl border border-border/70 bg-background p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            Parcela {installment.numeroParcela} - {resolveAgreementTypeLabel(installment.tipo)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Receita {getRevenueTypeLabel(installment.tipoReceita)} -{" "}
                            {getRevenueTypeOriginLabel(installment.tipoReceitaOrigem)}
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:w-[760px] xl:grid-cols-4">
                          <div className="space-y-2">
                            <Label htmlFor={`due-${index}`}>Vencimento</Label>
                            <Input
                              id={`due-${index}`}
                              type="date"
                              value={installment.dataVencimento}
                              onChange={(event) =>
                                updateInstallmentDraft(index, {
                                  dataVencimento: event.target.value,
                                })
                              }
                              className="h-10 rounded-lg border-border/70 bg-background shadow-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`value-${index}`}>Valor</Label>
                            <Input
                              id={`value-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={installment.valorParcela}
                              onChange={(event) =>
                                updateInstallmentDraft(index, {
                                  valorParcela: roundCurrency(toNumber(event.target.value)),
                                })
                              }
                              className="h-10 rounded-lg border-border/70 bg-background shadow-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`operator-${index}`}>Operador</Label>
                            <Select
                              value={installment.operadorId ?? "inherit"}
                              onValueChange={(value) =>
                                updateInstallmentDraft(index, {
                                  operadorId: value === "inherit" ? null : value,
                                })
                              }
                            >
                              <SelectTrigger
                                id={`operator-${index}`}
                                className="h-10 rounded-lg border-border/70 bg-background shadow-none"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inherit">Herdar do acordo</SelectItem>
                                {operators.map((operator) => (
                                  <SelectItem key={operator.value} value={operator.value}>
                                    {operator.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`revenue-${index}`}>Receita</Label>
                            <Select
                              value={installment.tipoReceitaOrigem === "manual" ? installment.tipoReceita ?? "NOVO" : "automatico"}
                              onValueChange={(value) => {
                                if (value === "automatico") {
                                  updateInstallmentDraft(index, {
                                    tipoReceita: null,
                                    tipoReceitaOrigem: null,
                                  });
                                  return;
                                }

                                updateInstallmentDraft(index, {
                                  tipoReceita: value as RevenueType,
                                  tipoReceitaOrigem: "manual",
                                });
                              }}
                            >
                              <SelectTrigger
                                id={`revenue-${index}`}
                                className="h-10 rounded-lg border-border/70 bg-background shadow-none"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="automatico">Automatico</SelectItem>
                                <SelectItem value="NOVO">NOVO</SelectItem>
                                <SelectItem value="COLCHAO">COLCHAO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor={`obs-${index}`}>Observacao da parcela</Label>
                        <Textarea
                          id={`obs-${index}`}
                          value={installment.observacao ?? ""}
                          onChange={(event) =>
                            updateInstallmentDraft(index, {
                              observacao: event.target.value || null,
                            })
                          }
                          placeholder="Comprovante esperado, promessa, observacao operacional..."
                          className="min-h-20 rounded-lg border-border/70 bg-background shadow-none"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                    Preencha valor, vencimentos e estrutura do acordo para gerar a previa.
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <p className="text-sm text-muted-foreground">Previa total</p>
                  <p className="mt-1 font-mono text-lg">{formatCurrency(previewTotal)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <p className="text-sm text-muted-foreground">Diferenca para o acordo</p>
                  <p className={cn("mt-1 font-mono text-lg", previewDifference === 0 ? "text-foreground" : "text-destructive")}>
                    {formatCurrency(previewDifference)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <p className="text-sm text-muted-foreground">Modo atual</p>
                  <p className="mt-1 text-lg font-semibold">{buildAgreementModeLabel(agreementMode)}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="rounded-lg" disabled={isPending || !walletId}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar acordo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canManageWallets ? (
        <QuickCreateCarteiraModal
          open={quickWalletOpen}
          onOpenChange={setQuickWalletOpen}
          onCreated={(wallet) => {
            setWalletOptions((current) => {
              const next = current.filter((option) => option.value !== wallet.id);
              next.push({
                value: wallet.id,
                label: wallet.nome,
                description: wallet.codigo ?? undefined,
              });
              return next.sort((left, right) => left.label.localeCompare(right.label));
            });
            setWalletId(wallet.id);
            updateFlowContract({
              carteiraId: wallet.id,
            });
          }}
        />
      ) : null}
    </>
  );
}
