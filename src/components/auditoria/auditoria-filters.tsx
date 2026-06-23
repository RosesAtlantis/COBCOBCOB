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
import { createAuditSearchParams } from "@/lib/auditoria-filters";
import type { AuditFilterOptions, AuditFilters } from "@/types/portal";

interface AuditoriaFiltersProps {
  filters: AuditFilters;
  options: AuditFilterOptions;
}

export function AuditoriaFilters({
  filters,
  options,
}: AuditoriaFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localFilters, setLocalFilters] = useState<AuditFilters>(filters);
  const controlClassName = "h-10 rounded-lg border-border/70 bg-background shadow-none";

  function updateFilter(next: Partial<AuditFilters>) {
    setLocalFilters((current) => ({ ...current, ...next }));
  }

  function applyFilters() {
    const params = createAuditSearchParams(localFilters);
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
            <p className="text-sm font-semibold">Filtros da Auditoria</p>
            <p className="text-sm text-muted-foreground">
              Consulte por usuario, entidade, acao, periodo e importacao.
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Busca
            </Label>
            <Input
              value={localFilters.query ?? ""}
              onChange={(event) => updateFilter({ query: event.target.value || undefined })}
              placeholder="Cliente, descricao, usuario ou importacao"
              className={controlClassName}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Entidade
            </Label>
            <Select
              value={localFilters.entity ?? "all"}
              onValueChange={(value) =>
                updateFilter({ entity: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {options.entities.map((option) => (
                  <SelectItem key={option.value ?? "entity"} value={option.value ?? ""}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Acao
            </Label>
            <Select
              value={localFilters.action ?? "all"}
              onValueChange={(value) =>
                updateFilter({ action: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {options.actions.map((option) => (
                  <SelectItem key={option.value ?? "action"} value={option.value ?? ""}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Usuario
            </Label>
            <Select
              value={localFilters.userId ?? "all"}
              onValueChange={(value) =>
                updateFilter({ userId: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {options.users.map((option) => (
                  <SelectItem key={option.value ?? "user"} value={option.value ?? ""}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Importacao
            </Label>
            <Select
              value={localFilters.importId ?? "all"}
              onValueChange={(value) =>
                updateFilter({ importId: !value || value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {options.imports.map((option) => (
                  <SelectItem key={option.value ?? "import"} value={option.value ?? ""}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              De
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
              Ate
            </Label>
            <Input
              type="date"
              value={localFilters.endDate ?? ""}
              onChange={(event) => updateFilter({ endDate: event.target.value || undefined })}
              className={controlClassName}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
