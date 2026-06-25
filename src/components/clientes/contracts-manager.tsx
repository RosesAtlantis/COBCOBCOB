"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { QuickCreateCredorModal } from "@/components/credores/quick-create-credor-modal";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
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
}

function buildInitialForm(
  contract: ClientContractRow | null,
  preferredWalletId?: string | null,
  creditorId?: string,
) {
  return {
    carteiraId: contract?.carteira_id ?? preferredWalletId ?? "",
    credorId: creditorId ?? "",
    credor: contract?.credor ?? "",
    numeroContrato: contract?.numero_contrato ?? "",
    valorOriginal: String(contract?.valor_original ?? 0),
    valorEmAberto: String(contract?.valor_em_aberto ?? 0),
    dataContrato: contract?.data_contrato ?? "",
    dataVencimento: contract?.data_vencimento ?? "",
    status: contract?.status ?? "aberto",
    operadorId: contract?.operador_id ?? "",
    equipeId: contract?.equipe_id ?? "",
    observacao: contract?.observacao ?? "",
  };
}

function resolveCreditorIdFromWallet(
  walletId: string | null | undefined,
  wallets: FilterOption[],
  creditors: FilterOption[],
) {
  if (!walletId) {
    return "";
  }

  const wallet = wallets.find((item) => item.value === walletId);

  if (!wallet?.description) {
    return "";
  }

  return creditors.find((item) => item.label === wallet.description)?.value ?? "";
}

function resolveInitialCreditorId(
  contract: ClientContractRow | null,
  creditors: FilterOption[],
) {
  if (!contract) {
    return "";
  }

  if (contract.credor_id) {
    const byId = creditors.find((item) => item.value === contract.credor_id);

    if (byId) {
      return byId.value;
    }
  }

  if (contract.credor) {
    const byName = creditors.find((item) => item.label === contract.credor);

    if (byName) {
      return byName.value;
    }
  }

  return "";
}

