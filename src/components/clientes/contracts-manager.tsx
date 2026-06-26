"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { QuickCreateCarteiraModal } from "@/components/carteiras/quick-create-carteira-modal";
import { EmptyState } from "@/components/empty-state";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import { formatCurrencyInputValue } from "@/lib/formatters";
import { maskCurrencyInput } from "@/lib/masks";
import { parseCurrencyBR } from "@/lib/validators";
import type { ClientContractRow, FilterOption } from "@/types/portal";

interface ContractsManagerProps {
  clientId: string;
  contracts: ClientContractRow[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  operators: FilterOption[];
  teams: FilterOption[];
  preferredWalletId?: string | null;
  canEdit: boolean;
  canManageCreditors?: boolean;
  canManageWallets?: boolean;
}

const EMPTY_SELECT_VALUE = "__empty__";

function resolveSelectValue(
  options: FilterOption[],
  value: string | null | undefined,
) {
  return value && options.some((option) => option.value === value)
    ? value
    : EMPTY_SELECT_VALUE;
}

function buildInitialForm(
  contract: ClientContractRow | null,
  preferredWalletId?: string | null,
) {
  return {
    carteiraId: contract?.carteira_id ?? preferredWalletId ?? "",
    numeroContrato: contract?.numero_contrato ?? "",
    valorOriginal: formatCurrencyInputValue(contract?.valor_original ?? null),
    valorEmAberto: formatCurrencyInputValue(contract?.valor_em_aberto ?? null),
    dataContrato: contract?.data_contrato ?? "",
    dataVencimento: contract?.data_vencimento ?? "",
    status: contract?.status ?? "aberto",
    operadorId: contract?.operador_id ?? "",
    equipeId: contract?.equipe_id ?? "",
    observacao: contract?.observacao ?? "",
  };
}

export function ContractsManager({
  clientId,
  contracts,
  wallets,
  operators,
  teams,
  preferredWalletId,
  canEdit,
  canManageWallets = false,
}: ContractsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedContract, setSelectedContract] = useState<ClientContractRow | null>(null);
  const [open, setOpen] = useState(false);
  const [quickWalletOpen, setQuickWalletOpen] = useState(false);
  const [walletOptions, setWalletOptions] = useState(wallets);
  const [form, setForm] = useState(() => buildInitialForm(null, preferredWalletId));

  function openCreate() {
    setSelectedContract(null);
    setForm(buildInitialForm(null, preferredWalletId));
    setOpen(true);
  }

