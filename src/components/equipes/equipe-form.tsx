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

export interface EquipeFormValue {
  id?: string;
  nome: string;
  supervisorId?: string | null;
  ativo?: boolean;
}

interface EquipeFormDialogProps {
  initialValue?: EquipeFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (team: { id: string; nome: string }) => void;
  supervisors: FilterOption[];
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

const emptyForm: EquipeFormValue = {
  nome: "",
  supervisorId: "",
  ativo: true,
};

function buildFormValue(initialValue?: EquipeFormValue | null): EquipeFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    supervisorId: initialValue?.supervisorId ?? "",
    ativo: initialValue?.ativo ?? true,
  };
}

export function EquipeFormDialog({
  initialValue,
  open,
  onOpenChange,
  onSaved,
  supervisors,
  triggerLabel = "Nova equipe",
  triggerVariant = "outline",
}: EquipeFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<EquipeFormValue>(() => buildFormValue(initialValue));

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    setForm(buildFormValue(initialValue));

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function updateField<K extends keyof EquipeFormValue>(
    key: K,
    value: EquipeFormValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const method = form.id ? "PATCH" : "POST";
        const endpoint = form.id ? `/api/equipes/${form.id}` : "/api/equipes";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome,
            supervisorId: form.supervisorId || null,
            ativo: form.ativo ?? true,
          }),
        });
        const payload = (await response.json()) as {
          teamId?: string;
          message?: string;
        };

        if (!response.ok || !payload.teamId) {
          toast.error(payload.message ?? "Nao foi possivel salvar a equipe.");
          return;
        }

        toast.success(
          payload.message ??
            (form.id ? "Equipe atualizada com sucesso." : "Equipe cadastrada com sucesso."),
        );
        onSaved?.({
          id: payload.teamId,
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

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar equipe" : "Nova equipe"}</DialogTitle>
          <DialogDescription>
            Defina o nome da equipe, o supervisor responsavel e o status operacional.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nome da equipe *</Label>
              <Input
                id="team-name"
                required
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Supervisor</Label>
              <Select
                value={form.supervisorId || "none"}
                onValueChange={(value) =>
                  updateField("supervisorId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Nao vincular agora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao vincular agora</SelectItem>
                  {supervisors.map((option) => (
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
                  <SelectItem value="ativo">Ativa</SelectItem>
                  <SelectItem value="inativo">Inativa</SelectItem>
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
              {form.id ? "Salvar alteracoes" : "Salvar equipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
