"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Search, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

import { CreditorFormDialog, type CreditorFormValue } from "@/components/credores/creditor-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeText } from "@/lib/clientes-utils";
import { formatDate } from "@/lib/format";
import type { CreditorsPageData, CreditorListRow } from "@/types/portal";

interface CreditorsPageClientProps {
  initialData: CreditorsPageData;
}

function toFormValue(row: CreditorListRow): CreditorFormValue {
  return {
    id: row.id,
    nome: row.nome,
    codigo: row.codigo ?? "",
    documento: row.documento ?? "",
    email: row.email ?? "",
    telefone: row.telefone ?? "",
    observacao: row.observacao ?? "",
  };
}

export function CreditorsPageClient({ initialData }: CreditorsPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CreditorListRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.creditors;
    }

    return initialData.creditors.filter((row) =>
      normalizeText(
        [
          row.nome,
          row.codigo,
          row.documento,
          row.email,
          row.telefone,
          row.observacao,
          ...row.linkedWalletNames,
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.creditors, query]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.ativo).length,
      inactive: rows.filter((row) => !row.ativo).length,
      linkedWallets: rows.reduce((total, row) => total + row.linkedWalletCount, 0),
    }),
    [rows],
  );

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleStatusChange(row: CreditorListRow, ativo: boolean) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/credores/${row.id}`, {
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

        toast.success(payload.message ?? "Status do credor atualizado.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Cadastros
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Credores</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Mantenha o cadastro mestre de credores organizado para vinculo com carteiras e novos casos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {initialData.canManage ? (
              <CreditorFormDialog
                onSaved={refreshPage}
                triggerLabel="Novo credor"
              />
            ) : null}
            {initialData.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Credores exibidos</p>
            <p className="text-3xl font-semibold tracking-tight">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Ativos</p>
            <p className="text-3xl font-semibold tracking-tight">{summary.active}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Inativos</p>
            <p className="text-3xl font-semibold tracking-tight">{summary.inactive}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Carteiras vinculadas</p>
            <p className="text-3xl font-semibold tracking-tight">{summary.linkedWallets}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome, codigo, documento ou carteira vinculada.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar credor"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length ? (
        <div className="dashboard-surface overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/70 hover:bg-transparent">
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Credor
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Documento
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Contato
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Carteiras
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Atualizado em
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Acoes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="border-border/60 hover:bg-muted/15">
                    <TableCell className="px-4 py-3.5">
                      <div>
                        <p className="font-medium">{row.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.codigo ? `Codigo ${row.codigo}` : "Sem codigo cadastrado"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                      {row.documento ?? "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="space-y-1 text-sm">
                        <p>{row.email ?? "-"}</p>
                        <p className="text-muted-foreground">{row.telefone ?? "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        {row.linkedWalletNames.length ? (
                          row.linkedWalletNames.slice(0, 3).map((wallet) => (
                            <Badge key={wallet} variant="outline" className="rounded-md">
                              {wallet}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem vinculos</span>
                        )}
                        {row.linkedWalletNames.length > 3 ? (
                          <Badge variant="secondary" className="rounded-md">
                            +{row.linkedWalletNames.length - 3}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <Badge variant={row.ativo ? "default" : "secondary"}>
                        {row.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                      {formatDate(row.atualizado_em)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Nenhum credor encontrado"
          description="Ajuste a busca ou cadastre um novo credor para comecar."
        />
      )}

      <CreditorFormDialog
        key={editing?.id ?? "creditor-edit-dialog"}
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
