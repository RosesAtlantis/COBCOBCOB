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
  canManageWallets?: boolean;
}

function buildInitialForm(
  contract: ClientContractRow | null,
  preferredWalletId?: string | null,
) {
  return {
    carteiraId: contract?.carteira_id ?? preferredWalletId ?? "",
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
    updateField("carteiraId", !value || value === "none" ? "" : value);
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedContract ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            <DialogDescription>
              Atualize saldo, carteira e dados contratuais com auditoria automatica.
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
                <div className="flex items-center justify-between gap-3">
                  <Label>Carteira *</Label>
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
                <Select value={form.carteiraId || "none"} onValueChange={handleWalletChange}>
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione" />
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
