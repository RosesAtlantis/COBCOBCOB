"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BaixaForm } from "@/components/acordos/baixa-form";
import { ParcelasTable } from "@/components/acordos/parcelas-table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { getAgreementStatusLabel, getAgreementStatusVariant } from "@/lib/clientes-utils";
import type { ClientAgreementRow, FilterOption } from "@/types/portal";

interface AcordosTableProps {
  clientId: string;
  clientName: string;
  agreements: ClientAgreementRow[];
  wallets: FilterOption[];
  canCancel: boolean;
  canRegisterWriteOff: boolean;
}

export function AcordosTable({
  clientId,
  clientName,
  agreements,
  wallets,
  canCancel,
  canRegisterWriteOff,
}: AcordosTableProps) {
  const router = useRouter();
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>(
    agreements[0]?.id ?? "",
  );
  const [writeOffAgreementId, setWriteOffAgreementId] = useState<string | null>(null);
  const [cancelAgreementId, setCancelAgreementId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAgreement =
    agreements.find((item) => item.id === selectedAgreementId) ?? agreements[0] ?? null;
  const writeOffAgreement =
    agreements.find((item) => item.id === writeOffAgreementId) ?? null;
  const cancelAgreement =
    agreements.find((item) => item.id === cancelAgreementId) ?? null;

  const totalAgreementValue = agreements.reduce(
    (total, item) => total + item.valor_acordo,
    0,
  );

  if (!agreements.length) {
    return (
      <EmptyState
        title="Nenhum acordo registrado"
        description="Use o botao de cadastro para criar a primeira negociacao deste cliente."
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
            clienteId: clientId,
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
          <p className="font-medium">Painel de acordos do cliente</p>
          <p className="text-muted-foreground">
            Total negociado: {formatCurrency(totalAgreementValue)}
          </p>
        </div>
      </div>

      <div className="dashboard-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Data
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Contrato
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Carteira
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Valor acordo
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Pago
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Restante
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
              {agreements.map((agreement) => (
                <TableRow key={agreement.id} className="border-border/60 hover:bg-muted/15">
                  <TableCell className="px-4 py-3 text-sm">
                    {formatDate(agreement.data_acordo)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div>
                      <p className="font-medium">{agreement.contratoNumero}</p>
                      <p className="text-xs text-muted-foreground">
                        {agreement.operador} - {agreement.equipe}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {agreement.carteira}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-sm">
                    {formatCurrency(agreement.valor_acordo)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-sm">
                    {formatCurrency(agreement.valor_pago)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-sm">
                    {formatCurrency(agreement.valorRestante)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={getAgreementStatusVariant(agreement.status)}>
                      {getAgreementStatusLabel(agreement.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() =>
                          setSelectedAgreementId((current) =>
                            current === agreement.id ? "" : agreement.id,
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
                        onClick={() => setWriteOffAgreementId(agreement.id)}
                        disabled={!canRegisterWriteOff}
                      >
                        Dar baixa
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setCancelAgreementId(agreement.id)}
                        disabled={!canCancel}
                      >
                        Cancelar acordo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedAgreement ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              Parcelas do acordo {selectedAgreement.contratoNumero}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedAgreement.parcelasPagas} paga(s),{" "}
              {selectedAgreement.parcelasPendentes} pendente(s) e{" "}
              {selectedAgreement.parcelasAtrasadas} em atraso.
            </p>
          </div>
          <ParcelasTable installments={selectedAgreement.parcelas} />
        </div>
      ) : null}

      <BaixaForm
        clientId={clientId}
        clientName={clientName}
        agreement={writeOffAgreement}
        wallets={wallets}
        open={Boolean(writeOffAgreement)}
        onOpenChange={(open) => {
          if (!open) {
            setWriteOffAgreementId(null);
          }
        }}
      />

      <AlertDialog open={Boolean(cancelAgreement)} onOpenChange={(open) => {
        if (!open) {
          setCancelAgreementId(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar acordo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao encerra o acordo selecionado e cancela as parcelas ainda
              pendentes. O historico de pagamentos permanece preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAgreement}
              disabled={isPending}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
