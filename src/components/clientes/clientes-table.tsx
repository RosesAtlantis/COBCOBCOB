import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDocument,
  getClientStatusLabel,
  getClientStatusVariant,
} from "@/lib/clientes-utils";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientListRow } from "@/types/portal";

interface ClientesTableProps {
  rows: ClientListRow[];
}

export function ClientesTable({ rows }: ClientesTableProps) {
  if (!rows.length) {
    return (
      <EmptyState
        title="Nenhum cliente encontrado"
        description="Ajuste os filtros ou importe a base operacional para iniciar o atendimento no modulo de clientes."
      />
    );
  }

  return (
    <div className="dashboard-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/70 hover:bg-transparent">
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cliente
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Operacao
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cobranca
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Situacao
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Acoes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-border/60 hover:bg-muted/15">
                <TableCell className="px-4 py-3.5 align-top">
                  <div className="min-w-[220px] space-y-1">
                    <p className="font-medium">{row.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDocument(row.cpfCnpj)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[row.cidade, row.uf].filter(Boolean).join(" / ") || "Localidade nao informada"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 align-top">
                  <div className="min-w-[220px] space-y-1">
                    <p className="text-sm font-medium">{row.carteira}</p>
                    <p className="text-xs text-muted-foreground">{row.credor}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.operador} / {row.equipe}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 align-top">
                  <div className="min-w-[280px] space-y-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Contratos: {formatNumber(row.contratos)}</span>
                      <span>Acordos ativos: {formatNumber(row.acordosAtivos)}</span>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          Em aberto
                        </p>
                        <p className="font-mono">{formatCurrency(row.valorEmAberto)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          Em acordo
                        </p>
                        <p className="font-mono">{formatCurrency(row.valorEmAcordo)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          Pago
                        </p>
                        <p className="font-mono">{formatCurrency(row.valorPago)}</p>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 align-top">
                  <div className="space-y-2">
                    <Badge variant={getClientStatusVariant(row.status)}>
                      {getClientStatusLabel(row.status)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <p>
                        Ultimo pagamento: {row.ultimoPagamento ? formatDate(row.ultimoPagamento) : "-"}
                      </p>
                      <p>Atualizado em {formatDate(row.ultimaAtualizacao)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right align-top">
                  <Link
                    href={`/clientes/${row.id}`}
                    className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
                  >
                    Abrir cliente
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
