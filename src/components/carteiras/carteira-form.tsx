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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface CarteiraFormValue {
  id?: string;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

interface CarteiraFormDialogProps {
  compact?: boolean;
  initialValue?: CarteiraFormValue | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (wallet: {
    id: string;
    nome: string;
    codigo?: string | null;
    descricao?: string | null;
  }) => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

const emptyForm: CarteiraFormValue = {
  nome: "",
  codigo: "",
  descricao: "",
  documento: "",
  telefone: "",
  email: "",
  observacao: "",
  ativo: true,
};

function buildFormValue(initialValue?: CarteiraFormValue | null): CarteiraFormValue {
  return {
    ...emptyForm,
    ...initialValue,
    codigo: initialValue?.codigo ?? "",
    descricao: initialValue?.descricao ?? "",
    documento: initialValue?.documento ?? "",
    telefone: initialValue?.telefone ?? "",
    email: initialValue?.email ?? "",
    observacao: initialValue?.observacao ?? "",
    ativo: initialValue?.ativo ?? true,
  };
}

function hasExpandedInfo(form: CarteiraFormValue) {
  return Boolean(
    form.codigo ||
      form.descricao ||
      form.documento ||
      form.telefone ||
      form.email ||
      form.observacao,
  );
}

export function CarteiraFormDialog({
  compact = false,
  initialValue,
  open,
  onOpenChange,
  onSaved,
  triggerLabel = "Nova carteira",
  triggerVariant = "outline",
}: CarteiraFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CarteiraFormValue>(() => buildFormValue(initialValue));
  const [showMoreInfo, setShowMoreInfo] = useState(hasExpandedInfo(buildFormValue(initialValue)));

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    const nextForm = buildFormValue(initialValue);
    setForm(nextForm);
    setShowMoreInfo(hasExpandedInfo(nextForm));

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
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome,
            codigo: form.codigo || null,
            descricao: form.descricao || null,
            documento: form.documento || null,
            telefone: form.telefone || null,
            email: form.email || null,
            observacao: form.observacao || null,
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
          codigo: form.codigo || null,
          descricao: form.descricao || null,
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

      <DialogContent
        className={
          compact
            ? "w-[calc(100vw-1rem)] max-w-lg overflow-x-hidden sm:w-[calc(100vw-2rem)]"
            : "w-[calc(100vw-1rem)] max-w-3xl overflow-x-hidden sm:w-[calc(100vw-2rem)]"
        }
      >
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar carteira" : "Nova carteira"}</DialogTitle>
          <DialogDescription>
            {compact
              ? "Cadastre a carteira sem sair do fluxo atual."
              : "Centralize nome, codigo, contato e status operacional da carteira."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 overflow-x-hidden" onSubmit={handleSubmit}>
          <div className={compact ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
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
                      <Label htmlFor="wallet-code">Codigo</Label>
                      <Input
                        id="wallet-code"
                        value={form.codigo ?? ""}
                        onChange={(event) => updateField("codigo", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wallet-document">Documento</Label>
                      <Input
                        id="wallet-document"
                        value={form.documento ?? ""}
                        onChange={(event) => updateField("documento", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wallet-phone">Telefone</Label>
                      <Input
                        id="wallet-phone"
                        value={form.telefone ?? ""}
                        onChange={(event) => updateField("telefone", event.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wallet-email">E-mail</Label>
                      <Input
                        id="wallet-email"
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
                  <Label htmlFor="wallet-code">Codigo</Label>
                  <Input
                    id="wallet-code"
                    value={form.codigo ?? ""}
                    onChange={(event) => updateField("codigo", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-document">Documento</Label>
                  <Input
                    id="wallet-document"
                    value={form.documento ?? ""}
                    onChange={(event) => updateField("documento", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-phone">Telefone</Label>
                  <Input
                    id="wallet-phone"
                    value={form.telefone ?? ""}
                    onChange={(event) => updateField("telefone", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-email">E-mail</Label>
                  <Input
                    id="wallet-email"
                    type="email"
                    value={form.email ?? ""}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-11 rounded-lg"
                  />
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="wallet-note">Observacao</Label>
                  <Textarea
                    id="wallet-note"
                    value={form.observacao ?? ""}
                    onChange={(event) => updateField("observacao", event.target.value)}
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
              {form.id ? "Salvar alteracoes" : "Salvar carteira"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
