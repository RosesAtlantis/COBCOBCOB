"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";

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
import { createInstallmentCenterSearchParams } from "@/lib/financeiro-filters";
import type {
  InstallmentCenterFilterOptions,
  InstallmentCenterFilters,
} from "@/types/portal";

interface ParcelasFiltersProps {
  filters: InstallmentCenterFilters;
  options: InstallmentCenterFilterOptions;
}

export function ParcelasFilters({ filters, options }: ParcelasFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState<InstallmentCenterFilters>(filters);
  const controlClassName = "h-10 rounded-lg border-border/70 bg-background shadow-none";

  function updateFilter(next: Partial<InstallmentCenterFilters>) {
    setLocalFilters((current) => ({ ...current, ...next }));
  }

  function applyFilters() {
    const params = createInstallmentCenterSearchParams(localFilters);
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  function resetFilters() {
    setLocalFilters({});
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <Card className="dashboard-surface">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">Filtros da Central de Parcelas</p>
            <p className="text-sm text-muted-foreground">
              Trabalhe por vencimento, status e fila financeira sem perder o contexto
              de cliente, carteira e operador.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              disabled={isPending}
              onClick={applyFilters}
            >
              <Search className="size-4" />
              Buscar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Busca
            </Label>
            <Input
              value={localFilters.query ?? ""}
              onChange={(event) => updateFilter({ query: event.target.value || undefined })}
              placeholder="Cliente, CPF/CNPJ ou contrato"
              className={controlClassName}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vencimento de
            </Label>
            <Input
              type="date"
              value={localFilters.startDate ?? ""}
              onChange={(event) => updateFilter({ startDate: event.target.value || undefined })}
              className={controlClassName}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vencimento ate
            </Label>
            <Input
              type="date"
              value={localFilters.endDate ?? ""}
              onChange={(event) => updateFilter({ endDate: event.target.value || undefined })}
              className={controlClassName}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Carteira
            </Label>
            <Select
              value={localFilters.walletId ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  walletId: value && value !== "all" ? value : undefined,
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {options.wallets.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Equipe
            </Label>
            <Select
              value={localFilters.teamId ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  teamId: value && value !== "all" ? value : undefined,
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {options.teams.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Operador
            </Label>
            <Select
              value={localFilters.operatorId ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  operatorId: value && value !== "all" ? value : undefined,
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {options.operators.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </Label>
            <Select
              value={localFilters.status ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  status:
                    value === "all"
                      ? undefined
                      : (value as InstallmentCenterFilters["status"]),
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {options.statuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tipo receita
            </Label>
            <Select
              value={localFilters.revenueType ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  revenueType:
                    value === "all"
                      ? undefined
                      : (value as InstallmentCenterFilters["revenueType"]),
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {options.revenueTypes?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
