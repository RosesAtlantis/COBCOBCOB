"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Funnel, RotateCcw } from "lucide-react";

import { DateFilter } from "@/components/date-filter";
import { OperatorFilter } from "@/components/operator-filter";
import { TeamFilter } from "@/components/team-filter";
import { WalletFilter } from "@/components/wallet-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSearchParams } from "@/lib/portal-filters";
import type { DashboardFilters, FilterOptions } from "@/types/portal";

interface FilterBarProps {
  filters: DashboardFilters;
  options: FilterOptions;
  showOperatorFilter?: boolean;
  showTeamFilter?: boolean;
  showWalletFilter?: boolean;
  showCreditorFilter?: boolean;
}

export function FilterBar({
  filters,
  options,
  showOperatorFilter = true,
  showTeamFilter = true,
  showWalletFilter = true,
  showCreditorFilter = true,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState(filters);

  const availableOperators = useMemo(() => {
    if (!localFilters.teamId) {
      return options.operators;
    }

    return options.operators;
  }, [localFilters.teamId, options.operators]);

  function updateFilters(next: Partial<DashboardFilters>) {
    setLocalFilters((current) => ({
      ...current,
      ...next,
    }));
  }

  function applyFilters() {
    const params = createSearchParams(localFilters);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function resetFilters() {
    const now = new Date();
    const nextFilters: DashboardFilters = {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
    setLocalFilters(nextFilters);
    startTransition(() => {
      router.replace(`${pathname}?${createSearchParams(nextFilters).toString()}`);
    });
  }

  return (
    <Card className="dashboard-surface">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Filtros globais</p>
            <p className="text-sm text-muted-foreground">
              Atualize cards, graficos e tabelas da pagina com o mesmo recorte.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" onClick={resetFilters}>
              <RotateCcw className="size-4" />
              Limpar
            </Button>
            <Button size="sm" type="button" disabled={isPending} onClick={applyFilters}>
              <Funnel className="size-4" />
              Aplicar filtros
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DateFilter
            month={localFilters.month}
            year={localFilters.year}
            years={options.years}
            startDate={localFilters.startDate}
            endDate={localFilters.endDate}
            onMonthChange={(value) => updateFilters({ month: value })}
            onYearChange={(value) => updateFilters({ year: value })}
            onStartDateChange={(value) => updateFilters({ startDate: value || undefined })}
            onEndDateChange={(value) => updateFilters({ endDate: value || undefined })}
          />

          {showTeamFilter ? (
            <TeamFilter
              value={localFilters.teamId}
              options={options.teams}
              onChange={(value) =>
                updateFilters({
                  teamId: value,
                  operatorId: value ? localFilters.operatorId : undefined,
                })
              }
            />
          ) : null}

          {showOperatorFilter ? (
            <OperatorFilter
              value={localFilters.operatorId}
              options={availableOperators}
              onChange={(value) => updateFilters({ operatorId: value })}
            />
          ) : null}

          {showWalletFilter ? (
            <WalletFilter
              value={localFilters.walletId}
              options={options.wallets}
              onChange={(value) => updateFilters({ walletId: value })}
            />
          ) : null}

          {showCreditorFilter ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Credor
              </Label>
              <Select
                value={localFilters.creditor ?? "all"}
                onValueChange={(value) =>
                  updateFilters({
                    creditor:
                      !value || value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {options.creditors.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
