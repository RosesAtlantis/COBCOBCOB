"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { roleLabels } from "@/lib/permissions";
import type {
  FilterOption,
  PortalRole,
  ProfileAuthUserOption,
} from "@/types/portal";

export interface ProfileFormValue {
  id?: string;
  userId: string;
  nome: string;
  email: string;
  perfil: PortalRole;
  operadorId?: string | null;
  equipeId?: string | null;
  ativo?: boolean;
}

interface ProfileFormDialogProps {
  initialValue?: ProfileFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (profile: { id: string; nome: string }) => void;
  authUsers: ProfileAuthUserOption[];
  operators: FilterOption[];
  teams: FilterOption[];
  serviceRoleAvailable: boolean;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

const emptyForm: ProfileFormValue = {
  userId: "",
  nome: "",
  email: "",
  perfil: "operador",
  operadorId: "",
  equipeId: "",
  ativo: true,
};

function buildFormValue(initialValue?: ProfileFormValue | null): ProfileFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    userId: initialValue?.userId ?? "",
    nome: initialValue?.nome ?? "",
    email: initialValue?.email ?? "",
    perfil: initialValue?.perfil ?? "operador",
    operadorId: initialValue?.operadorId ?? "",
    equipeId: initialValue?.equipeId ?? "",
    ativo: initialValue?.ativo ?? true,
  };
}

export function ProfileFormDialog({
  initialValue,
  open,
  onOpenChange,
  onSaved,
  authUsers,
  operators,
  teams,
  serviceRoleAvailable,
  triggerLabel = "Novo usuario",
  triggerVariant = "outline",
}: ProfileFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProfileFormValue>(() => buildFormValue(initialValue));

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;
  const isEditing = Boolean(form.id);

  function handleOpenChange(nextOpen: boolean) {
    setForm(buildFormValue(initialValue));

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function updateField<K extends keyof ProfileFormValue>(
    key: K,
    value: ProfileFormValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const method = isEditing ? "PATCH" : "POST";
        const endpoint = isEditing ? `/api/profiles/${form.id}` : "/api/profiles";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: form.userId,
            nome: form.nome,
            email: form.email,
            perfil: form.perfil,
            operadorId: form.operadorId || null,
            equipeId: form.equipeId || null,
            ativo: form.ativo ?? true,
          }),
        });
        const payload = (await response.json()) as {
          profileId?: string;
          message?: string;
        };

        if (!response.ok || !payload.profileId) {
          toast.error(payload.message ?? "Nao foi possivel salvar o usuario.");
          return;
        }

        toast.success(
          payload.message ??
            (isEditing
              ? "Usuario atualizado com sucesso."
              : "Usuario cadastrado com sucesso."),
        );
        onSaved?.({
          id: payload.profileId,
          nome: form.nome,
        });
        handleOpenChange(false);
      })();
    });
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled ? (
        <DialogTrigger render={<Button variant={triggerVariant} className="rounded-lg" />}>
          <Plus className="size-4" />
          {triggerLabel}
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar usuario" : "Novo usuario"}</DialogTitle>
          <DialogDescription>
            Gerencie o profile de acesso do portal, com papel, vinculos operacionais e status.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{serviceRoleAvailable ? "Usuario autenticado *" : "User ID do Auth *"}</Label>
              {serviceRoleAvailable && authUsers.length > 0 && !isEditing ? (
                <Select
                  value={form.userId || "none"}
                  onValueChange={(value) => {
                    const nextUserId = !value || value === "none" ? "" : value;
                    const authUser = authUsers.find((option) => option.value === nextUserId) ?? null;
                    setForm((current) => ({
                      ...current,
                      userId: nextUserId,
                      nome: current.nome || authUser?.label || "",
                      email: authUser?.email || current.email,
                    }));
                  }}
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Selecione um usuario do Supabase Auth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {authUsers.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  required
                  value={form.userId}
                  disabled={isEditing}
                  onChange={(event) => updateField("userId", event.target.value)}
                  className="h-11 rounded-lg"
                  placeholder="UUID do usuario em Authentication > Users"
                />
              )}
              {!serviceRoleAvailable ? (
                <p className="text-xs text-muted-foreground">
                  Service role indisponivel neste ambiente. Informe manualmente o `user_id` do Supabase Auth.
                </p>
              ) : authUsers.length === 0 && !isEditing ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum usuario do Supabase Auth esta disponivel para vincular neste ambiente.
                  Informe manualmente o `user_id` ou crie o usuario no Auth antes de voltar a esta tela.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome *</Label>
              <Input
                id="profile-name"
                required
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail *</Label>
              <Input
                id="profile-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil *</Label>
              <Select
                value={form.perfil}
                onValueChange={(value) => updateField("perfil", value as PortalRole)}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["admin", "gerente", "supervisor", "operador", "financeiro"] as PortalRole[])
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Operador vinculado</Label>
              <Select
                value={form.operadorId || "none"}
                onValueChange={(value) =>
                  updateField("operadorId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Nao vincular agora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao vincular agora</SelectItem>
                  {operators.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipe vinculada</Label>
              <Select
                value={form.equipeId || "none"}
                onValueChange={(value) =>
                  updateField("equipeId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Nao vincular agora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao vincular agora</SelectItem>
                  {teams.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.ativo ? "ativo" : "inativo"}
                onValueChange={(value) => updateField("ativo", value === "ativo")}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-lg" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEditing ? "Salvar alteracoes" : "Salvar usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
