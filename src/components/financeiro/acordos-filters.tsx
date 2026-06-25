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
import { createAgreementCenterSearchParams } from "@/lib/financeiro-filters";
import type {
  AgreementCenterFilterOptions,
  AgreementCenterFilters,
} from "@/types/portal";

interface AcordosFiltersProps {
  filters: AgreementCenterFilters;
  options: AgreementCenterFilterOptions;
}

export function AcordosFilters({ filters, options }: AcordosFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState<AgreementCenterFilters>(filters);
  const controlClassName = "h-10 rounded-lg border-border/70 bg-background shadow-none";

  function updateFilter(next: Partial<AgreementCenterFilters>) {
    setLocalFilters((current) => ({ ...current, ...next }));
  }

  function applyFilters() {
    const params = createAgreementCenterSearchParams(localFilters);
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  function resetFilters() {
    setLocalFilters({});
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <Card className="dashboard-surface">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">Filtros da Central de Acordos</p>
            <p className="text-sm text-muted-foreground">
              Pesquise por cliente, CPF/CNPJ ou contrato e refine a visao por periodo,
              carteira, equipe, operador e faixa de valor.
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
              Inicio
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
              Fim
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
              Valor minimo
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={localFilters.minValue ?? ""}
              onChange={(event) =>
                updateFilter({
                  minValue: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              className={controlClassName}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Valor maximo
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={localFilters.maxValue ?? ""}
              onChange={(event) =>
                updateFilter({
                  maxValue: event.target.value ? Number(event.target.value) : undefined,
                })
              }
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
                      : (value as AgreementCenterFilters["status"]),
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
        </div>
      </CardContent>
    </Card>
  );
}
