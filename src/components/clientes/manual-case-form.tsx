"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
import type { FilterOption } from "@/types/portal";

interface ManualCaseFormProps {
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
}

export function ManualCaseForm({
  operators,
  teams,
  wallets,
}: ManualCaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    uf: "",
    cep: "",
    observacao: "",
    carteiraId: wallets[0]?.value ?? "",
    operadorId: operators[0]?.value ?? "",
    equipeId: teams[0]?.value ?? "",
    numeroContrato: "",
    valorOriginal: "",
    valorEmAberto: "",
    dataContrato: "",
    dataVencimento: "",
  });

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K] | null,
  ) {
    setForm((current) => ({ ...current, [key]: (value ?? "") as (typeof form)[K] }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            cpfCnpj: form.cpfCnpj,
            telefone: form.telefone || null,
            email: form.email || null,
            endereco: form.endereco || null,
            cidade: form.cidade || null,
            uf: form.uf || null,
            cep: form.cep || null,
            observacao: form.observacao || null,
            carteiraId: form.carteiraId,
            operadorId: form.operadorId || null,
            equipeId: form.equipeId || null,
            numeroContrato: form.numeroContrato,
            valorOriginal: Number(form.valorOriginal || 0),
            valorEmAberto: Number(form.valorEmAberto || 0),
            dataContrato: form.dataContrato || null,
            dataVencimento: form.dataVencimento || null,
          }),
        });
        const payload = (await response.json()) as {
          clientId?: string;
          message?: string;
        };

        if (!response.ok || !payload.clientId) {
          toast.error(payload.message ?? "Nao foi possivel criar o caso manual.");
          return;
        }

        toast.success("Caso manual criado com sucesso.");
        router.push(`/clientes/${payload.clientId}`);
        router.refresh();
      })();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle>Cliente e contato</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
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
            <Input
              id="cpfCnpj"
              value={form.cpfCnpj}
              onChange={(event) => updateField("cpfCnpj", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
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
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="endereco">Endereco</Label>
            <Input
              id="endereco"
              value={form.endereco}
              onChange={(event) => updateField("endereco", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={form.cidade}
              onChange={(event) => updateField("cidade", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              maxLength={2}
              value={form.uf}
              onChange={(event) => updateField("uf", event.target.value.toUpperCase())}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={form.cep}
              onChange={(event) => updateField("cep", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="observacao">Observacao</Label>
            <Textarea
              id="observacao"
              value={form.observacao}
              onChange={(event) => updateField("observacao", event.target.value)}
              className="min-h-24 rounded-lg border-border/70 bg-background shadow-none"
              placeholder="Contexto do caso, observacoes comerciais ou anotacoes internas."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle>Vinculos operacionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Carteira</Label>
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

          <div className="space-y-2">
            <Label>Equipe responsavel</Label>
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
        </CardContent>
      </Card>

      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle>Contrato inicial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="numeroContrato">Contrato</Label>
            <Input
              id="numeroContrato"
              value={form.numeroContrato}
              onChange={(event) => updateField("numeroContrato", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorOriginal">Valor original</Label>
            <Input
              id="valorOriginal"
              type="number"
              min="0"
              step="0.01"
              value={form.valorOriginal}
              onChange={(event) => updateField("valorOriginal", event.target.value)}
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
            <Label htmlFor="dataContrato">Data contrato</Label>
            <Input
              id="dataContrato"
              type="date"
              value={form.dataContrato}
              onChange={(event) => updateField("dataContrato", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataVencimento">Data vencimento</Label>
            <Input
              id="dataVencimento"
              type="date"
              value={form.dataVencimento}
              onChange={(event) => updateField("dataVencimento", event.target.value)}
              className="h-11 rounded-lg border-border/70 bg-background shadow-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-lg"
          disabled={isPending || !form.carteiraId}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Criar caso manual
        </Button>
      </div>
    </form>
  );
}
