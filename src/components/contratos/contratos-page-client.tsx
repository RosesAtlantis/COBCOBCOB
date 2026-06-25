"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import { CadastroHeader } from "@/components/cadastros/cadastro-header";
import { CadastroSummaryGrid } from "@/components/cadastros/cadastro-summary-grid";
import { CadastroTable } from "@/components/cadastros/cadastro-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/clientes-utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContractRegistryPageData } from "@/types/portal";

interface ContratosPageClientProps {
  initialData: ContractRegistryPageData;
}

function getStatusLabel(status: string) {
  if (status === "quitado") {
    return "Quitado";
  }

  if (status === "em_acordo") {
    return "Em acordo";
  }

  if (status === "inativo") {
    return "Inativo";
  }

  return "Aberto";
}

function getStatusVariant(status: string) {
  if (status === "quitado") {
    return "secondary" as const;
  }

  if (status === "inativo") {
    return "outline" as const;
  }

  return "default" as const;
}

export function ContratosPageClient({
  initialData,
}: ContratosPageClientProps) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return initialData.contracts;
    }

    return initialData.contracts.filter((row) =>
      normalizeText(
        [
          row.numero_contrato,
          row.clientName,
          row.clientDocument,
          row.walletName,
          row.creditorName,
          row.operatorName,
          row.teamName,
          row.status,
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery),
    );
  }, [initialData.contracts, query]);

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Cadastros"
        title="Contratos"
        description="Consulte a base contratual do portal e use a ficha do cliente para cadastrar ou editar contratos manualmente com auditoria."
        actions={
          <>
            {initialData.canCreateCase ? (
              <Link
                href="/clientes"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
              >
                Abrir clientes
              </Link>
            ) : null}
            {initialData.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </>
        }
      />

      <CadastroSummaryGrid
        items={[
          { label: "Contratos exibidos", value: rows.length },
          {
            label: "Ativos",
            value: rows.filter((row) => row.status !== "inativo").length,
          },
          {
            label: "Com carteira",
            value: rows.filter((row) => row.carteira_id).length,
          },
          {
            label: "Atualizados hoje",
            value: rows.filter(
              (row) => row.atualizado_em.slice(0, 10) === new Date().toISOString().slice(0, 10),
            ).length,
          },
        ]}
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Pesquisa rapida</p>
              <p className="text-sm text-muted-foreground">
                Busque por numero, cliente, carteira, credor ou status.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar contrato"
                className="h-11 rounded-lg pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CadastroTable
        rows={rows}
        emptyTitle="Nenhum contrato encontrado"
        emptyDescription="Ajuste a busca ou abra a ficha de um cliente para cadastrar o primeiro contrato."
        columns={[
          {
            key: "contrato",
            header: "Contrato",
            render: (row) => (
              <div>
                <p className="font-medium">{row.numero_contrato}</p>
                <p className="text-xs text-muted-foreground">
                  Atualizado em {formatDate(row.atualizado_em)}
                </p>
              </div>
            ),
          },
          {
            key: "cliente",
            header: "Cliente",
            render: (row) => (
              <div className="space-y-1">
                <p className="text-sm">{row.clientName}</p>
                <p className="text-xs text-muted-foreground">{row.clientDocument}</p>
              </div>
            ),
          },
          {
            key: "vinculos",
            header: "Vinculos",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{row.walletName}</p>
                <p className="text-muted-foreground">
                  {row.creditorName} - {row.operatorName}
                </p>
              </div>
            ),
          },
          {
            key: "saldo",
            header: "Em aberto",
            render: (row) => (
              <span className="font-mono text-sm">{formatCurrency(row.valor_em_aberto)}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge variant={getStatusVariant(row.status)}>
                {getStatusLabel(row.status)}
              </Badge>
            ),
          },
          {
            key: "acoes",
            header: "Acoes",
            headerClassName:
              "h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
            render: (row) => (
              <div className="flex justify-end">
                <Link
                  href={`/clientes/${row.cliente_id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                >
                  <ExternalLink className="size-4" />
                  Abrir ficha
                </Link>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
