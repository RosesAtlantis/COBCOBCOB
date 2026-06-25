"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { QuickCreateCarteiraModal } from "@/components/carteiras/quick-create-carteira-modal";
import { QuickCreateCredorModal } from "@/components/credores/quick-create-credor-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDocument } from "@/lib/clientes-utils";
import type { FilterOption } from "@/types/portal";

type SubmitIntent = "save" | "open";

interface ExistingClientPreview {
  id: string;
  nome: string;
  cpfCnpj: string;
}

interface WalletCreditorMap {
  walletId: string;
  creditorId: string | null;
  creditorName: string | null;
}

function resolveCreditorOptionValue(
  walletId: string,
  options: FilterOption[],
  walletCreditorByWallet: Map<
    string,
    {
      creditorId: string | null;
      creditorName: string | null;
    }
  >,
) {
  if (!walletId) {
    return "";
  }

  const walletMatch = walletCreditorByWallet.get(walletId);

  if (!walletMatch?.creditorId && !walletMatch?.creditorName) {
    return "";
  }

  const creditorById = walletMatch.creditorId
    ? options.find((option) => option.value === walletMatch.creditorId)
    : null;
  const creditorByName = walletMatch.creditorName
    ? options.find((option) => option.label === walletMatch.creditorName)
    : null;

  return creditorById?.value ?? creditorByName?.value ?? "";
}

interface NovoCasoFormProps {
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  walletCreditors: WalletCreditorMap[];
  canManageCreditors?: boolean;
  canManageWallets?: boolean;
  mode?: "page" | "dialog";
  onCancelled?: () => void;
  onCreated?: (
    result: {
      clientId: string;
      contractId?: string | null;
      clientExists?: boolean;
      message?: string;
    },
    action: SubmitIntent,
  ) => void;
}

const emptyForm = {
  nome: "",
  cpfCnpj: "",
  carteiraId: "",
  credorId: "",
  telefone: "",
  email: "",
  operadorId: "",
  equipeId: "",
  observacao: "",
  numeroContrato: "",
  valorEmAberto: "",
  dataVencimento: "",
};

