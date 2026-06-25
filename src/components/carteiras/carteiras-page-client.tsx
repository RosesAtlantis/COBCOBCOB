"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

import { CadastroHeader } from "@/components/cadastros/cadastro-header";
import { CadastroSummaryGrid } from "@/components/cadastros/cadastro-summary-grid";
import { CadastroTable } from "@/components/cadastros/cadastro-table";
import {
  CarteiraFormDialog,
  type CarteiraFormValue,
} from "@/components/carteiras/carteira-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/clientes-utils";
import { formatDate } from "@/lib/format";
import type { WalletRegistryPageData, WalletRegistryRow } from "@/types/portal";

interface CarteirasPageClientProps {
  initialData: WalletRegistryPageData;
}

function toFormValue(row: WalletRegistryRow): CarteiraFormValue {
  return {
    id: row.id,
    nome: row.nome,
    codigo: row.codigo ?? "",
    descricao: row.descricao ?? "",
    documento: row.documento ?? "",
    telefone: row.telefone ?? "",
    email: row.email ?? "",
    observacao: row.observacao ?? "",
    ativo: row.ativo,
  };
}

export function CarteirasPageClient({
  initialData,
}: CarteirasPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<WalletRegistryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.wallets;
    }

    return initialData.wallets.filter((row) =>
      normalizeText(
        [
          row.nome,
          row.codigo,
          row.descricao,
          row.documento,
          row.telefone,
          row.email,
          row.observacao,
          row.ativo ? "ativo" : "inativo",
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.wallets, query]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleStatusChange(row: WalletRegistryRow, ativo: boolean) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/carteiras/${row.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ativo }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel atualizar o status.");
          return;
        }

        toast.success(payload.message ?? "Status da carteira atualizado.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Cadastros"
        title="Carteiras"
        description="Cadastre carteiras manualmente e mantenha o cadastro operacional pronto para novos casos, contratos e filtros."
        actions={
          <>
            {initialData.canManage ? (
              <CarteiraFormDialog onSaved={refreshPage} triggerLabel="Nova carteira" />
            ) : null}
            {initialData.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </>
        }
      />

      <CadastroSummaryGrid
        items={[
          { label: "Carteiras exibidas", value: rows.length },
          { label: "Ativas", value: rows.filter((row) => row.ativo).length },
          { label: "Inativas", value: rows.filter((row) => !row.ativo).length },
          {
            label: "Clientes vinculados",
            value: rows.reduce((total, row) => total + row.linkedClients, 0),
          },
        ]}
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome, codigo, documento, contato ou anotacoes.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar carteira"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CadastroTable
        rows={rows}
        emptyTitle="Nenhuma carteira encontrada"
        emptyDescription="Ajuste a busca ou cadastre uma nova carteira para comecar."
        columns={[
          {
            key: "nome",
            header: "Carteira",
            render: (row) => (
              <div>
                <p className="font-medium">{row.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {row.codigo ? `Codigo ${row.codigo}` : "Sem codigo cadastrado"}
                </p>
              </div>
            ),
          },
          {
            key: "contato",
            header: "Contato",
            render: (row) => (
              <div className="space-y-1">
                <p className="text-sm">{row.telefone ?? "Sem telefone cadastrado"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.email ?? "Sem e-mail cadastrado"}
                </p>
              </div>
            ),
          },
          {
            key: "dados",
            header: "Dados",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{row.documento ?? "Sem documento cadastrado"}</p>
                <p className="text-muted-foreground">
                  {row.descricao ?? row.observacao ?? "Sem observacoes adicionais"}
                </p>
              </div>
            ),
          },
          {
            key: "vinculos",
            header: "Vinculos",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{row.linkedClients} cliente(s)</p>
                <p className="text-muted-foreground">{row.linkedContracts} contrato(s)</p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge variant={row.ativo ? "default" : "secondary"}>
                {row.ativo ? "Ativa" : "Inativa"}
              </Badge>
            ),
          },
          {
            key: "atualizado",
            header: "Atualizado em",
            render: (row) => (
              <span className="text-sm text-muted-foreground">
                {formatDate(row.atualizado_em)}
              </span>
            ),
          },
          {
            key: "acoes",
            header: "Acoes",
            headerClassName:
              "h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
            className: "px-4 py-3.5",
            render: (row) => (
              <div className="flex justify-end gap-2">
                {initialData.canManage ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setEditing(row)}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={isPending}
                      onClick={() => handleStatusChange(row, !row.ativo)}
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : row.ativo ? (
                        <ToggleLeft className="size-4" />
                      ) : (
                        <ToggleRight className="size-4" />
                      )}
                      {row.ativo ? "Inativar" : "Ativar"}
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline" className="rounded-md">
                    <ShieldCheck className="size-3.5" />
                    Leitura
                  </Badge>
                )}
              </div>
            ),
          },
        ]}
      />

      <CarteiraFormDialog
        key={editing?.id ?? "wallet-edit-dialog"}
        open={Boolean(editing)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditing(null);
          }
        }}
        initialValue={editing ? toFormValue(editing) : null}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
