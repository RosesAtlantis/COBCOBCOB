import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getInstallmentStatusLabel,
  getInstallmentStatusVariant,
  getRevenueTypeLabel,
  getRevenueTypeOriginLabel,
  resolveAgreementTypeLabel,
} from "@/lib/clientes-utils";
import type { AgreementInstallment } from "@/types/portal";

interface ParcelasTableProps {
  installments: AgreementInstallment[];
}

export function ParcelasTable({ installments }: ParcelasTableProps) {
  if (!installments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
        Nenhuma parcela encontrada para este acordo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border/70 hover:bg-transparent">
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Parcela
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tipo
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vencimento
            </TableHead>
            <TableHead className="h-10 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Valor
            </TableHead>
            <TableHead className="h-10 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pago
            </TableHead>
            <TableHead className="h-10 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Saldo
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Classificacao
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Origem
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Operador
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pagamento
            </TableHead>
            <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => (
            <TableRow key={installment.id} className="border-border/60 hover:bg-muted/15">
              <TableCell className="px-4 py-3 text-sm font-medium">
                {installment.numero_parcela}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {resolveAgreementTypeLabel(installment.tipo)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatDate(installment.data_vencimento)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-sm">
                {formatCurrency(installment.valor_parcela)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-sm">
                {formatCurrency(installment.valor_pago)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-mono text-sm">
                {formatCurrency(
                  Math.max(installment.valor_parcela - installment.valor_pago, 0),
                )}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant={installment.tipo_receita === "COLCHAO" ? "secondary" : "default"}>
                  {getRevenueTypeLabel(installment.tipo_receita)}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {getRevenueTypeOriginLabel(installment.tipo_receita_origem)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {installment.operador_id ? "Vinculado ao acordo" : "-"}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {installment.data_pagamento ? formatDate(installment.data_pagamento) : "-"}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                <Badge variant={getInstallmentStatusVariant(installment.status)}>
                  {getInstallmentStatusLabel(installment.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
