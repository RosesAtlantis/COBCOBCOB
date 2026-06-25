"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export interface CreditorFormValue {
  id?: string;
  nome: string;
  codigo?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacao?: string | null;
}

interface CreditorFormDialogProps {
  compact?: boolean;
  initialValue?: CreditorFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (creditor: { id: string; nome: string; codigo?: string | null }) => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

const emptyForm: CreditorFormValue = {
  nome: "",
  codigo: "",
  documento: "",
  email: "",
  telefone: "",
  observacao: "",
};

function buildCreditorFormValue(initialValue?: CreditorFormValue | null): CreditorFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    codigo: initialValue?.codigo ?? "",
    documento: initialValue?.documento ?? "",
    email: initialValue?.email ?? "",
    telefone: initialValue?.telefone ?? "",
    observacao: initialValue?.observacao ?? "",
  };
}

export function CreditorFormDialog({
  compact = false,
  initialValue,
  open,
  onOpenChange,
  onSaved,
  triggerLabel = "Novo credor",
  triggerVariant = "outline",
}: CreditorFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CreditorFormValue>(() =>
    buildCreditorFormValue(initialValue),
  );
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    setForm(buildCreditorFormValue(initialValue));
    setShowMoreInfo(Boolean(initialValue?.codigo || initialValue?.documento || initialValue?.email || initialValue?.telefone));

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function updateField<K extends keyof CreditorFormValue>(
    key: K,
    value: CreditorFormValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const method = form.id ? "PATCH" : "POST";
        const endpoint = form.id ? `/api/credores/${form.id}` : "/api/credores";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome,
            codigo: form.codigo || null,
            documento: form.documento || null,
            email: form.email || null,
            telefone: form.telefone || null,
            observacao: compact ? null : form.observacao || null,
          }),
        });
        const payload = (await response.json()) as {
          creditorId?: string;
          message?: string;
        };

        if (!response.ok || !payload.creditorId) {
          toast.error(payload.message ?? "Nao foi possivel salvar o credor.");
          return;
        }

        toast.success(
          payload.message ?? (form.id ? "Credor atualizado com sucesso." : "Credor cadastrado com sucesso."),
        );
        onSaved?.({
          id: payload.creditorId,
          nome: form.nome,
          codigo: form.codigo || null,
        });
        handleOpenChange(false);
      })();
    });
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled ? (
        <DialogTrigger
          render={
            <Button variant={triggerVariant} className="rounded-lg" />
          }
        >
          <Plus className="size-4" />
          {triggerLabel}
        </DialogTrigger>
      ) : null}

      <DialogContent className={compact ? "sm:max-w-md" : "sm:max-w-2xl"}>
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar credor" : "Novo credor"}</DialogTitle>
          <DialogDescription>
            {compact
              ? "Cadastre o credor sem sair do fluxo atual."
              : "Mantenha o cadastro do credor organizado para vinculo com carteiras e operacao."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className={compact ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="creditor-name">Nome do credor *</Label>
              <Input
                id="creditor-name"
                required
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>

            {compact ? (
              <div className="rounded-lg border border-border/70 bg-muted/15">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setShowMoreInfo((current) => !current)}
                >
                  <span className="text-sm font-medium">Mais informacoes</span>
                  {showMoreInfo ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>
                {showMoreInfo ? (
                  <div className="grid gap-4 border-t border-border/70 px-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="creditor-code">Codigo</Label>
                      <Input
                        id="creditor-code"
                        value={form.codigo ?? ""}
                        onChange={(event) => updateField("codigo", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creditor-document">Documento</Label>
                      <Input
                        id="creditor-document"
                        value={form.documento ?? ""}
                        onChange={(event) => updateField("documento", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creditor-phone">Telefone</Label>
                      <Input
                        id="creditor-phone"
                        value={form.telefone ?? ""}
                        onChange={(event) => updateField("telefone", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creditor-email">E-mail</Label>
                      <Input
                        id="creditor-email"
                        type="email"
                        value={form.email ?? ""}
                        onChange={(event) => updateField("email", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="creditor-code">Codigo</Label>
                  <Input
                    id="creditor-code"
                    value={form.codigo ?? ""}
                    onChange={(event) => updateField("codigo", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditor-document">Documento / CNPJ</Label>
                  <Input
                    id="creditor-document"
                    value={form.documento ?? ""}
                    onChange={(event) => updateField("documento", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditor-email">E-mail</Label>
                  <Input
                    id="creditor-email"
                    type="email"
                    value={form.email ?? ""}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditor-phone">Telefone</Label>
                  <Input
                    id="creditor-phone"
                    value={form.telefone ?? ""}
                    onChange={(event) => updateField("telefone", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="creditor-notes">Observacao</Label>
                  <Textarea
                    id="creditor-notes"
                    value={form.observacao ?? ""}
                    onChange={(event) => updateField("observacao", event.target.value)}
                    className="min-h-28 rounded-lg"
                  />
                </div>
              </>
            )}
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
              {form.id ? "Salvar alteracoes" : "Salvar credor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
