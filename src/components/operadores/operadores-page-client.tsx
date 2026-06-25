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
  OperadorFormDialog,
  type OperadorFormValue,
} from "@/components/operadores/operador-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/clientes-utils";
import { formatDate } from "@/lib/format";
import type { OperatorRegistryPageData, OperatorRegistryRow } from "@/types/portal";

interface OperadoresPageClientProps {
  initialData: OperatorRegistryPageData;
}

function toFormValue(row: OperatorRegistryRow): OperadorFormValue {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email ?? "",
    equipeId: row.equipe_id ?? "",
    profileId: row.profileId ?? "",
    ativo: row.ativo,
  };
}

export function OperadoresPageClient({
  initialData,
}: OperadoresPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<OperatorRegistryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.operators;
    }

    return initialData.operators.filter((row) =>
      normalizeText(
        [
          row.nome,
          row.email,
          row.teamName,
          row.userName,
          row.userRole,
          row.ativo ? "ativo" : "inativo",
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.operators, query]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleStatusChange(row: OperatorRegistryRow, ativo: boolean) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/operadores/${row.id}`, {
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

        toast.success(payload.message ?? "Status do operador atualizado.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Cadastros"
        title="Operadores"
        description="Cadastre operadores manualmente, vincule equipe e conecte o perfil autenticado quando existir estrutura de usuario."
        actions={
          <>
            {initialData.canManage ? (
              <OperadorFormDialog
                teams={initialData.teams}
                profiles={initialData.profiles}
                onSaved={refreshPage}
                triggerLabel="Novo operador"
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
          { label: "Operadores exibidos", value: rows.length },
          { label: "Ativos", value: rows.filter((row) => row.ativo).length },
          { label: "Inativos", value: rows.filter((row) => !row.ativo).length },
          {
            label: "Equipes vinculadas",
            value: new Set(rows.map((row) => row.equipe_id).filter(Boolean)).size,
          },
        ]}
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome, e-mail, equipe ou usuario vinculado.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar operador"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CadastroTable
        rows={rows}
        emptyTitle="Nenhum operador encontrado"
        emptyDescription="Ajuste a busca ou cadastre um novo operador para comecar."
        columns={[
          {
            key: "nome",
            header: "Operador",
            render: (row) => (
              <div>
                <p className="font-medium">{row.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {row.email ?? "Sem e-mail cadastrado"}
                </p>
              </div>
            ),
          },
          {
            key: "equipe",
            header: "Equipe",
            render: (row) => (
              <div className="space-y-1">
                <p className="text-sm">{row.teamName}</p>
                <p className="text-xs text-muted-foreground">
                  {row.userName
                    ? `${row.userName} (${row.userRole ?? "perfil"})`
                    : "Sem usuario vinculado"}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge variant={row.ativo ? "default" : "secondary"}>
                {row.ativo ? "Ativo" : "Inativo"}
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

      <OperadorFormDialog
        key={editing?.id ?? "operator-edit-dialog"}
        open={Boolean(editing)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditing(null);
          }
        }}
        initialValue={editing ? toFormValue(editing) : null}
        teams={initialData.teams}
        profiles={initialData.profiles}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
