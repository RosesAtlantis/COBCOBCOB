import Link from "next/link";

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
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  formatDocument,
  getClientStatusLabel,
  getClientStatusVariant,
} from "@/lib/clientes-utils";
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
                Nome / Razao social
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                CPF/CNPJ
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Carteira
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Credor
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Contratos
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor em aberto
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor em acordo
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Ultima atualizacao
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Acoes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-border/60 hover:bg-muted/15">
                <TableCell className="px-4 py-3.5">
                  <div>
                    <p className="font-medium">{row.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.operador} • {row.equipe}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                  {formatDocument(row.cpfCnpj)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm">{row.carteira}</TableCell>
                <TableCell className="px-4 py-3.5 text-sm">{row.credor}</TableCell>
                <TableCell className="px-4 py-3.5 text-right">
                  {formatNumber(row.contratos)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                  {formatCurrency(row.valorEmAberto)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                  {formatCurrency(row.valorEmAcordo)}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Badge variant={getClientStatusVariant(row.status)}>
                    {getClientStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                  {formatDate(row.ultimaAtualizacao)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right">
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
