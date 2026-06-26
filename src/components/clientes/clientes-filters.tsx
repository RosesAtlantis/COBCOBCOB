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
import { createClientSearchParams } from "@/lib/clientes-filters";
import type { ClientFilterOptions, ClientListFilters } from "@/types/portal";

interface ClientesFiltersProps {
  filters: ClientListFilters;
  options: ClientFilterOptions;
}

export function ClientesFilters({ filters, options }: ClientesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState<ClientListFilters>(filters);
  const controlClassName = "h-11 rounded-lg border-border/70 bg-background shadow-none";

  function updateFilter(next: Partial<ClientListFilters>) {
    setLocalFilters((current) => ({ ...current, ...next }));
  }

  function applyFilters() {
    const params = createClientSearchParams(localFilters);
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  function resetFilters() {
    const nextFilters: ClientListFilters = {};
    setLocalFilters(nextFilters);
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <Card className="dashboard-surface">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">Filtros operacionais</p>
            <p className="text-sm text-muted-foreground">
              Pesquise por nome, CPF/CNPJ ou contrato e refine a fila pelos filtros principais.
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
              placeholder="Nome, CPF/CNPJ ou contrato"
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
                  walletId: !value || value === "all" ? undefined : value,
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
                  teamId: !value || value === "all" ? undefined : value,
                  operatorId: !value || value === "all" ? undefined : localFilters.operatorId,
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
                  operatorId: !value || value === "all" ? undefined : value,
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
                    !value || value === "all"
                      ? undefined
                      : (value as ClientListFilters["status"]),
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
