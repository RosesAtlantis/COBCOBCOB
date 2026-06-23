"use client";

import { useState } from "react";
import Link from "next/link";

import { BaixaForm } from "@/components/acordos/baixa-form";
import { AgreementDetailsDialog } from "@/components/financeiro/agreement-details-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { toClientAgreementRow } from "@/lib/financeiro-adapters";
import {
  formatDocument,
  getRevenueTypeLabel,
  getInstallmentStatusLabel,
  getInstallmentStatusVariant,
  resolveAgreementTypeLabel,
} from "@/lib/clientes-utils";
import { cn } from "@/lib/utils";
import type { AgreementCenterRow, InstallmentCenterRow } from "@/types/portal";

interface ParcelasTableProps {
  rows: InstallmentCenterRow[];
  agreements: AgreementCenterRow[];
  canRegisterWriteOff: boolean;
}

export function ParcelasCentralTable({
  rows,
  agreements,
  canRegisterWriteOff,
}: ParcelasTableProps) {
  const [detailsAgreementId, setDetailsAgreementId] = useState<string | null>(null);
  const [writeOffTarget, setWriteOffTarget] = useState<{
    agreement: AgreementCenterRow;
    parcelId: string;
    clientId: string;
  } | null>(null);

  const agreementsById = new Map(agreements.map((agreement) => [agreement.id, agreement]));

  if (!rows.length) {
    return (
      <EmptyState
        title="Nenhuma parcela encontrada"
        description="Ajuste os filtros ou aguarde novas negociacoes para montar esta fila."
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
                Contrato
              </TableHead>
              <TableHead className="h-11 px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Parcela
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tipo
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Vencimento
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor parcela
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor pago
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Saldo
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Receita
              </TableHead>
              <TableHead className="h-11 px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Dias atraso
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Acoes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const agreement = agreementsById.get(row.agreementId) ?? null;

              return (
                <TableRow key={row.id} className="border-border/60 hover:bg-muted/15">
                  <TableCell className="px-4 py-3.5">
                    <div>
                      <p className="font-medium">{row.cliente}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDocument(row.cpfCnpj)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div>
                      <p className="text-sm">{row.contrato}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.operador} - {row.equipe}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-center text-sm">
                    {formatNumber(row.numeroParcela)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">
                    {resolveAgreementTypeLabel(row.tipo)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">
                    {formatDate(row.vencimento)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.valorParcela)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.valorPago)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.saldo)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">
                    {getRevenueTypeLabel(row.tipoReceita)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-center text-sm">
                    {row.diasEmAtraso > 0 ? formatNumber(row.diasEmAtraso) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Badge variant={getInstallmentStatusVariant(row.status)}>
                      {getInstallmentStatusLabel(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex flex-wrap justify-end gap-2">
                      {row.clientId ? (
                        <Link
                          href={`/clientes/${row.clientId}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "rounded-lg",
                          )}
                        >
                          Abrir cliente
                        </Link>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setDetailsAgreementId(row.agreementId)}
                      >
                        Abrir acordo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        disabled={!canRegisterWriteOff || !agreement || row.saldo <= 0}
                        onClick={() => {
                          if (!agreement || !row.clientId) {
                            return;
                          }

                          setWriteOffTarget({
                            agreement,
                            parcelId: row.id,
                            clientId: row.clientId,
                          });
                        }}
                      >
                        Dar baixa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AgreementDetailsDialog
        agreementId={detailsAgreementId}
        open={Boolean(detailsAgreementId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsAgreementId(null);
          }
        }}
      />

      <BaixaForm
        clientId={writeOffTarget?.clientId ?? ""}
        clientName={writeOffTarget?.agreement.cliente ?? undefined}
        agreement={writeOffTarget ? toClientAgreementRow(writeOffTarget.agreement) : null}
        initialParcelId={writeOffTarget?.parcelId ?? null}
        open={Boolean(writeOffTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setWriteOffTarget(null);
          }
        }}
      />
    </div>
  );
}
