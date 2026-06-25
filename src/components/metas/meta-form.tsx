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

export interface MetaFormValue {
  id?: string;
  mes: number;
  ano: number;
  valorMeta: string;
  operadorId?: string | null;
  equipeId?: string | null;
  carteiraId?: string | null;
  credorId?: string | null;
  ativo?: boolean;
}

interface MetaFormDialogProps {
  creditors: FilterOption[];
  initialValue?: MetaFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (goal: { id: string }) => void;
  operators: FilterOption[];
  teams: FilterOption[];
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  wallets: FilterOption[];
}

const now = new Date();

const emptyForm: MetaFormValue = {
  mes: now.getMonth() + 1,
  ano: now.getFullYear(),
  valorMeta: "",
  operadorId: "",
  equipeId: "",
  carteiraId: "",
  credorId: "",
  ativo: true,
};

function buildFormValue(initialValue?: MetaFormValue | null): MetaFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    valorMeta: initialValue?.valorMeta ?? "",
    operadorId: initialValue?.operadorId ?? "",
    equipeId: initialValue?.equipeId ?? "",
    carteiraId: initialValue?.carteiraId ?? "",
    credorId: initialValue?.credorId ?? "",
    ativo: initialValue?.ativo ?? true,
  };
}

const monthOptions = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function MetaFormDialog({
  creditors,
  initialValue,
  open,
  onOpenChange,
  onSaved,
  operators,
  teams,
  triggerLabel = "Nova meta",
  triggerVariant = "outline",
  wallets,
}: MetaFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<MetaFormValue>(() => buildFormValue(initialValue));

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    setForm(buildFormValue(initialValue));

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function updateField<K extends keyof MetaFormValue>(
    key: K,
    value: MetaFormValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const method = form.id ? "PATCH" : "POST";
        const endpoint = form.id ? `/api/metas/${form.id}` : "/api/metas";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mes: form.mes,
            ano: form.ano,
            valorMeta: Number(form.valorMeta || 0),
            operadorId: form.operadorId || null,
            equipeId: form.equipeId || null,
            carteiraId: form.carteiraId || null,
            credorId: form.credorId || null,
            ativo: form.ativo ?? true,
          }),
        });
        const payload = (await response.json()) as {
          goalId?: string;
          message?: string;
        };

        if (!response.ok || !payload.goalId) {
          toast.error(payload.message ?? "Nao foi possivel salvar a meta.");
          return;
        }

        toast.success(
          payload.message ??
            (form.id ? "Meta atualizada com sucesso." : "Meta cadastrada com sucesso."),
        );
        onSaved?.({ id: payload.goalId });
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

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>
            Informe mes, ano e valor. Pelo menos um vinculo operacional deve ser
            preenchido.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Mes *</Label>
              <Select
                value={String(form.mes)}
                onValueChange={(value) => updateField("mes", Number(value))}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-year">Ano *</Label>
              <Input
                id="goal-year"
                required
                type="number"
                min="2020"
                max="2100"
                value={form.ano}
                onChange={(event) => updateField("ano", Number(event.target.value))}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-value">Valor da meta *</Label>
              <Input
                id="goal-value"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.valorMeta}
                onChange={(event) => updateField("valorMeta", event.target.value)}
                className="h-11 rounded-lg"
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
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao definir</SelectItem>
                  {operators.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao definir</SelectItem>
                  {teams.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Carteira</Label>
              <Select
                value={form.carteiraId || "none"}
                onValueChange={(value) =>
                  updateField("carteiraId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao definir</SelectItem>
                  {wallets.map((option) => (
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
              <Label>Credor</Label>
              <Select
                value={form.credorId || "none"}
                onValueChange={(value) =>
                  updateField("credorId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao definir</SelectItem>
                  {creditors.map((option) => (
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
              {form.id ? "Salvar alteracoes" : "Salvar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