  function openEdit(contract: ClientContractRow) {
    setSelectedContract(contract);
    setForm(buildInitialForm(contract, preferredWalletId));
    setOpen(true);
  }

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K] | null,
  ) {
    setForm((current) => ({ ...current, [key]: (value ?? "") as (typeof form)[K] }));
  }

  function handleWalletChange(value: string | null) {
    updateField("carteiraId", !value || value === EMPTY_SELECT_VALUE ? "" : value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const originalValue = parseCurrencyBR(form.valorOriginal);
    const openValue = parseCurrencyBR(form.valorEmAberto);

    if (!form.numeroContrato.trim()) {
      toast.error("Informe o numero do contrato.");
      return;
    }

    if (!form.carteiraId) {
      toast.error("Selecione a carteira do contrato.");
      return;
    }

    if (form.valorOriginal.trim() && originalValue === null) {
      toast.error("Informe um valor original valido.");
      return;
    }

    if (form.valorEmAberto.trim() && openValue === null) {
      toast.error("Informe um valor em aberto valido.");
      return;
    }

    const url = selectedContract
      ? `/api/contratos/${selectedContract.id}`
      : `/api/clientes/${clientId}/contratos`;
    const method = selectedContract ? "PATCH" : "POST";

    startTransition(() => {
      void (async () => {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente_id: clientId,
            carteira_id: form.carteiraId || null,
            numero_contrato: form.numeroContrato,
            valor_original: originalValue,
            valor_em_aberto: openValue,
            data_contrato: form.dataContrato || null,
            data_vencimento: form.dataVencimento || null,
            status: form.status || null,
            operador_id: form.operadorId || null,
            equipe_id: form.equipeId || null,
            observacao: form.observacao || null,
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel salvar o contrato.");
          return;
        }

        toast.success(selectedContract ? "Contrato atualizado." : "Contrato criado.");
        setOpen(false);
        router.refresh();
      })();
    });
  }

  if (!contracts.length && !canEdit) {
    return (
      <EmptyState
        title="Sem contratos vinculados"
        description="Ainda nao existem contratos visiveis na ficha deste cliente."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contratos vinculados</h2>
          <p className="text-sm text-muted-foreground">
            Base contratual que sustenta a cobranca e os acordos deste cliente.
          </p>
        </div>
        {canEdit ? (
          <Button type="button" variant="outline" className="rounded-lg" onClick={openCreate}>
            <Plus className="size-4" />
            Adicionar contrato
          </Button>
        ) : null}
      </div>

      {contracts.length ? (
        <div className="dashboard-surface overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/70 hover:bg-transparent">
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Contrato
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Carteira
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Valor original
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Em aberto
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Acordos
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pago
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </TableHead>
                  {canEdit ? (
                    <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Acoes
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} className="border-border/60 hover:bg-muted/15">
                    <TableCell className="px-4 py-3.5 text-sm">{contract.numero_contrato}</TableCell>
                    <TableCell className="px-4 py-3.5 text-sm">{contract.carteira}</TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                      {formatCurrency(contract.valor_original)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                      {formatCurrency(contract.valor_em_aberto)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right text-sm">
                      {formatNumber(contract.acordosAtivos)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                      {formatCurrency(contract.valorPago)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm">{contract.status}</TableCell>
                    {canEdit ? (
                      <TableCell className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => openEdit(contract)}
                        >
                          <Edit3 className="size-4" />
                          Editar
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Sem contratos vinculados"
          description="Use o botao acima para cadastrar o primeiro contrato desta ficha."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl overflow-hidden p-0 sm:w-[calc(100vw-2rem)]">
          <DialogHeader className="gap-1 border-b border-border/70 px-6 py-5">
            <DialogTitle>{selectedContract ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            <DialogDescription>
              Ajuste contrato, carteira, datas e responsaveis em um formulario mais claro.
            </DialogDescription>
          </DialogHeader>

          <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
            <div className="max-h-[72vh] space-y-5 overflow-y-auto overflow-x-hidden px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Numero do contrato *</Label>
                  <Input
                    id="contractNumber"
                    required
                    value={form.numeroContrato}
                    onChange={(event) => updateField("numeroContrato", event.target.value)}
                    placeholder="Ex.: 12345/2026"
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractWallet">Carteira *</Label>
                  <Select
                    value={resolveSelectValue(walletOptions, form.carteiraId)}
                    onValueChange={handleWalletChange}
                  >
                    <SelectTrigger
                      id="contractWallet"
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
                  <Label htmlFor="contractStatus">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => updateField("status", value ?? "aberto")}
                  >
                    <SelectTrigger
                      id="contractStatus"
                      className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_acordo">Em acordo</SelectItem>
                      <SelectItem value="quitado">Quitado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractOriginalValue">Valor original</Label>
                  <Input
                    id="contractOriginalValue"
                    inputMode="decimal"
                    value={form.valorOriginal}
                    onChange={(event) =>
                      updateField("valorOriginal", maskCurrencyInput(event.target.value))
                    }
                    placeholder="R$ 0,00"
                    className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractOpenValue">Valor em aberto</Label>
                  <Input
                    id="contractOpenValue"
                    inputMode="decimal"
                    value={form.valorEmAberto}
                    onChange={(event) =>
                      updateField("valorEmAberto", maskCurrencyInput(event.target.value))
                    }
                    placeholder="R$ 0,00"
                    className="h-11 rounded-lg border-border/70 bg-background text-right font-mono shadow-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractDate">Data do contrato</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={form.dataContrato}
                    onChange={(event) => updateField("dataContrato", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractDueDate">Data de vencimento</Label>
                  <Input
                    id="contractDueDate"
                    type="date"
                    value={form.dataVencimento}
                    onChange={(event) => updateField("dataVencimento", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractOperator">Operador</Label>
                  <Select
                    value={resolveSelectValue(operators, form.operadorId)}
                    onValueChange={(value) =>
                      updateField("operadorId", !value || value === EMPTY_SELECT_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger
                      id="contractOperator"
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
                  <Label htmlFor="contractTeam">Equipe</Label>
                  <Select
                    value={resolveSelectValue(teams, form.equipeId)}
                    onValueChange={(value) =>
                      updateField("equipeId", !value || value === EMPTY_SELECT_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger
                      id="contractTeam"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractNote">Observacao</Label>
                <Textarea
                  id="contractNote"
                  value={form.observacao}
                  onChange={(event) => updateField("observacao", event.target.value)}
                  placeholder="Detalhes operacionais, observacoes comerciais e contexto do contrato."
                  className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 mt-auto rounded-none border-border/70 bg-muted/30 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-lg" disabled={isPending}>
                <Save className={`size-4${isPending ? " animate-pulse" : ""}`} />
                Salvar contrato
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
            setForm((current) => ({
              ...current,
              carteiraId: wallet.id,
            }));
          }}
        />
      ) : null}
    </div>
  );
}
