"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { formatDocument, generateAgreementInstallments } from "@/lib/clientes-utils";
import type { Client, ClientContractRow, FilterOption } from "@/types/portal";

interface AcordoFormProps {
  client: Client;
  contracts: ClientContractRow[];
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  canCreate: boolean;
}

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

export function AcordoForm({
  client,
  contracts,
  operators,
  teams,
  wallets,
  canCreate,
}: AcordoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const defaultContract = contracts[0] ?? null;
  const [contractId, setContractId] = useState<string>(defaultContract?.id ?? "");
  const [walletId, setWalletId] = useState<string>(
    findOptionValue(wallets, defaultContract?.carteira_id, null),
  );
  const [operatorId, setOperatorId] = useState<string>(
    findOptionValue(operators, client.operador_id, defaultContract?.operador_id ?? null),
  );
  const [teamId, setTeamId] = useState<string>(
    findOptionValue(teams, client.equipe_id, defaultContract?.equipe_id ?? null),
  );
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().slice(0, 10));
  const [originalValue, setOriginalValue] = useState(
    String(defaultContract?.valor_original ?? 0),
  );
  const [agreementValue, setAgreementValue] = useState(
    String(defaultContract?.valor_em_aberto ?? defaultContract?.valor_original ?? 0),
  );
  const [entryValue, setEntryValue] = useState("0");
  const [entryDueDate, setEntryDueDate] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [installmentValue, setInstallmentValue] = useState(
    String(defaultContract?.valor_em_aberto ?? defaultContract?.valor_original ?? 0),
  );
  const [firstDueDate, setFirstDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Boleto");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("ativo");

  const selectedContract = contracts.find((item) => item.id === contractId) ?? null;
  const generatedInstallments = generateAgreementInstallments({
    valorAcordo: Number(agreementValue || 0),
    valorEntrada: Number(entryValue || 0),
    quantidadeParcelas: Number(installmentsCount || 1),
    valorParcela: Number(installmentValue || 0),
    dataVencimentoEntrada: entryDueDate || null,
    primeiroVencimento: firstDueDate || null,
  });

  function handleContractChange(nextValue: string) {
    setContractId(nextValue);

    const nextContract = contracts.find((item) => item.id === nextValue);

    if (!nextContract) {
      return;
    }

    if (nextContract.carteira_id && wallets.some((item) => item.value === nextContract.carteira_id)) {
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
    setInstallmentValue(
      String(nextContract.valor_em_aberto || nextContract.valor_original),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const agreementValueNumber = Number(agreementValue);
    const entryValueNumber = Number(entryValue);
    const originalValueNumber = Number(originalValue);
    const installmentValueNumber = Number(installmentValue);
    const installmentsCountNumber = Number(installmentsCount);

    if (!agreementDate) {
      toast.error("Informe a data do acordo.");
      return;
    }

    if (!Number.isFinite(agreementValueNumber) || agreementValueNumber <= 0) {
      toast.error("Informe um valor de acordo valido.");
      return;
    }

    if (!Number.isFinite(installmentsCountNumber) || installmentsCountNumber < 1) {
      toast.error("A quantidade de parcelas deve ser maior ou igual a 1.");
      return;
    }

    if (entryValueNumber > 0 && !entryDueDate) {
      toast.error("Informe o vencimento da entrada.");
      return;
    }

    if (agreementValueNumber - entryValueNumber > 0 && !firstDueDate) {
      toast.error("Informe o primeiro vencimento.");
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
            dataVencimentoEntrada: entryDueDate || null,
            quantidadeParcelas: installmentsCountNumber,
            valorParcela: installmentValueNumber || null,
            primeiroVencimento: firstDueDate || null,
            formaPagamento: paymentMethod || null,
            observacao: note || null,
            status,
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
        onClick={() => setOpen(true)}
        disabled={!canCreate}
      >
        <Plus className="size-4" />
        Cadastrar acordo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Novo acordo</DialogTitle>
            <DialogDescription>
              A ficha do cliente ja entra preenchida. Ajuste contrato, valores,
              vencimentos e valide a geracao das parcelas antes de salvar.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value ?? "ativo")}
                >
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
                        {`${contract.numero_contrato} • aberto ${formatCurrency(contract.valor_em_aberto)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletId">Carteira</Label>
                <Select
                  value={walletId || "none"}
                  onValueChange={(value) =>
                    setWalletId(!value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="walletId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione a carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {wallets.map((wallet) => (
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
                  onValueChange={(value) =>
                    setOperatorId(!value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="operatorId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione o operador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
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
                  onValueChange={(value) =>
                    setTeamId(!value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="teamId" className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
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
                  onChange={(event) => setAgreementValue(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryValue">Valor de entrada</Label>
                <Input
                  id="entryValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryValue}
                  onChange={(event) => setEntryValue(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryDueDate">Vencimento da entrada</Label>
                <Input
                  id="entryDueDate"
                  type="date"
                  value={entryDueDate}
                  onChange={(event) => setEntryDueDate(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installmentsCount">Quantidade de parcelas</Label>
                <Input
                  id="installmentsCount"
                  type="number"
                  min="1"
                  step="1"
                  value={installmentsCount}
                  onChange={(event) => setInstallmentsCount(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installmentValue">Valor da parcela</Label>
                <Input
                  id="installmentValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={installmentValue}
                  onChange={(event) => setInstallmentValue(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstDueDate">Primeiro vencimento</Label>
                <Input
                  id="firstDueDate"
                  type="date"
                  value={firstDueDate}
                  onChange={(event) => setFirstDueDate(event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="paymentMethod">Forma de pagamento</Label>
                <Input
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  placeholder="Boleto, PIX, transferencia..."
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label htmlFor="note">Observacao</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Observacoes comerciais, condicoes negociadas ou ressalvas."
                  className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Previa das parcelas</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract
                      ? `Contrato ${selectedContract.numero_contrato}`
                      : "Acordo sem contrato vinculado"}
                  </p>
                </div>
                <p className="text-sm font-medium text-primary">
                  {generatedInstallments.length} item(ns) gerado(s)
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {generatedInstallments.length ? (
                  generatedInstallments.map((installment) => (
                    <div
                      key={`${installment.numeroParcela}-${installment.dataVencimento}`}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-background px-3 py-3 text-sm md:flex-row md:items-center"
                    >
                      <div>
                        <p className="font-medium">
                          Parcela {installment.numeroParcela} • {installment.tipo}
                        </p>
                        <p className="text-muted-foreground">
                          Vencimento {installment.dataVencimento}
                        </p>
                      </div>
                      <p className="font-mono">{formatCurrency(installment.valorParcela)}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                    Preencha valor, quantidade e vencimentos para gerar a previa.
                  </div>
                )}
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
    </>
  );
}