export function NovoCasoForm({
  operators,
  teams,
  wallets,
  creditors,
  walletCreditors,
  canManageCreditors = false,
  canManageWallets = false,
  mode = "page",
  onCancelled,
  onCreated,
}: NovoCasoFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submitIntentRef = useRef<SubmitIntent>("save");
  const [isPending, startTransition] = useTransition();
  const [isCheckingDocument, setIsCheckingDocument] = useState(false);
  const [showInitialContract, setShowInitialContract] = useState(mode === "page");
  const [showMoreInfo, setShowMoreInfo] = useState(mode === "page");
  const [existingClient, setExistingClient] = useState<ExistingClientPreview | null>(null);
  const [creditorDialogOpen, setCreditorDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<SubmitIntent | null>(null);
  const [creditorOptions, setCreditorOptions] = useState(creditors);
  const [walletOptions, setWalletOptions] = useState(wallets);

  const walletCreditorByWallet = useMemo(
    () =>
      new Map(
        walletCreditors.map((item) => [
          item.walletId,
          {
            creditorId: item.creditorId,
            creditorName: item.creditorName,
          },
        ]),
      ),
    [walletCreditors],
  );
  const defaultWalletId = walletOptions[0]?.value ?? "";
  const defaultCreditorId = resolveCreditorOptionValue(
    defaultWalletId,
    creditors,
    walletCreditorByWallet,
  );
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    carteiraId: defaultWalletId,
    credorId: defaultCreditorId,
  }));

  const selectedWallet = useMemo(
    () => walletOptions.find((wallet) => wallet.value === form.carteiraId) ?? null,
    [form.carteiraId, walletOptions],
  );

  const selectedCreditor = useMemo(
    () => creditorOptions.find((option) => option.value === form.credorId) ?? null,
    [creditorOptions, form.credorId],
  );

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "cpfCnpj") {
      setExistingClient(null);
    }
  }

  async function checkExistingClient() {
    const document = form.cpfCnpj.trim();

    if (!document) {
      setExistingClient(null);
      return;
    }

    setIsCheckingDocument(true);

    try {
      const response = await fetch(
        `/api/clientes?cpfCnpj=${encodeURIComponent(document)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as {
        client?: ExistingClientPreview | null;
      };

      if (!response.ok) {
        return;
      }

      setExistingClient(payload.client ?? null);
    } finally {
      setIsCheckingDocument(false);
    }
  }

  function openExistingClient() {
    if (!existingClient) {
      return;
    }

    router.push(`/clientes/${existingClient.id}`);
    router.refresh();
    onCreated?.(
      {
        clientId: existingClient.id,
        clientExists: true,
      },
      "open",
    );
  }

  function queueSubmit(intent: SubmitIntent) {
    submitIntentRef.current = intent;
    setPendingAction(intent);
    formRef.current?.requestSubmit();
  }

  function handleWalletChange(value: string | null) {
    const nextWalletId = !value || value === "none" ? "" : value;
    const nextCreditorId = resolveCreditorOptionValue(
      nextWalletId,
      creditorOptions,
      walletCreditorByWallet,
    );

    setForm((current) => ({
      ...current,
      carteiraId: nextWalletId,
      credorId: nextCreditorId,
    }));
  }

  function handleSuccess(
    payload: { clientId: string; contractId?: string | null; clientExists?: boolean; message?: string },
    action: SubmitIntent,
  ) {
    if (onCreated) {
      onCreated(payload, action);
      return;
    }

    if (action === "open") {
      router.push(`/clientes/${payload.clientId}`);
    } else {
      router.push("/clientes");
    }

    router.refresh();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (existingClient) {
      setPendingAction(null);
      toast.error("Este CPF/CNPJ ja possui ficha cadastrada.");
      return;
    }

    const action = submitIntentRef.current;

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/clientes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: form.nome,
              cpfCnpj: form.cpfCnpj,
              carteiraId: form.carteiraId,
              credorId: form.credorId || null,
              credor: selectedCreditor?.label ?? null,
              telefone: form.telefone || null,
              email: form.email || null,
              operadorId: form.operadorId || null,
              equipeId: form.equipeId || null,
              observacao: form.observacao || null,
              numeroContrato:
                mode === "page" && showInitialContract ? form.numeroContrato || null : null,
              valorEmAberto:
                mode === "page" && showInitialContract && form.valorEmAberto
                  ? Number(form.valorEmAberto)
                  : null,
              dataVencimento:
                mode === "page" && showInitialContract ? form.dataVencimento || null : null,
            }),
          });
          const payload = (await response.json()) as {
            clientId?: string;
            contractId?: string | null;
            clientExists?: boolean;
            message?: string;
          };

          if (!response.ok || !payload.clientId) {
            toast.error(
              payload.message
                ? `Nao foi possivel salvar. Detalhes: ${payload.message}`
                : "Nao foi possivel salvar o caso.",
            );
            return;
          }

          if (payload.clientExists) {
            toast.error(
              payload.message
                ? `Nao foi possivel salvar. Detalhes: ${payload.message}`
                : "Cliente ja cadastrado.",
            );
            router.push(`/clientes/${payload.clientId}`);
            router.refresh();
            return;
          }

          toast.success(payload.message ?? "Cadastro salvo com sucesso.");
          handleSuccess(
            {
              ...payload,
              clientId: payload.clientId,
            },
            action,
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  const formIntro =
    mode === "dialog"
      ? "Preencha o essencial para abrir o caso sem sair da lista."
      : "Nome, CPF/CNPJ e carteira bastam para abrir o caso. O restante pode entrar depois, na ficha.";

  return (
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>{mode === "dialog" ? "Novo caso" : "Dados obrigatorios"}</CardTitle>
          <p className="text-sm text-muted-foreground">{formIntro}</p>
        </CardHeader>
        <CardContent
          className={
            mode === "dialog"
              ? "grid gap-4 pt-5"
              : "grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          <div className={mode === "dialog" ? "space-y-2" : "space-y-2 xl:col-span-2"}>
            <Label htmlFor="nome">Nome / Razao social</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(event) => updateField("nome", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
            <div className="relative">
              <Input
                id="cpfCnpj"
                value={form.cpfCnpj}
                onChange={(event) => updateField("cpfCnpj", event.target.value)}
                onBlur={() => {
                  void checkExistingClient();
                }}
                className="h-11 rounded-lg border-border/70 bg-background pr-10 shadow-none"
              />
              {isCheckingDocument ? (
                <Loader2 className="absolute right-3 top-3.5 size-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Carteira *</Label>
              {canManageWallets ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto rounded-lg px-2 py-1 text-xs"
                  onClick={() => setWalletDialogOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Nova carteira
                </Button>
              ) : null}
            </div>
            <Select value={form.carteiraId || "none"} onValueChange={handleWalletChange}>
              <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione</SelectItem>
                {walletOptions.map((wallet) => (
                  <SelectItem key={wallet.value} value={wallet.value}>
                    <div className="flex flex-col">
                      <span>{wallet.label}</span>
                      {wallet.description ? (
                        <span className="text-xs text-muted-foreground">{wallet.description}</span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {existingClient ? (
            <div
              className={
                mode === "dialog"
                  ? "rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/20"
                  : "rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-4 xl:col-span-3 dark:border-amber-900/50 dark:bg-amber-950/20"
              }
            >
              <p className="text-sm font-semibold">Este CPF/CNPJ ja esta cadastrado.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {existingClient.nome} - {formatDocument(existingClient.cpfCnpj)}
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={openExistingClient}
                >
                  <ExternalLink className="size-4" />
                  Abrir ficha existente
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setShowMoreInfo((current) => !current)}
          >
            <div>
              <CardTitle>Mais informacoes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Credor e dados complementares podem ser preenchidos agora ou depois.
              </p>
            </div>
            {showMoreInfo ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showMoreInfo ? (
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-4">
            <div className={mode === "dialog" ? "space-y-2 md:col-span-2 xl:col-span-4" : "space-y-2 xl:col-span-2"}>
              <div className="flex items-center justify-between gap-3">
                <Label>Credor</Label>
                {canManageCreditors ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto rounded-lg px-2 py-1 text-xs"
                    onClick={() => setCreditorDialogOpen(true)}
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
                <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue placeholder="Nao informar agora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao informar agora</SelectItem>
                  {creditorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description ? (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWallet?.description ? (
                <p className="text-xs text-muted-foreground">
                  Credor sugerido pela carteira: {selectedWallet.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(event) => updateField("telefone", event.target.value)}
                className="h-11 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="h-11 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Operador responsavel</Label>
              <Select
                value={form.operadorId || "none"}
                onValueChange={(value) =>
                  updateField("operadorId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao definir agora</SelectItem>
                  {operators.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipe responsavel</Label>
              <Select
                value={form.equipeId || "none"}
                onValueChange={(value) =>
                  updateField("equipeId", !value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue placeholder="Opcional" />
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

            <div className={mode === "dialog" ? "space-y-2 md:col-span-2 xl:col-span-4" : "space-y-2 xl:col-span-4"}>
              <Label htmlFor="observacao">Observacao</Label>
              <Textarea
                id="observacao"
                value={form.observacao}
                onChange={(event) => updateField("observacao", event.target.value)}
                className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                placeholder="Aponte o contexto da cobranca apenas se ja for util neste momento."
              />
            </div>
          </CardContent>
        ) : null}
      </Card>

      {mode === "page" ? (
        <Card className="dashboard-surface">
          <CardHeader className="border-b border-border/70 pb-5">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setShowInitialContract((current) => !current)}
            >
              <div>
                <CardTitle>Contrato inicial opcional</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Se preferir, deixe esta etapa para a ficha do cliente.
                </p>
              </div>
              {showInitialContract ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showInitialContract ? (
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numeroContrato">Numero do contrato</Label>
                <Input
                  id="numeroContrato"
                  value={form.numeroContrato}
                  onChange={(event) => updateField("numeroContrato", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorEmAberto">Valor em aberto</Label>
                <Input
                  id="valorEmAberto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorEmAberto}
                  onChange={(event) => updateField("valorEmAberto", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Data de vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={form.dataVencimento}
                  onChange={(event) => updateField("dataVencimento", event.target.value)}
                  className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                />
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        {mode === "dialog" ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg"
            onClick={onCancelled}
          >
            Cancelar
          </Button>
        ) : null}
        {existingClient ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg"
            onClick={openExistingClient}
          >
            <ExternalLink className="size-4" />
            Abrir ficha existente
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-lg"
          disabled={isPending || !form.carteiraId || Boolean(existingClient)}
          onClick={() => queueSubmit("save")}
        >
          {isPending && pendingAction === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </Button>
        <Button
          type="button"
          className="h-11 rounded-lg"
          disabled={isPending || !form.carteiraId || Boolean(existingClient)}
          onClick={() => queueSubmit("open")}
        >
          {isPending && pendingAction === "open" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          Salvar e abrir ficha
        </Button>
      </div>

      {canManageCreditors ? (
        <QuickCreateCredorModal
          open={creditorDialogOpen}
          onOpenChange={setCreditorDialogOpen}
          onCreated={(creditor) => {
            setCreditorOptions((current) => {
              const next = current.filter((option) => option.value !== creditor.id);
              next.push({
                value: creditor.id,
                label: creditor.nome,
                description: creditor.codigo ?? undefined,
              });
              return next.sort((left, right) => left.label.localeCompare(right.label));
            });
            setForm((current) => ({
              ...current,
              credorId: creditor.id,
            }));
          }}
        />
      ) : null}

      {canManageWallets ? (
        <QuickCreateCarteiraModal
          open={walletDialogOpen}
          onOpenChange={setWalletDialogOpen}
          creditors={creditorOptions}
          canQuickCreateCreditor={canManageCreditors}
          onCreated={(wallet) => {
            setWalletOptions((current) => {
              const next = current.filter((option) => option.value !== wallet.id);
              next.push({
                value: wallet.id,
                label: wallet.nome,
                description: wallet.creditorName ?? undefined,
              });
              return next.sort((left, right) => left.label.localeCompare(right.label));
            });
            setForm((current) => ({
              ...current,
              carteiraId: wallet.id,
              credorId: wallet.creditorId ?? current.credorId,
            }));
          }}
        />
      ) : null}
    </form>
  );
}
