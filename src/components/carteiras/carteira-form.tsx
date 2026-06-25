"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { QuickCreateCredorModal } from "@/components/credores/quick-create-credor-modal";
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
import { Textarea } from "@/components/ui/textarea";
import type { FilterOption } from "@/types/portal";

export interface CarteiraFormValue {
  id?: string;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  credorId?: string | null;
  ativo?: boolean;
}

interface CarteiraFormDialogProps {
  canQuickCreateCreditor?: boolean;
  creditors: FilterOption[];
  initialValue?: CarteiraFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (wallet: { id: string; nome: string }) => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

const emptyForm: CarteiraFormValue = {
  nome: "",
  codigo: "",
  descricao: "",
  credorId: "",
  ativo: true,
};

function buildFormValue(initialValue?: CarteiraFormValue | null): CarteiraFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    codigo: initialValue?.codigo ?? "",
    descricao: initialValue?.descricao ?? "",
    credorId: initialValue?.credorId ?? "",
    ativo: initialValue?.ativo ?? true,
  };
}

export function CarteiraFormDialog({
  canQuickCreateCreditor = false,
  creditors,
  initialValue,
  open,
  onOpenChange,
  onSaved,
  triggerLabel = "Nova carteira",
  triggerVariant = "outline",
}: CarteiraFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [quickCreditorOpen, setQuickCreditorOpen] = useState(false);
  const [form, setForm] = useState<CarteiraFormValue>(() => buildFormValue(initialValue));
  const [creditorOptions, setCreditorOptions] = useState(creditors);

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  const sortedCreditors = useMemo(
    () => [...creditorOptions].sort((left, right) => left.label.localeCompare(right.label)),
    [creditorOptions],
  );

  function handleOpenChange(nextOpen: boolean) {
    setForm(buildFormValue(initialValue));
    setCreditorOptions(creditors);

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function updateField<K extends keyof CarteiraFormValue>(
    key: K,
    value: CarteiraFormValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const method = form.id ? "PATCH" : "POST";
        const endpoint = form.id ? `/api/carteiras/${form.id}` : "/api/carteiras";
        const selectedCreditor =
          sortedCreditors.find((option) => option.value === form.credorId) ?? null;
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome,
            codigo: form.codigo || null,
            descricao: form.descricao || null,
            credorId: form.credorId || null,
            credor: selectedCreditor?.label ?? null,
            ativo: form.ativo ?? true,
          }),
        });
        const payload = (await response.json()) as {
          walletId?: string;
          message?: string;
        };

        if (!response.ok || !payload.walletId) {
          toast.error(payload.message ?? "Nao foi possivel salvar a carteira.");
          return;
        }

        toast.success(
          payload.message ??
            (form.id
              ? "Carteira atualizada com sucesso."
              : "Carteira cadastrada com sucesso."),
        );
        onSaved?.({
          id: payload.walletId,
          nome: form.nome,
        });
        handleOpenChange(false);
      })();
    });
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        {!isControlled ? (
          <DialogTrigger render={<Button variant={triggerVariant} className="rounded-lg" />}>
            <Plus className="size-4" />
            {triggerLabel}
          </DialogTrigger>
        ) : null}

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar carteira" : "Nova carteira"}</DialogTitle>
            <DialogDescription>
              Cadastre a carteira com nome obrigatorio, vinculo opcional de credor e
              status operacional.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wallet-name">Nome da carteira *</Label>
                <Input
                  id="wallet-name"
                  required
                  value={form.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-code">Codigo</Label>
                <Input
                  id="wallet-code"
                  value={form.codigo ?? ""}
                  onChange={(event) => updateField("codigo", event.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Credor</Label>
                  {canQuickCreateCreditor ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto rounded-lg px-2 py-1 text-xs"
                      onClick={() => setQuickCreditorOpen(true)}
                    >
                      <Plus className="size-3.5" />
                      Novo credor
                    </Button>
                  ) : null}
                </div>
                <Select
                  value={form.credorId || "none"}
                  onValueChange={(value) =>
                    updateField("credorId", !value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Nao vincular agora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nao vincular agora</SelectItem>
                    {sortedCreditors.map((option) => (
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wallet-description">Descricao</Label>
                <Textarea
                  id="wallet-description"
                  value={form.descricao ?? ""}
                  onChange={(event) => updateField("descricao", event.target.value)}
                  className="min-h-24 rounded-lg"
                />
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
                {form.id ? "Salvar alteracoes" : "Salvar carteira"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canQuickCreateCreditor ? (
        <QuickCreateCredorModal
          open={quickCreditorOpen}
          onOpenChange={setQuickCreditorOpen}
          onCreated={(creditor) => {
            setCreditorOptions((current) => {
              const next = current.filter((option) => option.value !== creditor.id);
              next.push({
                value: creditor.id,
                label: creditor.nome,
                description: creditor.codigo ?? undefined,
              });
              return next;
            });
            setForm((current) => ({
              ...current,
              credorId: creditor.id,
            }));
          }}
        />
      ) : null}
    </>
  );
}
