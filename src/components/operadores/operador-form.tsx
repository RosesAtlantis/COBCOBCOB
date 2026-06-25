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
import type { FilterOption } from "@/types/portal";

export interface OperadorFormValue {
  id?: string;
  nome: string;
  email?: string | null;
  equipeId?: string | null;
  profileId?: string | null;
  ativo?: boolean;
}

interface OperadorFormDialogProps {
  initialValue?: OperadorFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (operator: { id: string; nome: string }) => void;
  profiles: FilterOption[];
  teams: FilterOption[];
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

const emptyForm: OperadorFormValue = {
  nome: "",
  email: "",
  equipeId: "",
  profileId: "",
  ativo: true,
};

function buildFormValue(initialValue?: OperadorFormValue | null): OperadorFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    email: initialValue?.email ?? "",
    equipeId: initialValue?.equipeId ?? "",
    profileId: initialValue?.profileId ?? "",
    ativo: initialValue?.ativo ?? true,
  };
}

export function OperadorFormDialog({
  initialValue,
  open,
  onOpenChange,
  onSaved,
  profiles,
  teams,
  triggerLabel = "Novo operador",
  triggerVariant = "outline",
}: OperadorFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<OperadorFormValue>(() => buildFormValue(initialValue));

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    setForm(buildFormValue(initialValue));

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function updateField<K extends keyof OperadorFormValue>(
    key: K,
    value: OperadorFormValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const method = form.id ? "PATCH" : "POST";
        const endpoint = form.id ? `/api/operadores/${form.id}` : "/api/operadores";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email || null,
            equipeId: form.equipeId || null,
            profileId: form.profileId || null,
            ativo: form.ativo ?? true,
          }),
        });
        const payload = (await response.json()) as {
          operatorId?: string;
          message?: string;
        };

        if (!response.ok || !payload.operatorId) {
          toast.error(payload.message ?? "Nao foi possivel salvar o operador.");
          return;
        }

        toast.success(
          payload.message ??
            (form.id
              ? "Operador atualizado com sucesso."
              : "Operador cadastrado com sucesso."),
        );
        onSaved?.({
          id: payload.operatorId,
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
          <DialogTitle>{form.id ? "Editar operador" : "Novo operador"}</DialogTitle>
          <DialogDescription>
            Cadastre o operador com nome obrigatorio, equipe e usuario vinculado quando
            houver.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="operator-name">Nome do operador *</Label>
              <Input
                id="operator-name"
                required
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-email">E-mail</Label>
              <Input
                id="operator-email"
                type="email"
                value={form.email ?? ""}
                onChange={(event) => updateField("email", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Equipe</Label>
              <Select
                value={form.equipeId || "none"}
                onValueChange={(value) =>
                  updateField("equipeId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Nao definir agora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao definir agora</SelectItem>
                  {teams.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Usuario vinculado</Label>
              <Select
                value={form.profileId || "none"}
                onValueChange={(value) =>
                  updateField("profileId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Sem usuario vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem usuario vinculado</SelectItem>
                  {profiles.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description ? (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </div>
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
              {form.id ? "Salvar alteracoes" : "Salvar operador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
