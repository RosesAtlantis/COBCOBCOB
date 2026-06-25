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
  ProfileFormDialog,
  type ProfileFormValue,
} from "@/components/profiles/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/clientes-utils";
import { formatDate } from "@/lib/format";
import { roleLabels } from "@/lib/permissions";
import type { ProfileRegistryPageData, ProfileRegistryRow } from "@/types/portal";

interface ProfilesPageClientProps {
  initialData: ProfileRegistryPageData;
}

function toFormValue(row: ProfileRegistryRow): ProfileFormValue {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    email: row.email,
    perfil: row.perfil,
    operadorId: row.operador_id ?? "",
    equipeId: row.equipe_id ?? "",
    ativo: row.ativo,
  };
}

export function ProfilesPageClient({
  initialData,
}: ProfilesPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProfileRegistryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.profiles;
    }

    return initialData.profiles.filter((row) =>
      normalizeText(
        [
          row.nome,
          row.email,
          row.perfil,
          row.operatorName,
          row.teamName,
          row.ativo ? "ativo" : "inativo",
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.profiles, query]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleStatusChange(row: ProfileRegistryRow, ativo: boolean) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/profiles/${row.id}`, {
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

        toast.success(payload.message ?? "Status do usuario atualizado.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Administracao"
        title="Usuarios e perfis"
        description="Gerencie quem pode acessar o portal, o papel de cada profile e os vinculos com operador e equipe."
        actions={
          <>
            {initialData.canManage ? (
              <ProfileFormDialog
                authUsers={initialData.authUsers}
                operators={initialData.operators}
                teams={initialData.teams}
                serviceRoleAvailable={initialData.serviceRoleAvailable}
                onSaved={refreshPage}
                triggerLabel="Novo usuario"
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
          { label: "Usuarios exibidos", value: rows.length },
          { label: "Ativos", value: rows.filter((row) => row.ativo).length },
          { label: "Inativos", value: rows.filter((row) => !row.ativo).length },
          { label: "Perfis admin", value: rows.filter((row) => row.perfil === "admin").length },
        ]}
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome, e-mail, perfil, operador ou equipe.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar usuario"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CadastroTable
        rows={rows}
        emptyTitle="Nenhum usuario encontrado"
        emptyDescription="Cadastre o primeiro profile para liberar acesso ao portal."
        columns={[
          {
            key: "nome",
            header: "Usuario",
            render: (row) => (
              <div>
                <p className="font-medium">{row.nome}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            key: "perfil",
            header: "Perfil",
            render: (row) => (
              <Badge variant={row.ativo ? "default" : "secondary"}>
                {roleLabels[row.perfil]}
              </Badge>
            ),
          },
          {
            key: "vinculos",
            header: "Vinculos",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{row.operatorName ?? "Sem operador"}</p>
                <p className="text-muted-foreground">{row.teamName ?? "Sem equipe"}</p>
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

      <ProfileFormDialog
        key={editing?.id ?? "profile-edit-dialog"}
        open={Boolean(editing)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditing(null);
          }
        }}
        initialValue={editing ? toFormValue(editing) : null}
        authUsers={initialData.authUsers}
        operators={initialData.operators}
        teams={initialData.teams}
        serviceRoleAvailable={initialData.serviceRoleAvailable}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
