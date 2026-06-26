"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { ParcelasCentralTable } from "@/components/financeiro/parcelas-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toAgreementCenterRow } from "@/lib/financeiro-adapters";
import type {
  ClientAgreementRow,
  FilterOption,
  InstallmentCenterRow,
} from "@/types/portal";

interface ClientInstallmentsPanelProps {
  clientName: string;
  agreements: ClientAgreementRow[];
  installments: InstallmentCenterRow[];
  wallets: FilterOption[];
  operators: FilterOption[];
  canRegisterWriteOff: boolean;
  canEditInstallmentRevenueType: boolean;
}

export function ClientInstallmentsPanel({
  clientName,
  agreements,
  installments,
  wallets,
  operators,
  canRegisterWriteOff,
  canEditInstallmentRevenueType,
}: ClientInstallmentsPanelProps) {
  const agreementOptions = useMemo(
    () =>
      agreements.map((agreement) => ({
        value: agreement.id,
        label: agreement.contratoNumero,
      })),
    [agreements],
  );
  const contractOptions = useMemo(
    () =>
      Array.from(
        new Map(
          installments.map((installment) => [
            installment.contrato,
            {
              value: installment.contrato,
              label: installment.contrato,
            },
          ]),
        ).values(),
      ),
    [installments],
  );
  const agreementRows = useMemo(
    () =>
      agreements.map((agreement) => toAgreementCenterRow(agreement, clientName)),
    [agreements, clientName],
  );
  const [status, setStatus] = useState<string>("all");
  const [agreementId, setAgreementId] = useState<string>("all");
  const [contract, setContract] = useState<string>("all");
  const [revenueType, setRevenueType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredInstallments = useMemo(
    () =>
      installments.filter((installment) => {
        return (
          (status === "all" || installment.status === status) &&
          (agreementId === "all" || installment.agreementId === agreementId) &&
          (contract === "all" || installment.contrato === contract) &&
          (revenueType === "all" || installment.tipoReceita === revenueType) &&
          (!startDate || installment.vencimento >= startDate) &&
          (!endDate || installment.vencimento <= endDate)
        );
      }),
    [agreementId, contract, endDate, installments, revenueType, startDate, status],
  );

  function resetFilters() {
    setStatus("all");
    setAgreementId("all");
    setContract("all");
    setRevenueType("all");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="space-y-4">
      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Filtros das parcelas</p>
              <p className="text-sm text-muted-foreground">
                Veja todas as parcelas do cliente por status, acordo, contrato,
                classificacao e vencimento.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={resetFilters}
            >
              <RotateCcw className="size-4" />
              Limpar
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
                <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Acordo
              </Label>
              <Select
                value={agreementId}
                onValueChange={(value) => setAgreementId(value ?? "all")}
              >
                <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {agreementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Contrato
              </Label>
              <Select
                value={contract}
                onValueChange={(value) => setContract(value ?? "all")}
              >
                <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {contractOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Classificacao
              </Label>
              <Select
                value={revenueType}
                onValueChange={(value) => setRevenueType(value ?? "all")}
              >
                <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="NOVO">NOVO</SelectItem>
                  <SelectItem value="COLCHAO">COLCHAO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Vencimento de
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Vencimento ate
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-10 rounded-lg border-border/70 bg-background shadow-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ParcelasCentralTable
        rows={filteredInstallments}
        agreements={agreementRows}
        wallets={wallets}
        operators={operators}
        canRegisterWriteOff={canRegisterWriteOff}
        canEditInstallmentRevenueType={canEditInstallmentRevenueType}
        showClientLink={false}
      />
    </div>
  );
}
