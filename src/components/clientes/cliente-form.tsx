"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDocument,
  formatPhone,
  getClientStatusLabel,
  getClientStatusVariant,
  getPrimaryWalletLabel,
} from "@/lib/clientes-utils";
import type { Client, ClientWalletLink, FilterOption } from "@/types/portal";

interface ClienteFormProps {
  client: Client;
  walletLinks: ClientWalletLink[];
  operatorName: string;
  teamName: string;
  primaryWallet: string;
  primaryCreditor: string;
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  canEdit: boolean;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value || "-"}</p>
    </div>
  );
}

export function ClienteForm({
  client,
  walletLinks,
  operatorName,
  teamName,
  primaryWallet,
  primaryCreditor,
  operators,
  teams,
  wallets,
  canEdit,
}: ClienteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nome: client.nome,
    cpfCnpj: client.cpf_cnpj,
    email: client.email ?? "",
    telefone: client.telefone ?? "",
    endereco: client.endereco ?? "",
    cidade: client.cidade ?? "",
    uf: client.uf ?? "",
    cep: client.cep ?? "",
    observacao: client.observacao ?? "",
    operadorId: client.operador_id ?? "",
    equipeId: client.equipe_id ?? "",
    carteiraId: walletLinks.find((item) => item.ativo)?.carteira_id ?? walletLinks[0]?.carteira_id ?? "",
    status: client.status,
  });

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K] | null,
  ) {
    setForm((current) => ({ ...current, [key]: (value ?? "") as (typeof form)[K] }));
  }

  function handleSave() {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/clientes/${client.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            cpfCnpj: form.cpfCnpj,
            email: form.email || null,
            telefone: form.telefone || null,
            endereco: form.endereco || null,
            cidade: form.cidade || null,
            uf: form.uf || null,
            cep: form.cep || null,
            observacao: form.observacao || null,
            operadorId: form.operadorId || null,
            equipeId: form.equipeId || null,
            carteiraId: form.carteiraId || null,
            status: form.status,
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel atualizar o cliente.");
          return;
        }

        toast.success("Cliente atualizado com sucesso.");
        setIsEditing(false);
        router.refresh();
      })();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Dados cadastrais</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Informacoes centrais do cliente e base de contato da ficha.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getClientStatusVariant(client.status)}>
                {getClientStatusLabel(client.status)}
              </Badge>
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setIsEditing((current) => !current)}
                >
                  <Pencil className="size-4" />
                  {isEditing ? "Cancelar" : "Editar cadastro"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome / Razao social</Label>
                  <Input
                    value={form.nome}
                    onChange={(event) => updateField("nome", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={form.cpfCnpj}
                    onChange={(event) => updateField("cpfCnpj", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={(event) => updateField("telefone", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      updateField("status", value ?? form.status)
                    }
                  >
                    <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_cobranca">Em cobranca</SelectItem>
                      <SelectItem value="com_acordo">Com acordo</SelectItem>
                      <SelectItem value="quitado">Quitado</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereco</Label>
                  <Input
                    value={form.endereco}
                    onChange={(event) => updateField("endereco", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={(event) => updateField("cidade", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input
                    maxLength={2}
                    value={form.uf}
                    onChange={(event) => updateField("uf", event.target.value.toUpperCase())}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={(event) => updateField("cep", event.target.value)}
                    className="h-11 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observacao</Label>
                  <Textarea
                    value={form.observacao}
                    onChange={(event) => updateField("observacao", event.target.value)}
                    className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="rounded-lg"
                disabled={isPending}
                onClick={handleSave}
              >
                {isPending ? <Save className="size-4 animate-pulse" /> : <Save className="size-4" />}
                Salvar cadastro
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome / Razao social" value={client.nome} />
              <Field label="CPF/CNPJ" value={formatDocument(client.cpf_cnpj)} />
              <Field label="E-mail" value={client.email ?? "-"} />
              <Field label="Telefone" value={formatPhone(client.telefone)} />
              <Field label="Endereco" value={client.endereco ?? "-"} />
              <Field label="Cidade / UF" value={`${client.cidade ?? "-"} / ${client.uf ?? "-"}`} />
              <Field label="CEP" value={client.cep ?? "-"} />
              <Field
                label="Cadastro"
                value={new Date(client.criado_em).toLocaleDateString("pt-BR")}
              />
              <Field label="Observacao" value={client.observacao ?? "-"} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle>Vinculos operacionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Carteira principal</Label>
                <Select
                  value={form.carteiraId || "none"}
                  onValueChange={(value) =>
                    updateField("carteiraId", !value || value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.value} value={wallet.value}>
                        {wallet.label}
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
                  <SelectTrigger className="h-11 rounded-lg border-border/70 bg-background shadow-none">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {operators.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <Field label="Carteira principal" value={primaryWallet} />
              <Field label="Credor" value={primaryCreditor} />
              <Field label="Equipe" value={teamName} />
              <Field label="Operador responsavel" value={operatorName} />
            </>
          )}

          <Separator className="bg-border/70" />

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Carteiras vinculadas
            </p>
            <div className="space-y-2">
              {walletLinks.length ? (
                walletLinks.map((walletLink) => (
                  <div
                    key={walletLink.id}
                    className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-sm"
                  >
                    {getPrimaryWalletLabel(primaryWallet, walletLink.credor)}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                  Nenhuma carteira vinculada na ficha.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
