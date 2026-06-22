"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

import { ParcelasTable } from "@/components/acordos/parcelas-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  getAgreementStatusLabel,
  getAgreementStatusVariant,
  formatDocument,
} from "@/lib/clientes-utils";
import { getAuditActionLabel, getWriteOffStatusLabel, getWriteOffStatusVariant } from "@/lib/financeiro-utils";
import { cn } from "@/lib/utils";
import type { AgreementDetailData } from "@/types/portal";

interface AgreementDetailsDialogProps {
  agreementId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgreementDetailsDialog({
  agreementId,
  open,
  onOpenChange,
}: AgreementDetailsDialogProps) {
  const [data, setData] = useState<AgreementDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = open && Boolean(agreementId) && !data && !error;

  useEffect(() => {
    let isActive = true;

    if (!open || !agreementId) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/acordos/${agreementId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AgreementDetailData & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message ?? "Nao foi possivel carregar o acordo.");
        }

        if (!isActive) {
          return;
        }

        setData(payload);
        setError(null);
      } catch (fetchError) {
        if (!isActive) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Nao foi possivel carregar o acordo.",
        );
        setData(null);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [agreementId, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setData(null);
          setError(null);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>Detalhes do acordo</DialogTitle>
          <DialogDescription>
            Parcela, baixa, estorno e trilha de auditoria no mesmo contexto.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[76vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Carregando dados do acordo...
            </div>
          ) : null}

          {!isLoading && error ? (
            <EmptyState title="Nao foi possivel carregar o acordo" description={error} />
          ) : null}

          {!isLoading && !error && data ? (
            <div className="space-y-6">
              <section className="dashboard-surface p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getAgreementStatusVariant(data.status)}>
                        {getAgreementStatusLabel(data.status)}
                      </Badge>
                      {data.writeOffs.some((row) => row.estornada) ? (
                        <Badge variant="outline">Com estorno</Badge>
                      ) : null}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{data.cliente}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDocument(data.cpfCnpj)} - {data.contrato}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Carteira: {data.carteira}</span>
                      <span>Credor: {data.credor}</span>
                      <span>Operador: {data.operador}</span>
                      <span>Equipe: {data.equipe}</span>
                    </div>
                  </div>

                  {data.clientId ? (
                    <Link
                      href={`/clientes/${data.clientId}`}
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}
                    >
                      <ExternalLink className="size-4" />
                      Abrir cliente
                    </Link>
                  ) : null}
                </div>
              </section>

              <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-6">
                <div className="dashboard-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Valor acordo
                  </p>
                  <p className="mt-2 text-xl font-semibold">{formatCurrency(data.valorAcordo)}</p>
                </div>
                <div className="dashboard-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Valor pago
                  </p>
                  <p className="mt-2 text-xl font-semibold">{formatCurrency(data.valorPago)}</p>
                </div>
                <div className="dashboard-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Saldo
                  </p>
                  <p className="mt-2 text-xl font-semibold">{formatCurrency(data.saldo)}</p>
                </div>
                <div className="dashboard-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Parcelas pagas
                  </p>
                  <p className="mt-2 text-xl font-semibold">{formatNumber(data.parcelasPagas)}</p>
                </div>
                <div className="dashboard-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Parcelas pendentes
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatNumber(data.parcelasPendentes)}
                  </p>
                </div>
                <div className="dashboard-surface p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Ultimo pagamento
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {data.ultimoPagamentoEm ? formatDate(data.ultimoPagamentoEm) : "-"}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">Parcelas</h3>
                  <p className="text-sm text-muted-foreground">
                    Cronograma financeiro atualizado do acordo.
                  </p>
                </div>
                <ParcelasTable installments={data.parcelas} />
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">Baixas e estornos</h3>
                  <p className="text-sm text-muted-foreground">
                    Recebimentos vinculados ao acordo e situacao de cada registro.
                  </p>
                </div>

                {data.writeOffs.length ? (
                  <div className="dashboard-surface overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/70 hover:bg-transparent">
                            <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.writeOffs.map((writeOff) => (
                            <TableRow key={writeOff.id} className="border-border/60 hover:bg-muted/15">
                              <TableCell className="px-4 py-3 text-sm">
                                {writeOff.numeroParcela > 0 ? writeOff.numeroParcela : "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm">
                                {formatDate(writeOff.dataPagamento)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right font-mono text-sm">
                                {formatCurrency(writeOff.valorPago)}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm">
                                {writeOff.formaPagamento ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm">
                                {writeOff.registradoPor}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="space-y-1">
                                  <Badge variant={getWriteOffStatusVariant(writeOff.estornada)}>
                                    {getWriteOffStatusLabel(writeOff.estornada)}
                                  </Badge>
                                  {writeOff.estornadaEm ? (
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(writeOff.estornadaEm)}
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhuma baixa registrada"
                    description="Este acordo ainda nao possui recebimentos vinculados."
                  />
                )}
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">Historico e auditoria</h3>
                  <p className="text-sm text-muted-foreground">
                    Eventos transacionais e mudancas de status do acordo.
                  </p>
                </div>

                {data.auditTrail.length ? (
                  <div className="space-y-3">
                    {data.auditTrail.map((event) => (
                      <div
                        key={event.id}
                        className="dashboard-surface flex flex-col gap-2 p-4"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">{getAuditActionLabel(event.acao)}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.descricao ?? "Evento registrado sem observacao adicional."}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground md:text-right">
                            <p>{event.usuarioNome}</p>
                            <p>{formatDate(event.criadoEm)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Sem eventos de auditoria"
                    description="Os eventos serao exibidos aqui assim que o acordo sofrer novas movimentacoes."
                  />
                )}
              </section>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
