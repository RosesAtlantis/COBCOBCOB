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
import { MetaFormDialog, type MetaFormValue } from "@/components/metas/meta-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/clientes-utils";
import { formatCurrency, formatDate } from "@/lib/format";
import type { GoalRegistryPageData, GoalRegistryRow } from "@/types/portal";

interface MetasPageClientProps {
  initialData: GoalRegistryPageData;
}

function toFormValue(row: GoalRegistryRow): MetaFormValue {
  return {
    id: row.id,
    mes: row.mes,
    ano: row.ano,
    valorMeta: String(row.valor_meta),
    operadorId: row.operador_id ?? "",
    equipeId: row.equipe_id ?? "",
    carteiraId: row.carteira_id ?? "",
    ativo: row.ativo,
  };
}

function formatCompetencia(row: GoalRegistryRow) {
  return `${String(row.mes).padStart(2, "0")}/${row.ano}`;
}

export function MetasPageClient({ initialData }: MetasPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<GoalRegistryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.goals;
    }

    return initialData.goals.filter((row) =>
      normalizeText(
        [
          formatCompetencia(row),
          row.operatorName,
          row.teamName,
          row.walletName,
          row.creditorName,
          row.valor_meta,
          row.ativo ? "ativo" : "inativo",
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.goals, query]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleStatusChange(row: GoalRegistryRow, ativo: boolean) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/metas/${row.id}`, {
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

        toast.success(payload.message ?? "Status da meta atualizado.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Cadastros"
        title="Metas"
        description="Cadastre metas mensais por operador, equipe ou carteira, com controle manual de vigencia e status."
        actions={
          <>
            {initialData.canManage ? (
              <MetaFormDialog
                operators={initialData.operators}
                teams={initialData.teams}
                wallets={initialData.wallets}
                onSaved={refreshPage}
                triggerLabel="Nova meta"
              />
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
          { label: "Metas exibidas", value: rows.length },
          { label: "Ativas", value: rows.filter((row) => row.ativo).length },
          { label: "Inativas", value: rows.filter((row) => !row.ativo).length },
          { label: "Competencia atual", value: initialData.summary.currentMonth },
        ]}
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por competencia, responsavel, carteira ou valor.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar meta"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CadastroTable
        rows={rows}
        emptyTitle="Nenhuma meta encontrada"
        emptyDescription="Ajuste a busca ou cadastre uma nova meta para comecar."
        columns={[
          {
            key: "competencia",
            header: "Competencia",
            render: (row) => (
              <div>
                <p className="font-medium">{formatCompetencia(row)}</p>
                <p className="text-xs text-muted-foreground">
                  Atualizada em {formatDate(row.atualizado_em)}
                </p>
              </div>
            ),
          },
          {
            key: "responsavel",
            header: "Vinculos",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{row.operatorName ?? row.teamName ?? "Sem operador/equipe"}</p>
                <p className="text-muted-foreground">
                  {row.walletName ?? "Sem carteira"}
                </p>
              </div>
            ),
          },
          {
            key: "valor",
            header: "Valor da meta",
            render: (row) => (
              <span className="font-mono text-sm">{formatCurrency(row.valor_meta)}</span>
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
            key: "acoes",
            header: "Acoes",
            headerClassName:
              "h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
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

      <MetaFormDialog
        key={editing?.id ?? "goal-edit-dialog"}
        open={Boolean(editing)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditing(null);
          }
        }}
        initialValue={editing ? toFormValue(editing) : null}
        operators={initialData.operators}
        teams={initialData.teams}
        wallets={initialData.wallets}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
