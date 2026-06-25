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
  EquipeFormDialog,
  type EquipeFormValue,
} from "@/components/equipes/equipe-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/clientes-utils";
import { formatDate } from "@/lib/format";
import type { TeamRegistryPageData, TeamRegistryRow } from "@/types/portal";

interface EquipesPageClientProps {
  initialData: TeamRegistryPageData;
}

function toFormValue(row: TeamRegistryRow): EquipeFormValue {
  return {
    id: row.id,
    nome: row.nome,
    supervisorId: row.supervisor_id ?? "",
    ativo: row.ativo,
  };
}

export function EquipesPageClient({ initialData }: EquipesPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TeamRegistryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.teams;
    }

    return initialData.teams.filter((row) =>
      normalizeText(
        [
          row.nome,
          row.supervisorName,
          row.operatorsCount,
          row.ativo ? "ativo" : "inativo",
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.teams, query]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleStatusChange(row: TeamRegistryRow, ativo: boolean) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/equipes/${row.id}`, {
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

        toast.success(payload.message ?? "Status da equipe atualizado.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Cadastros"
        title="Equipes"
        description="Estruture os times manualmente, defina supervisores e mantenha a organizacao operacional sob controle."
        actions={
          <>
            {initialData.canManage ? (
              <EquipeFormDialog
                supervisors={initialData.supervisors}
                onSaved={refreshPage}
                triggerLabel="Nova equipe"
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
          { label: "Equipes exibidas", value: rows.length },
          { label: "Ativas", value: rows.filter((row) => row.ativo).length },
          { label: "Inativas", value: rows.filter((row) => !row.ativo).length },
          {
            label: "Operadores vinculados",
            value: rows.reduce((total, row) => total + row.operatorsCount, 0),
          },
        ]}
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome da equipe, supervisor ou volume de operadores.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar equipe"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CadastroTable
        rows={rows}
        emptyTitle="Nenhuma equipe encontrada"
        emptyDescription="Ajuste a busca ou cadastre uma nova equipe para comecar."
        columns={[
          {
            key: "nome",
            header: "Equipe",
            render: (row) => (
              <div>
                <p className="font-medium">{row.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {row.operatorsCount} operador(es) vinculado(s)
                </p>
              </div>
            ),
          },
          {
            key: "supervisor",
            header: "Supervisor",
            render: (row) => (
              <span className="text-sm">{row.supervisorName ?? "Nao vinculado"}</span>
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

      <EquipeFormDialog
        key={editing?.id ?? "team-edit-dialog"}
        open={Boolean(editing)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditing(null);
          }
        }}
        initialValue={editing ? toFormValue(editing) : null}
        supervisors={initialData.supervisors}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
