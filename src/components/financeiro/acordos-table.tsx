"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BaixaForm } from "@/components/acordos/baixa-form";
import { ParcelasTable } from "@/components/acordos/parcelas-table";
import { AgreementDetailsDialog } from "@/components/financeiro/agreement-details-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  getAgreementStatusLabel,
  getAgreementStatusVariant,
} from "@/lib/clientes-utils";
import { cn } from "@/lib/utils";
import type { AgreementCenterRow, FilterOption } from "@/types/portal";

interface AcordosTableProps {
  rows: AgreementCenterRow[];
  wallets: FilterOption[];
  canCancel: boolean;
  canRegisterWriteOff: boolean;
}

export function AcordosTable({
  rows,
  wallets,
  canCancel,
  canRegisterWriteOff,
}: AcordosTableProps) {
  const router = useRouter();
  const [expandedAgreementId, setExpandedAgreementId] = useState<string>(rows[0]?.id ?? "");
  const [writeOffAgreementId, setWriteOffAgreementId] = useState<string | null>(null);
  const [cancelAgreementId, setCancelAgreementId] = useState<string | null>(null);
  const [detailsAgreementId, setDetailsAgreementId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const expandedAgreement = rows.find((row) => row.id === expandedAgreementId) ?? null;
  const writeOffAgreement = rows.find((row) => row.id === writeOffAgreementId) ?? null;
  const cancelAgreement = rows.find((row) => row.id === cancelAgreementId) ?? null;
  const totalNegotiated = rows.reduce((total, row) => total + row.valorAcordo, 0);

  if (!rows.length) {
    return (
      <EmptyState
        title="Nenhum acordo encontrado"
        description="Ajuste os filtros ou registre novas negociacoes para alimentar a central."
      />
    );
  }

  function handleCancelAgreement() {
    if (!cancelAgreement) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/acordos/${cancelAgreement.id}/cancelar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId: cancelAgreement.clientId,
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "Nao foi possivel cancelar o acordo.");
          return;
        }

        toast.success("Acordo cancelado com sucesso.");
        setCancelAgreementId(null);
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <p className="font-medium">Painel consolidado de acordos</p>
          <p className="text-muted-foreground">
            Total negociado: {formatCurrency(totalNegotiated)}
          </p>
        </div>
      </div>

      <div className="dashboard-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Cliente
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  CPF/CNPJ
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Contrato
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Carteira
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Data acordo
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Valor acordo
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Pago
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Saldo
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Honorarios
                </TableHead>
                <TableHead className="h-11 px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Parcelas
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
                        {row.operador} - {row.equipe}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                    {formatDocument(row.cpfCnpj)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">{row.contrato}</TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">
                    <div>
                      <p>{row.carteira}</p>
                      <p className="text-xs text-muted-foreground">{row.credor}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">
                    {formatDate(row.dataAcordo)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.valorAcordo)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.valorPago)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.saldo)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-mono text-sm">
                    {formatCurrency(row.valorEscritorioPrevisto ?? 0)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-center text-sm">
                    {formatNumber(row.parcelas)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Badge variant={getAgreementStatusVariant(row.status)}>
                      {getAgreementStatusLabel(row.status)}
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
                        onClick={() =>
                          setExpandedAgreementId((current) =>
                            current === row.id ? "" : row.id,
                          )
                        }
                      >
                        Ver parcelas
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setWriteOffAgreementId(row.id)}
                        disabled={!canRegisterWriteOff}
                      >
                        Dar baixa
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setCancelAgreementId(row.id)}
                        disabled={!canCancel}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setDetailsAgreementId(row.id)}
                      >
                        Historico
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {expandedAgreement ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              Parcelas do acordo {expandedAgreement.contrato}
            </h3>
            <p className="text-sm text-muted-foreground">
              {expandedAgreement.parcelasPagas} paga(s), {expandedAgreement.parcelasPendentes} pendente(s) e{" "}
              {expandedAgreement.parcelasAtrasadas} em atraso.
            </p>
          </div>
          <ParcelasTable installments={expandedAgreement.parcelasDetalhe} />
        </div>
      ) : null}

      <BaixaForm
        clientId={writeOffAgreement?.clientId ?? ""}
        clientName={writeOffAgreement?.cliente ?? undefined}
        agreement={writeOffAgreement ? toClientAgreementRow(writeOffAgreement) : null}
        wallets={wallets}
        open={Boolean(writeOffAgreement)}
        onOpenChange={(open) => {
          if (!open) {
            setWriteOffAgreementId(null);
          }
        }}
      />

      <AgreementDetailsDialog
        agreementId={detailsAgreementId}
        open={Boolean(detailsAgreementId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsAgreementId(null);
          }
        }}
      />

      <AlertDialog
        open={Boolean(cancelAgreement)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelAgreementId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar acordo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao encerra o acordo, cancela as parcelas pendentes e preserva o
              historico financeiro para consulta e auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAgreement} disabled={isPending}>
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
