"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Funnel,
  Medal,
  RotateCcw,
  Search,
} from "lucide-react";

import { CadastroHeader } from "@/components/cadastros/cadastro-header";
import { DateFilter } from "@/components/date-filter";
import { OperatorFilter } from "@/components/operator-filter";
import { TeamFilter } from "@/components/team-filter";
import { WalletFilter } from "@/components/wallet-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSearchParams } from "@/lib/portal-filters";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type {
  DashboardFilters,
  RankingOperatorRow,
  RankingPageData,
  RankingTeamRow,
  RankingView,
  RankingWalletRow,
} from "@/types/portal";

type RankingRowMap = {
  operadores: RankingOperatorRow;
  equipes: RankingTeamRow;
  carteiras: RankingWalletRow;
};

type SortDirection = "asc" | "desc";

interface RankingColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  sortValue: (row: T) => number | string;
  render: (row: T) => ReactNode;
}

interface RankingPageClientProps {
  data: RankingPageData;
}

function compareValues(
  left: number | string,
  right: number | string,
  direction: SortDirection,
) {
  const modifier = direction === "asc" ? 1 : -1;

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * modifier;
  }

  return String(left).localeCompare(String(right)) * modifier;
}

function buildColumns() {
  const progressCell = (value: number) => (
    <div className="min-w-36 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{formatPercent(value)}</span>
      </div>
      <Progress value={Math.max(0, Math.min(value, 100))} />
    </div>
  );

  return {
    operadores: [
      {
        key: "position",
        label: "Posicao",
        sortValue: (row: RankingOperatorRow) => row.position,
        render: (row: RankingOperatorRow) => (
          <Badge variant={row.position <= 3 ? "default" : "outline"} className="rounded-md px-2 py-0.5 text-[11px]">
            #{row.position}
          </Badge>
        ),
      },
      {
        key: "operator",
        label: "Operador",
        sortValue: (row: RankingOperatorRow) => row.operator,
        render: (row: RankingOperatorRow) => (
          <div>
            <p className="font-medium">{row.operator}</p>
            <p className="text-xs text-muted-foreground">{row.team}</p>
          </div>
        ),
      },
      {
        key: "mainWallet",
        label: "Carteira principal",
        sortValue: (row: RankingOperatorRow) => row.mainWallet,
        render: (row: RankingOperatorRow) => row.mainWallet,
      },
      {
        key: "received",
        label: "Valor recebido",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.received,
        render: (row: RankingOperatorRow) => formatCurrency(row.received),
      },
      {
        key: "officeFees",
        label: "Honorarios escritorio",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.officeFees,
        render: (row: RankingOperatorRow) => formatCurrency(row.officeFees),
      },
      {
        key: "agreements",
        label: "Acordos",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.agreements,
        render: (row: RankingOperatorRow) => formatNumber(row.agreements),
      },
      {
        key: "writeOffs",
        label: "Baixas",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.writeOffs,
        render: (row: RankingOperatorRow) => formatNumber(row.writeOffs),
      },
      {
        key: "novo",
        label: "NOVO",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.novo,
        render: (row: RankingOperatorRow) => formatCurrency(row.novo),
      },
      {
        key: "colchao",
        label: "COLCHAO",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.colchao,
        render: (row: RankingOperatorRow) => formatCurrency(row.colchao),
      },
      {
        key: "averageTicket",
        label: "Ticket medio",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.averageTicket,
        render: (row: RankingOperatorRow) => formatCurrency(row.averageTicket),
      },
      {
        key: "goal",
        label: "Meta",
        align: "right",
        sortValue: (row: RankingOperatorRow) => row.goal,
        render: (row: RankingOperatorRow) => formatCurrency(row.goal),
      },
      {
        key: "goalCompletion",
        label: "% Meta",
        sortValue: (row: RankingOperatorRow) => row.goalCompletion,
        render: (row: RankingOperatorRow) => progressCell(row.goalCompletion),
      },
    ] satisfies RankingColumn<RankingOperatorRow>[],
    equipes: [
      {
        key: "position",
        label: "Posicao",
        sortValue: (row: RankingTeamRow) => row.position,
        render: (row: RankingTeamRow) => (
          <Badge variant={row.position <= 3 ? "default" : "outline"} className="rounded-md px-2 py-0.5 text-[11px]">
            #{row.position}
          </Badge>
        ),
      },
      {
        key: "team",
        label: "Equipe",
        sortValue: (row: RankingTeamRow) => row.team,
        render: (row: RankingTeamRow) => (
          <div>
            <p className="font-medium">{row.team}</p>
            <p className="text-xs text-muted-foreground">{row.supervisor}</p>
          </div>
        ),
      },
      {
        key: "activeOperators",
        label: "Operadores ativos",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.activeOperators,
        render: (row: RankingTeamRow) => formatNumber(row.activeOperators),
      },
      {
        key: "received",
        label: "Valor recebido",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.received,
        render: (row: RankingTeamRow) => formatCurrency(row.received),
      },
      {
        key: "officeFees",
        label: "Honorarios escritorio",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.officeFees,
        render: (row: RankingTeamRow) => formatCurrency(row.officeFees),
      },
      {
        key: "agreements",
        label: "Acordos",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.agreements,
        render: (row: RankingTeamRow) => formatNumber(row.agreements),
      },
      {
        key: "writeOffs",
        label: "Baixas",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.writeOffs,
        render: (row: RankingTeamRow) => formatNumber(row.writeOffs),
      },
      {
        key: "novo",
        label: "NOVO",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.novo,
        render: (row: RankingTeamRow) => formatCurrency(row.novo),
      },
      {
        key: "colchao",
        label: "COLCHAO",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.colchao,
        render: (row: RankingTeamRow) => formatCurrency(row.colchao),
      },
      {
        key: "goal",
        label: "Meta",
        align: "right",
        sortValue: (row: RankingTeamRow) => row.goal,
        render: (row: RankingTeamRow) => formatCurrency(row.goal),
      },
      {
        key: "goalCompletion",
        label: "% Meta",
        sortValue: (row: RankingTeamRow) => row.goalCompletion,
        render: (row: RankingTeamRow) => progressCell(row.goalCompletion),
      },
    ] satisfies RankingColumn<RankingTeamRow>[],
    carteiras: [
      {
        key: "position",
        label: "Posicao",
        sortValue: (row: RankingWalletRow) => row.position,
        render: (row: RankingWalletRow) => (
          <Badge variant={row.position <= 3 ? "default" : "outline"} className="rounded-md px-2 py-0.5 text-[11px]">
            #{row.position}
          </Badge>
        ),
      },
      {
        key: "wallet",
        label: "Carteira",
        sortValue: (row: RankingWalletRow) => row.wallet,
        render: (row: RankingWalletRow) => (
          <div>
            <p className="font-medium">{row.wallet}</p>
            <p className="text-xs text-muted-foreground">{row.creditor}</p>
          </div>
        ),
      },
      {
        key: "received",
        label: "Valor recebido",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.received,
        render: (row: RankingWalletRow) => formatCurrency(row.received),
      },
      {
        key: "officeFees",
        label: "Honorarios escritorio",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.officeFees,
        render: (row: RankingWalletRow) => formatCurrency(row.officeFees),
      },
      {
        key: "agreements",
        label: "Acordos",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.agreements,
        render: (row: RankingWalletRow) => formatNumber(row.agreements),
      },
      {
        key: "writeOffs",
        label: "Baixas",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.writeOffs,
        render: (row: RankingWalletRow) => formatNumber(row.writeOffs),
      },
      {
        key: "novo",
        label: "NOVO",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.novo,
        render: (row: RankingWalletRow) => formatCurrency(row.novo),
      },
      {
        key: "colchao",
        label: "COLCHAO",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.colchao,
        render: (row: RankingWalletRow) => formatCurrency(row.colchao),
      },
      {
        key: "averageTicket",
        label: "Ticket medio",
        align: "right",
        sortValue: (row: RankingWalletRow) => row.averageTicket,
        render: (row: RankingWalletRow) => formatCurrency(row.averageTicket),
      },
    ] satisfies RankingColumn<RankingWalletRow>[],
  };
}

