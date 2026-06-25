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
import { createWriteOffCenterSearchParams } from "@/lib/financeiro-filters";
import type {
  WriteOffCenterFilterOptions,
  WriteOffCenterFilters,
} from "@/types/portal";

interface BaixasFiltersProps {
  filters: WriteOffCenterFilters;
  options: WriteOffCenterFilterOptions;
}

export function BaixasFilters({ filters, options }: BaixasFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState<WriteOffCenterFilters>(filters);
  const controlClassName = "h-10 rounded-lg border-border/70 bg-background shadow-none";

  function updateFilter(next: Partial<WriteOffCenterFilters>) {
    setLocalFilters((current) => ({ ...current, ...next }));
  }

  function applyFilters() {
    const params = createWriteOffCenterSearchParams(localFilters);
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
            <p className="text-sm font-semibold">Filtros da Central de Baixas</p>
            <p className="text-sm text-muted-foreground">
              Navegue por pagamento, carteira, operador, forma de recebimento e
              usuario responsavel pelo registro.
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
              Pagamento de
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
              Pagamento ate
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
              Forma
            </Label>
            <Select
              value={localFilters.paymentMethod ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  paymentMethod: value && value !== "all" ? value : undefined,
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {options.paymentMethods.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Registrado por
            </Label>
            <Select
              value={localFilters.registeredBy ?? "all"}
              onValueChange={(value) =>
                updateFilter({
                  registeredBy: value && value !== "all" ? value : undefined,
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {options.registeredBy.map((option) => (
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
                    value && value !== "all"
                      ? (value as WriteOffCenterFilters["revenueType"])
                      : undefined,
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
              Estorno
            </Label>
            <Select
              value={localFilters.reversedStatus ?? "todas"}
              onValueChange={(value) =>
                updateFilter({
                  reversedStatus:
                    value === "todas"
                      ? undefined
                      : (value as WriteOffCenterFilters["reversedStatus"]),
                })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                {options.reversedStatuses?.map((option) => (
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
