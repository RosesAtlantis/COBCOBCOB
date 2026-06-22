"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import type { ImportProcessResult, ImportType } from "@/types/portal";

const importTypes: Array<{ value: ImportType; label: string }> = [
  { value: "cobware", label: "Base antiga CobWare" },
  { value: "pagamentos", label: "Pagamentos" },
  { value: "acordos", label: "Acordos" },
  { value: "operadores", label: "Operadores" },
  { value: "metas", label: "Metas" },
  { value: "carteiras", label: "Carteiras" },
  { value: "acionamentos", label: "Acionamentos" },
];

const requiredColumns: Record<ImportType, string[]> = {
  cobware: [
    "credor",
    "nome_cliente",
    "cpf_cnpj",
    "contratos_fatura",
    "parcela",
    "qtd_parc",
    "vlr_parcela",
    "valor_pago",
    "ho_pago",
    "vlr_acordo",
    "data_de_vencimento",
    "data_pagamento",
    "pago",
    "status_acordo",
    "tipo_de_ho",
  ],
  pagamentos: [
    "data_pagamento",
    "operador",
    "equipe",
    "carteira",
    "credor",
    "cpf_cnpj",
    "contrato",
    "valor_pago",
    "valor_honorario",
  ],
  acordos: [
    "data_acordo",
    "operador",
    "equipe",
    "carteira",
    "cpf_cnpj",
    "contrato",
    "valor_acordo",
    "valor_entrada",
    "quantidade_parcelas",
    "status",
  ],
  operadores: ["nome", "email", "equipe"],
  metas: ["mes", "ano", "operador", "equipe", "carteira", "valor_meta"],
  carteiras: ["nome", "credor"],
  acionamentos: [
    "data_acionamento",
    "operador",
    "equipe",
    "carteira",
    "contrato",
    "evento",
    "descricao",
    "canal",
  ],
};

export function ImportUpload() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<ImportType>("cobware");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<ImportProcessResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Selecione um arquivo CSV ou XLSX antes de enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", selectedType);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/import", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as ImportProcessResult & {
          message?: string;
        };

        if (!response.ok) {
          toast.error(payload.message ?? "Falha ao processar a importacao.");
          return;
        }

        setLastResult(payload);
        toast.success(
          `${payload.importedRows} linha(s) processada(s) com status ${payload.status}.`,
        );
        router.refresh();
      })();
    });
  }

  function downloadErrorReport() {
    if (!lastResult?.errorReport) {
      return;
    }

    const blob = new Blob([lastResult.errorReport], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `erros_${lastResult.type}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="dashboard-surface">
        <CardHeader>
          <CardTitle>Nova importacao</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="import-type">Tipo de importacao</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as ImportType)}
                >
                  <SelectTrigger id="import-type" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {importTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-file">Arquivo</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            <Button size="lg" type="submit" disabled={isPending || !selectedFile}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              Processar arquivo
            </Button>
          </form>

          {lastResult ? (
            <Alert className="mt-5">
              <DownloadCloud className="size-4" />
              <AlertTitle>Resultado da ultima carga</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>
                  {lastResult.importedRows} linha(s) importada(s), {lastResult.errorRows} com
                  erro.
                </p>
                {lastResult.warning ? <p>{lastResult.warning}</p> : null}
                {lastResult.errorReport ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    type="button"
                    onClick={downloadErrorReport}
                  >
                    Baixar relatorio de erros
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card className="dashboard-surface">
        <CardHeader>
          <CardTitle>Colunas esperadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            O parser aceita CSV e XLSX. Os cabecalhos sao normalizados, mas as colunas
            abaixo precisam existir.
          </p>
          <ul className="space-y-1 rounded-2xl border border-border/70 bg-muted/15 p-4 font-mono text-xs">
            {requiredColumns[selectedType].map((column) => (
              <li key={column}>{column}</li>
            ))}
          </ul>
          {selectedType === "cobware" ? (
            <p className="text-xs text-primary">
              O importador CobWare consolida acordos por chave de negociacao e gera
              pagamentos apenas para parcelas marcadas como pagas.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