function renderHighlight(
  row: RankingOperatorRow | RankingTeamRow | RankingWalletRow,
  view: RankingView,
) {
  if (view === "operadores") {
    const current = row as RankingOperatorRow;
    return {
      title: current.operator,
      subtitle: `${current.team} - ${current.mainWallet}`,
      extra: `${formatPercent(current.goalCompletion)} da meta`,
    };
  }

  if (view === "equipes") {
    const current = row as RankingTeamRow;
    return {
      title: current.team,
      subtitle: `${current.supervisor} - ${formatNumber(current.activeOperators)} operadores`,
      extra: `${formatPercent(current.goalCompletion)} da meta`,
    };
  }

  if (view === "carteiras") {
    const current = row as RankingWalletRow;
    return {
      title: current.wallet,
      subtitle: current.creditor,
      extra: `${formatCurrency(current.averageTicket)} de ticket medio`,
    };
  }

  return {
    title: "",
    subtitle: "",
    extra: "",
  };
}

export function RankingPageClient({ data }: RankingPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [activeView, setActiveView] = useState<RankingView>(data.filters.rankingView ?? "operadores");
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(data.filters);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortState, setSortState] = useState<Record<RankingView, { key: string; direction: SortDirection }>>({
    operadores: { key: "received", direction: "desc" },
    equipes: { key: "received", direction: "desc" },
    carteiras: { key: "received", direction: "desc" },
  });

  const columns = useMemo(() => buildColumns(), []);

  const rowsByView = useMemo(
    () =>
      ({
        operadores: data.operatorRanking,
        equipes: data.teamRanking,
        carteiras: data.walletRanking,
      }) satisfies {
        [K in RankingView]: RankingRowMap[K][];
      },
    [data.operatorRanking, data.teamRanking, data.walletRanking],
  );

  const visibleRows = useMemo(() => {
    const currentRows = rowsByView[activeView] as unknown as Array<Record<string, unknown>>;
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const currentColumns =
      columns[activeView] as unknown as RankingColumn<Record<string, unknown>>[];
    const filtered = !normalizedSearch
      ? currentRows
      : currentRows.filter((row) =>
          currentColumns.some((column) =>
            String(column.sortValue(row)).toLowerCase().includes(normalizedSearch),
          ) ||
          JSON.stringify(row).toLowerCase().includes(normalizedSearch),
        );
    const currentSort = sortState[activeView];

    return [...filtered].sort((left, right) => {
      const currentColumn = currentColumns.find((column) => column.key === currentSort.key);

      if (!currentColumn) {
        return 0;
      }

      return compareValues(
        currentColumn.sortValue(left),
        currentColumn.sortValue(right),
        currentSort.direction,
      );
    }) as unknown as RankingRowMap[typeof activeView][];
  }, [activeView, columns, deferredSearch, rowsByView, sortState]);

  const topHighlights = visibleRows.slice(0, 3);

  function updateFilters(next: Partial<DashboardFilters>) {
    setLocalFilters((current) => ({
      ...current,
      ...next,
    }));
  }

  function applyFilters() {
    const params = createSearchParams(localFilters);
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
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
      router.replace(`${pathname}?${createSearchParams(nextFilters).toString()}`, {
        scroll: false,
      });
    });
  }

  function updateSort(view: RankingView, key: string) {
    setSortState((current) => {
      const nextDirection =
        current[view].key === key && current[view].direction === "desc" ? "asc" : "desc";

      return {
        ...current,
        [view]: {
          key,
          direction: nextDirection,
        },
      };
    });
  }

  return (
    <div className="space-y-6">
      <CadastroHeader
        eyebrow="Visao Geral"
        title="Ranking"
        description="Comparativo por operadores, equipes e carteiras."
      />

      <Card className="dashboard-surface">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Filtros do ranking</p>
              <p className="text-sm text-muted-foreground">
                Aplique o recorte por periodo, time, carteira, tipo de receita e status do acordo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={resetFilters}>
                <RotateCcw className="size-4" />
                Limpar
              </Button>
              <Button type="button" size="sm" className="rounded-lg" disabled={isPending} onClick={applyFilters}>
                <Funnel className="size-4" />
                Aplicar filtros
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            <DateFilter
              month={localFilters.month}
              year={localFilters.year}
              years={data.options.years}
              startDate={localFilters.startDate}
              endDate={localFilters.endDate}
              showRangeInputs
              onMonthChange={(value) => updateFilters({ month: value })}
              onYearChange={(value) => updateFilters({ year: value })}
              onStartDateChange={(value) => updateFilters({ startDate: value || undefined })}
              onEndDateChange={(value) => updateFilters({ endDate: value || undefined })}
            />

            <TeamFilter
              value={localFilters.teamId}
              options={data.options.teams}
              onChange={(value) => updateFilters({ teamId: value })}
            />

            <OperatorFilter
              value={localFilters.operatorId}
              options={data.options.operators}
              onChange={(value) => updateFilters({ operatorId: value })}
            />

            <WalletFilter
              value={localFilters.walletId}
              options={data.options.wallets}
              onChange={(value) => updateFilters({ walletId: value })}
            />

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tipo receita
              </Label>
              <Select
                value={localFilters.revenueType ?? "all"}
                onValueChange={(value) =>
                  updateFilters({
                    revenueType: !value || value === "all" ? undefined : (value as DashboardFilters["revenueType"]),
                  })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {data.options.revenueTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status do acordo
              </Label>
              <Select
                value={localFilters.agreementStatus ?? "all"}
                onValueChange={(value) =>
                  updateFilters({
                    agreementStatus:
                      !value || value === "all"
                        ? undefined
                        : (value as DashboardFilters["agreementStatus"]),
                  })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {data.options.agreementStatuses.map((option) => (
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Valor recebido</p>
            <p className="text-3xl font-semibold tracking-tight">{formatCurrency(data.summary.totalReceived)}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Honorarios escritorio</p>
            <p className="text-3xl font-semibold tracking-tight">{formatCurrency(data.summary.totalOfficeFees)}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Baixas</p>
            <p className="text-3xl font-semibold tracking-tight">{formatNumber(data.summary.totalWriteOffs)}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">Acordos</p>
            <p className="text-3xl font-semibold tracking-tight">{formatNumber(data.summary.totalAgreements)}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">% Meta</p>
            <p className="text-3xl font-semibold tracking-tight">{formatPercent(data.summary.goalCompletion)}</p>
          </CardContent>
        </Card>
      </section>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as RankingView)} className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto rounded-2xl p-1">
            <TabsTrigger value="operadores" className="px-4 py-2.5">
              Operadores
            </TabsTrigger>
            <TabsTrigger value="equipes" className="px-4 py-2.5">
              Equipes
            </TabsTrigger>
            <TabsTrigger value="carteiras" className="px-4 py-2.5">
              Carteiras
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar na tabela atual"
              className="h-11 rounded-lg pl-9"
            />
          </div>
        </div>

        {(["operadores", "equipes", "carteiras"] as RankingView[]).map((view) => (
          <TabsContent key={view} value={view} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {topHighlights.length ? (
                topHighlights.map((row, index) => {
                  const highlight = renderHighlight(
                    row as RankingOperatorRow | RankingTeamRow | RankingWalletRow,
                    activeView,
                  );

                  return (
                    <Card key={`${view}-${index}`} className="dashboard-surface">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant={index === 0 ? "default" : "outline"} className="rounded-md px-2 py-0.5 text-[11px]">
                            #{index + 1}
                          </Badge>
                          <Medal className="size-4 text-primary/70" />
                        </div>
                        <div>
                          <p className="font-medium">{highlight.title}</p>
                          <p className="text-sm text-muted-foreground">{highlight.subtitle}</p>
                        </div>
                        <p className="text-3xl font-semibold tracking-tight">
                          {formatCurrency(
                            (row as RankingOperatorRow | RankingTeamRow | RankingWalletRow)
                              .received,
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{highlight.extra}</p>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="dashboard-surface lg:col-span-3">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Nenhum resultado encontrado para o recorte atual.
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="dashboard-surface overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/70 hover:bg-transparent">
                      {(columns[activeView] as RankingColumn<RankingRowMap[typeof activeView]>[]).map((column) => (
                        <TableHead
                          key={`${activeView}-${column.key}`}
                          className={cn(
                            "h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                            column.align === "right" && "text-right",
                          )}
                        >
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-2",
                              column.align === "right" && "ml-auto",
                            )}
                            onClick={() => updateSort(activeView, column.key)}
                          >
                            {column.label}
                            <ArrowUpDown className="size-3.5" />
                          </button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.length ? (
                      visibleRows.map((row, rowIndex) => (
                        <TableRow key={`${activeView}-${rowIndex}`} className="border-border/60 hover:bg-muted/15">
                          {(columns[activeView] as RankingColumn<RankingRowMap[typeof activeView]>[]).map((column) => (
                            <TableCell
                              key={`${activeView}-${rowIndex}-${column.key}`}
                              className={cn(
                                "px-4 py-3.5 text-sm",
                                column.align === "right" && "text-right font-mono",
                              )}
                            >
                              {column.render(row)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns[activeView].length}
                          className="px-4 py-12 text-center text-sm text-muted-foreground"
                        >
                          Nenhum dado encontrado para os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