export function ContractsManager({
  clientId,
  contracts,
  wallets,
  creditors,
  operators,
  teams,
  preferredWalletId,
  canEdit,
  canManageCreditors = false,
}: ContractsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedContract, setSelectedContract] = useState<ClientContractRow | null>(null);
  const [open, setOpen] = useState(false);
  const [quickCreditorOpen, setQuickCreditorOpen] = useState(false);
  const [creditorOptions, setCreditorOptions] = useState(creditors);
  const sortedCreditors = useMemo(
    () => [...creditorOptions].sort((left, right) => left.label.localeCompare(right.label)),
    [creditorOptions],
  );
  const [form, setForm] = useState(() =>
    buildInitialForm(
      null,
      preferredWalletId,
      resolveCreditorIdFromWallet(preferredWalletId, wallets, creditors),
    ),
  );

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.value === form.carteiraId) ?? null,
    [form.carteiraId, wallets],
  );

  const selectedCreditor = useMemo(
    () => sortedCreditors.find((creditor) => creditor.value === form.credorId) ?? null,
    [form.credorId, sortedCreditors],
  );

  function openCreate() {
    setSelectedContract(null);
    setForm(
      buildInitialForm(
        null,
        preferredWalletId,
        resolveCreditorIdFromWallet(preferredWalletId, wallets, creditorOptions),
      ),
    );
    setOpen(true);
  }

  function openEdit(contract: ClientContractRow) {
    setSelectedContract(contract);
    setForm(
      buildInitialForm(
        contract,
        preferredWalletId,
        resolveInitialCreditorId(contract, creditorOptions),
      ),
    );
    setOpen(true);
  }

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K] | null,
  ) {
    setForm((current) => ({ ...current, [key]: (value ?? "") as (typeof form)[K] }));
  }

  function handleWalletChange(value: string | null) {
    const nextWalletId = !value || value === "none" ? "" : value;
    const nextCreditorId = resolveCreditorIdFromWallet(
      nextWalletId,
      wallets,
      creditorOptions,
    );
    const nextCreditor =
      sortedCreditors.find((option) => option.value === nextCreditorId)?.label ?? "";

    setForm((current) => ({
      ...current,
      carteiraId: nextWalletId,
      credorId: nextCreditorId || current.credorId,
      credor: nextCreditor || current.credor,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
            carteiraId: form.carteiraId || null,
            credorId: form.credorId || null,
            credor: (selectedCreditor?.label ?? form.credor) || null,
            numeroContrato: form.numeroContrato,
            valorOriginal: Number(form.valorOriginal || 0),
            valorEmAberto: Number(form.valorEmAberto || 0),
            dataContrato: form.dataContrato || null,
            dataVencimento: form.dataVencimento || null,
            status: form.status || null,
            operadorId: form.operadorId || null,
            equipeId: form.equipeId || null,
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
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Credor
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
                    <TableCell className="px-4 py-3.5 text-sm">{contract.credor}</TableCell>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedContract ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            <DialogDescription>
              Atualize saldo, vinculos e dados contratuais com auditoria automatica.
              {selectedContract ? "" : " A carteira principal ja vem sugerida para acelerar o cadastro."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Contrato *</Label>
                <Input
                  required
                  value={form.numeroContrato}
                  onChange={(event) => updateField("numeroContrato", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Carteira *</Label>
                <Select value={form.carteiraId || "none"} onValueChange={handleWalletChange}>
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione" />
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
                <div className="flex items-center justify-between gap-3">
                  <Label>Credor</Label>
                  {canManageCreditors ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto rounded-lg px-2 py-1 text-xs"
                      onClick={() => setQuickCreditorOpen(true)}
                    >
                      <Plus className="size-3.5" />
                      Novo credor
                    </Button>
                  ) : null}
                </div>
                <Select
                  value={form.credorId || "none"}
                  onValueChange={(value) => {
                    const nextCredorId = !value || value === "none" ? "" : value;
                    const nextCredor =
                      sortedCreditors.find((option) => option.value === nextCredorId)?.label ??
                      "";
                    setForm((current) => ({
                      ...current,
                      credorId: nextCredorId,
                      credor: nextCredor,
                    }));
                  }}
                >
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Nao informar agora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nao informar agora</SelectItem>
                    {sortedCreditors.map((creditor) => (
                      <SelectItem key={creditor.value} value={creditor.value}>
                        <div className="flex flex-col">
                          <span>{creditor.label}</span>
                          {creditor.description ? (
                            <span className="text-xs text-muted-foreground">
                              {creditor.description}
                            </span>
                          ) : null}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWallet?.description ? (
                  <p className="text-xs text-muted-foreground">
                    Credor sugerido pela carteira: {selectedWallet.description}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => updateField("status", value ?? "aberto")}
                >
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
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
              <div className="space-y-2">
                <Label>Valor original</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorOriginal}
                  onChange={(event) => updateField("valorOriginal", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor em aberto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorEmAberto}
                  onChange={(event) => updateField("valorEmAberto", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Data contrato</Label>
                <Input
                  type="date"
                  value={form.dataContrato}
                  onChange={(event) => updateField("dataContrato", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Data vencimento</Label>
                <Input
                  type="date"
                  value={form.dataVencimento}
                  onChange={(event) => updateField("dataVencimento", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Operador</Label>
                <Select
                  value={form.operadorId || "none"}
                  onValueChange={(value) =>
                    updateField("operadorId", !value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione" />
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
                <Label>Equipe</Label>
                <Select
                  value={form.equipeId || "none"}
                  onValueChange={(value) =>
                    updateField("equipeId", !value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-2 md:col-span-2 xl:col-span-4">
                <Label>Observacao</Label>
                <Textarea
                  value={form.observacao}
                  onChange={(event) => updateField("observacao", event.target.value)}
                  className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-lg" disabled={isPending}>
                <Save className={`size-4${isPending ? " animate-pulse" : ""}`} />
                Salvar contrato
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {canManageCreditors ? (
        <QuickCreateCredorModal
          open={quickCreditorOpen}
          onOpenChange={setQuickCreditorOpen}
          onCreated={(creditor) => {
            setCreditorOptions((current) => {
              const next = current.filter((option) => option.value !== creditor.id);
              next.push({
                value: creditor.id,
                label: creditor.nome,
                description: creditor.codigo ?? undefined,
              });
              return next;
            });
            setForm((current) => ({
              ...current,
              credorId: creditor.id,
              credor: creditor.nome,
            }));
          }}
        />
      ) : null}
    </div>
  );
}
