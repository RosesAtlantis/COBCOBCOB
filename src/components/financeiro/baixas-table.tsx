"use client";

import { useState } from "react";
import Link from "next/link";

import { AgreementDetailsDialog } from "@/components/financeiro/agreement-details-dialog";
import { EstornoBaixaDialog } from "@/components/financeiro/estorno-baixa-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { getWriteOffStatusLabel, getWriteOffStatusVariant } from "@/lib/financeiro-utils";
import { formatDocument } from "@/lib/clientes-utils";
import { cn } from "@/lib/utils";
import type { WriteOffCenterRow } from "@/types/portal";

interface BaixasTableProps {
  rows: WriteOffCenterRow[];
  canReverseWriteOff: boolean;
}

export function BaixasTable({ rows, canReverseWriteOff }: BaixasTableProps) {
  const [detailsAgreementId, setDetailsAgreementId] = useState<string | null>(null);
  const [selectedWriteOff, setSelectedWriteOff] = useState<WriteOffCenterRow | null>(null);
  const [reversalTarget, setReversalTarget] = useState<WriteOffCenterRow | null>(null);

  if (!rows.length) {
    return (
      <EmptyState
        title="Nenhuma baixa encontrada"
        description="Ajuste os filtros ou registre novos recebimentos para alimentar a central."
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
                Pagamento
              </TableHead>
              <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor pago
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Forma
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Registrado por
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
            {rows.map((row) => (
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
                  {row.numeroParcela || "-"}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm">
                  {formatDate(row.dataPagamento)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                  {formatCurrency(row.valorPago)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm">
                  {row.formaPagamento ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm">
                  {row.registradoPor}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <div className="space-y-1">
                    <Badge variant={getWriteOffStatusVariant(row.estornada)}>
                      {getWriteOffStatusLabel(row.estornada)}
                    </Badge>
                    {row.estornadaEm ? (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(row.estornadaEm)}
                      </p>
                    ) : null}
                  </div>
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
                      onClick={() => setSelectedWriteOff(row)}
                    >
                      Ver detalhes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={!canReverseWriteOff || row.estornada}
                      onClick={() => setReversalTarget(row)}
                    >
                      Estornar baixa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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

      <Dialog
        open={Boolean(selectedWriteOff)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedWriteOff(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalhes da baixa</DialogTitle>
            <DialogDescription>
              Informacoes financeiras, operacionais e de estorno do registro selecionado.
            </DialogDescription>
          </DialogHeader>

          {selectedWriteOff ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{selectedWriteOff.cliente}</p>
                  <Badge variant={getWriteOffStatusVariant(selectedWriteOff.estornada)}>
                    {getWriteOffStatusLabel(selectedWriteOff.estornada)}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-muted-foreground md:grid-cols-2">
                  <p>Contrato: {selectedWriteOff.contrato}</p>
                  <p>Parcela: {selectedWriteOff.numeroParcela || "-"}</p>
                  <p>Pagamento: {formatDate(selectedWriteOff.dataPagamento)}</p>
                  <p>Valor pago: {formatCurrency(selectedWriteOff.valorPago)}</p>
                  <p>Forma: {selectedWriteOff.formaPagamento ?? "-"}</p>
                  <p>Registrado por: {selectedWriteOff.registradoPor}</p>
                </div>
              </div>

              <div className="dashboard-surface p-4">
                <p className="font-medium">Observacao</p>
                <p className="mt-2 text-muted-foreground">
                  {selectedWriteOff.observacao ?? "Sem observacao registrada."}
                </p>
              </div>

              <div className="dashboard-surface p-4">
                <p className="font-medium">Estorno</p>
                <p className="mt-2 text-muted-foreground">
                  {selectedWriteOff.estornada
                    ? `Estornada em ${formatDate(selectedWriteOff.estornadaEm ?? selectedWriteOff.dataPagamento)} por ${selectedWriteOff.estornadaPor ?? "Portal BKO"}.`
                    : "Baixa ainda ativa, sem estorno registrado."}
                </p>
                {selectedWriteOff.motivoEstorno ? (
                  <p className="mt-2 text-muted-foreground">
                    Motivo: {selectedWriteOff.motivoEstorno}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <EstornoBaixaDialog
        writeOff={reversalTarget}
        open={Boolean(reversalTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setReversalTarget(null);
          }
        }}
      />
    </div>
  );
}
