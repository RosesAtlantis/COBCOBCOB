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
import { formatCurrencyInputValue } from "@/lib/formatters";
import { maskCurrencyInput } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { parseCurrencyBR, parsePercent } from "@/lib/validators";
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
const EMPTY_SELECT_VALUE = "__empty__";

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

function resolveSelectValue(
  options: FilterOption[],
  value: string | null | undefined,
) {
  return value && options.some((item) => item.value === value)
    ? value
    : EMPTY_SELECT_VALUE;
}

function resolveContractValue(
  items: ClientContractRow[],
  value: string | null | undefined,
) {
  return value && items.some((item) => item.id === value) ? value : EMPTY_SELECT_VALUE;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCurrencyNumber(value: string) {
  return parseCurrencyBR(value) ?? 0;
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
    formatCurrencyInputValue(defaultContract?.valor_original ?? null),
  );
  const [agreementValue, setAgreementValue] = useState(
    formatCurrencyInputValue(
      defaultContract?.valor_em_aberto ?? defaultContract?.valor_original ?? null,
    ),
  );
  const [entryValue, setEntryValue] = useState("");
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

  const agreementValueNumber = roundCurrency(toCurrencyNumber(agreementValue));
  const originalValueNumber = roundCurrency(toCurrencyNumber(originalValue));
  const isCashAgreement = agreementMode === "avista";
  const hasEntry = agreementMode === "entrada_parcelas";
  const entryValueNumber = hasEntry ? roundCurrency(toCurrencyNumber(entryValue)) : 0;
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
    ? parsePercent(percentualHonorarios)
    : null;
  const honorariosPrevistos = percentualHonorariosNumber
    ? roundCurrency((agreementValueNumber * percentualHonorariosNumber) / 100)
    : 0;
  const shouldShowCreateContractPrompt = !contractId;

  function resetForm(nextContract: ClientContractRow | null = defaultContract) {
    const nextOpenValue = formatCurrencyInputValue(
      nextContract?.valor_em_aberto ?? nextContract?.valor_original ?? null,
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
    setOriginalValue(formatCurrencyInputValue(nextContract?.valor_original ?? null));
    setAgreementValue(nextOpenValue);
    setEntryValue("");
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
      setOriginalValue("");
      setAgreementValue("");
      setCreateContractNow(false);
      setFlowContract(buildFlowContractState(walletId));
      setHasManualAdjustments(false);
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

    setOriginalValue(formatCurrencyInputValue(nextContract.valor_original));
    setAgreementValue(
      formatCurrencyInputValue(nextContract.valor_em_aberto || nextContract.valor_original),
    );
    setCreateContractNow(false);
    setFlowContract(buildFlowContractState(nextContract.carteira_id ?? walletId));
    setHasManualAdjustments(false);
  }

  function handleModeChange(nextMode: AgreementMode) {
    setAgreementMode(nextMode);
    setHasManualAdjustments(false);

    if (nextMode === "avista") {
      setEntryValue("");
      setEntryDueDate("");
      setInstallmentsCount("1");
    }

    if (nextMode === "parcelado") {
      setEntryValue("");
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
      percentualHonorarios.trim() &&
      (percentualHonorariosNumber === null ||
        percentualHonorariosNumber < 0 ||
        percentualHonorariosNumber > 100)
    ) {
      toast.error("O percentual de honorarios deve ficar entre 0 e 100.");
      return;
    }

    if (!displayedParcelDrafts.length) {
      toast.error("Gere ao menos uma parcela antes de salvar.");
      return;
    }

    if (createContractNow) {
      const parsedFlowOpenValue = parseCurrencyBR(flowContract.valorEmAberto);

      if (!flowContract.numeroContrato.trim()) {
        toast.error("Informe o numero do contrato para continuar.");
        return;
      }

      if (!flowContract.carteiraId) {
        toast.error("Selecione a carteira do novo contrato.");
        return;
      }

      if (parsedFlowOpenValue === null || parsedFlowOpenValue <= 0) {
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
            cliente_id: client.id,
            contrato_id: contractId || null,
            operador_id: operatorId || null,
            equipe_id: teamId || null,
            carteira_id: walletId || null,
            data_acordo: agreementDate,
            valor_original: originalValueNumber,
            valor_acordo: agreementValueNumber,
            valor_entrada: entryValueNumber,
            data_vencimento_entrada: hasEntry ? entryDueDate || null : null,
            quantidade_parcelas: isCashAgreement ? 1 : displayedParcelDrafts.length,
            valor_parcela: displayedParcelDrafts[0]?.valorParcela ?? autoInstallmentValue,
            primeiro_vencimento:
              (displayedParcelDrafts[0]?.dataVencimento ?? firstDueDate) || null,
            intervalo_meses: intervalMonthsNumber,
            percentual_honorarios: percentualHonorariosNumber,
            forma_pagamento: paymentMethod || null,
            observacao: note || null,
            status,
            criar_contrato_agora: createContractNow,
            novo_contrato: createContractNow
              ? {
                  numero_contrato: flowContract.numeroContrato,
                  carteira_id: flowContract.carteiraId,
                  valor_em_aberto: parseCurrencyBR(flowContract.valorEmAberto),
                  valor_original: originalValueNumber,
                  operador_id: operatorId || null,
                  equipe_id: teamId || null,
                  observacao: note || null,
                  status: "em_acordo",
                }
              : null,
            parcelas_customizadas: displayedParcelDrafts.map((installment, index) => ({
              numero_parcela: index + 1,
              tipo: installment.tipo,
              data_vencimento: installment.dataVencimento,
              valor_parcela: installment.valorParcela,
              observacao: installment.observacao ?? null,
              operador_id: installment.operadorId ?? null,
              tipo_receita: installment.tipoReceita ?? null,
              tipo_receita_origem: installment.tipoReceita ? "manual" : null,
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
        <DialogContent className="max-w-[min(1040px,calc(100vw-1.5rem))] overflow-hidden p-0">
          <DialogHeader className="gap-1 border-b border-border/70 px-6 py-5">
            <DialogTitle>Novo acordo</DialogTitle>
            <DialogDescription>Defina o modelo, valores e parcelas do acordo.</DialogDescription>
          </DialogHeader>

          <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
            <div className="max-h-[76vh] space-y-6 overflow-y-auto overflow-x-hidden px-6 py-5">
              <section className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Modelo do acordo</p>
                  <p className="text-sm text-muted-foreground">
                    Escolha como a negociacao sera estruturada antes de gerar as parcelas.
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {(["avista", "entrada_parcelas", "parcelado"] as AgreementMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleModeChange(mode)}
                      className={cn(
                        "min-h-[136px] rounded-2xl border px-4 py-4 text-left transition-colors",
                        agreementMode === mode
                          ? "border-primary/30 bg-primary/10"
                          : "border-border/70 bg-background hover:bg-muted/20",
                      )}
                    >
                      <p className="text-sm font-semibold">{buildAgreementModeLabel(mode)}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {mode === "avista"
                          ? "Valor integral em uma unica parcela."
                          : mode === "entrada_parcelas"
                            ? "Entrada inicial e saldo distribuido em parcelas."
                            : "Parcelamento recorrente sem entrada inicial."}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-border/70 bg-muted/10 p-5">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Dados principais</p>
                  <p className="text-sm text-muted-foreground">
                    Revise contrato, carteira e responsaveis antes de montar o acordo.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                  <div className="space-y-2">
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
                      <SelectTrigger
                        id="status"
                        className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="aguardando_pagamento">
                          Aguardando pagamento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label htmlFor="contractId">Contrato</Label>
                    <Select
                      value={resolveContractValue(contracts, contractId)}
                      onValueChange={(value) =>
                        handleContractChange(
                          !value || value === EMPTY_SELECT_VALUE ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        id="contractId"
                        className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                      >
                        <SelectValue placeholder="Sem contrato vinculado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Sem contrato vinculado
                        </SelectItem>
                        {contracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {`${contract.numero_contrato} - ${formatCurrency(contract.valor_em_aberto)} em aberto`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="walletId">Carteira</Label>
                    <Select
                      value={resolveSelectValue(walletOptions, walletId)}
                      onValueChange={(value) => {
                        const nextWalletId =
                          !value || value === EMPTY_SELECT_VALUE ? "" : value;

                        setWalletId(nextWalletId);

                        if (createContractNow) {
                          updateFlowContract({
                            carteiraId: flowContract.carteiraId || nextWalletId,
                          });
                        }
                      }}
                    >
                      <SelectTrigger
                        id="walletId"
                        className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                      >
                        <SelectValue placeholder="Selecione uma carteira" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Selecione uma carteira
                        </SelectItem>
                        {walletOptions.map((wallet) => (
                          <SelectItem key={wallet.value} value={wallet.value}>
                            {wallet.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {canManageWallets ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setQuickWalletOpen(true)}
                      >
                        <Plus className="size-4" />
                        Nova carteira
                      </Button>
                    ) : null}
                  </div>
                </div>

                {shouldShowCreateContractPrompt ? (
                  <div className="rounded-2xl border border-amber-300/70 bg-amber-50/70 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-amber-700" />
                          <p className="text-sm font-semibold text-amber-950">
                            Este cliente ainda nao possui contrato vinculado.
                          </p>
                        </div>
                        <p className="text-sm leading-6 text-amber-900/80">
                          Voce pode criar um contrato agora para completar o fluxo ou continuar sem
                          vinculo, se a regra operacional permitir.
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
                      <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="flowContractNumber">Numero do contrato</Label>
                          <Input
                            id="flowContractNumber"
                            value={flowContract.numeroContrato}
                            onChange={(event) =>
                              updateFlowContract({ numeroContrato: event.target.value })
                            }
                            placeholder="Ex.: 12345/2026"
                            className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="flowContractWallet">Carteira</Label>
                          <Select
                            value={resolveSelectValue(walletOptions, flowContract.carteiraId)}
                            onValueChange={(value) => {
                              const nextWalletId =
                                !value || value === EMPTY_SELECT_VALUE ? "" : value;

                              updateFlowContract({
                                carteiraId: nextWalletId,
                              });
                            }}
                          >
                            <SelectTrigger
                              id="flowContractWallet"
                              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                            >
                              <SelectValue placeholder="Selecione uma carteira" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_SELECT_VALUE}>
                                Selecione uma carteira
                              </SelectItem>
                              {walletOptions.map((wallet) => (
                                <SelectItem key={wallet.value} value={wallet.value}>
                                  {wallet.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {canManageWallets ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => setQuickWalletOpen(true)}
                            >
                              <Plus className="size-4" />
                              Nova carteira
                            </Button>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="flowContractOpenValue">Valor em aberto</Label>
                          <Input
                            id="flowContractOpenValue"
                            inputMode="decimal"
                            value={flowContract.valorEmAberto}
                            onChange={(event) =>
                              updateFlowContract({
                                valorEmAberto: maskCurrencyInput(event.target.value),
                              })
                            }
                            placeholder="R$ 0,00"
                            className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="operatorId">Operador responsavel</Label>
                    <Select
                      value={resolveSelectValue(operators, operatorId)}
                      onValueChange={(value) =>
                        setOperatorId(!value || value === EMPTY_SELECT_VALUE ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="operatorId"
                        className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                      >
                        <SelectValue placeholder="Sem operador definido" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Sem operador definido
                        </SelectItem>
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
                      value={resolveSelectValue(teams, teamId)}
                      onValueChange={(value) =>
                        setTeamId(!value || value === EMPTY_SELECT_VALUE ? "" : value)
                      }
                    >
                      <SelectTrigger
                        id="teamId"
                        className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                      >
                        <SelectValue placeholder="Sem equipe definida" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Sem equipe definida
                        </SelectItem>
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
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-border/70 bg-muted/10 p-5">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Valores e parcelas</p>
                  <p className="text-sm text-muted-foreground">
                    Preencha os valores do acordo e ajuste as datas de vencimento conforme o
                    modelo selecionado.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="originalValue">Valor original</Label>
                    <Input
                      id="originalValue"
                      inputMode="decimal"
                      value={originalValue}
                      onChange={(event) => setOriginalValue(maskCurrencyInput(event.target.value))}
                      placeholder="R$ 0,00"
                      className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agreementValue">Valor do acordo</Label>
                    <Input
                      id="agreementValue"
                      inputMode="decimal"
                      value={agreementValue}
                      onChange={(event) => {
                        setAgreementValue(maskCurrencyInput(event.target.value));
                        setHasManualAdjustments(false);
                      }}
                      placeholder="R$ 0,00"
                      className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
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
                </div>

                {hasEntry ? (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="entryValue">Valor de entrada</Label>
                      <Input
                        id="entryValue"
                        inputMode="decimal"
                        value={entryValue}
                        onChange={(event) => {
                          setEntryValue(maskCurrencyInput(event.target.value));
                          setHasManualAdjustments(false);
                        }}
                        placeholder="R$ 0,00"
                        className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
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
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
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
                  </div>
                )}

                {!isCashAgreement ? (
                  <div className="grid gap-4 lg:grid-cols-3">
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
                    <div className="space-y-2">
                      <Label htmlFor="firstDueDate">Primeiro vencimento</Label>
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
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstDueDate">Vencimento</Label>
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
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="note">Observacao</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Condicoes comerciais, ressalvas e detalhes operacionais."
                    className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              </section>

              <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Previa das parcelas</p>
                    <p className="text-sm text-muted-foreground">
                      Ajuste vencimento, valor, operador e classificacao de cada parcela sem abrir
                      scroll horizontal no modal.
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
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          Parcela {entryPreview.numeroParcela} -{" "}
                          {resolveAgreementTypeLabel(entryPreview.tipo)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vencimento {entryPreview.dataVencimento}
                        </p>
                      </div>
                      <p className="font-mono text-sm">{formatCurrency(entryPreview.valorParcela)}</p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {displayedParcelDrafts.length ? (
                    displayedParcelDrafts.map((installment, index) => (
                      <div
                        key={`${installment.numeroParcela}-${index}`}
                        className="overflow-hidden rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.7fr)]">
                          <div>
                            <p className="text-sm font-semibold">
                              Parcela {installment.numeroParcela} -{" "}
                              {resolveAgreementTypeLabel(installment.tipo)}
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              Classificacao {getRevenueTypeLabel(installment.tipoReceita)} -{" "}
                              {getRevenueTypeOriginLabel(installment.tipoReceitaOrigem)}
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                                inputMode="decimal"
                                value={formatCurrencyInputValue(installment.valorParcela)}
                                onChange={(event) =>
                                  updateInstallmentDraft(index, {
                                    valorParcela: roundCurrency(
                                      parseCurrencyBR(maskCurrencyInput(event.target.value)) ?? 0,
                                    ),
                                  })
                                }
                                placeholder="R$ 0,00"
                                className="h-10 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`operator-${index}`}>Operador</Label>
                              <Select
                                value={resolveSelectValue(operators, installment.operadorId)}
                                onValueChange={(value) =>
                                  updateInstallmentDraft(index, {
                                    operadorId:
                                      value === EMPTY_SELECT_VALUE ? null : value,
                                  })
                                }
                              >
                                <SelectTrigger
                                  id={`operator-${index}`}
                                  className="h-10 rounded-lg border-border/70 bg-background shadow-none"
                                >
                                  <SelectValue placeholder="Herdar do acordo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={EMPTY_SELECT_VALUE}>
                                    Herdar do acordo
                                  </SelectItem>
                                  {operators.map((operator) => (
                                    <SelectItem key={operator.value} value={operator.value}>
                                      {operator.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`revenue-${index}`}>Classificacao</Label>
                              <Select
                                value={
                                  installment.tipoReceitaOrigem === "manual"
                                    ? installment.tipoReceita ?? "NOVO"
                                    : "automatico"
                                }
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
                                  <SelectItem value="automatico">Automatica</SelectItem>
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
                            placeholder="Comprovante esperado, promessa e observacoes operacionais."
                            className="min-h-20 rounded-lg border-border/70 bg-background shadow-none"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                      Preencha valores, datas e estrutura do acordo para gerar a previa das
                      parcelas.
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-sm text-muted-foreground">Previa total</p>
                    <p className="mt-1 font-mono text-lg">{formatCurrency(previewTotal)}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-sm text-muted-foreground">Diferenca para o acordo</p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-lg",
                        previewDifference === 0 ? "text-foreground" : "text-destructive",
                      )}
                    >
                      {formatCurrency(previewDifference)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-sm text-muted-foreground">Modo atual</p>
                    <p className="mt-1 text-lg font-semibold">
                      {buildAgreementModeLabel(agreementMode)}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <DialogFooter className="mx-0 mb-0 mt-auto rounded-none border-border/70 bg-muted/30 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
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
