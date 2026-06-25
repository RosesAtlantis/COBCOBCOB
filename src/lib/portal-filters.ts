import type { DashboardFilters, FilterOption } from "@/types/portal";

type SearchParamsLike =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParam(
  searchParams: SearchParamsLike,
  key: string,
): string | undefined {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseDashboardFilters(searchParams: SearchParamsLike) {
  const now = new Date();
  const month = Number(readSearchParam(searchParams, "mes") ?? now.getMonth() + 1);
  const year = Number(readSearchParam(searchParams, "ano") ?? now.getFullYear());

  const filters: DashboardFilters = {
    month: Number.isFinite(month) ? month : now.getMonth() + 1,
    year: Number.isFinite(year) ? year : now.getFullYear(),
    startDate: readSearchParam(searchParams, "inicio") || undefined,
    endDate: readSearchParam(searchParams, "fim") || undefined,
    teamId: readSearchParam(searchParams, "equipe") || undefined,
    operatorId: readSearchParam(searchParams, "operador") || undefined,
    walletId: readSearchParam(searchParams, "carteira") || undefined,
    creditor: readSearchParam(searchParams, "credor") || undefined,
    revenueType:
      (readSearchParam(searchParams, "tipoReceita") as DashboardFilters["revenueType"]) ||
      undefined,
    agreementStatus:
      (readSearchParam(searchParams, "statusAcordo") as DashboardFilters["agreementStatus"]) ||
      undefined,
    rankingView:
      (readSearchParam(searchParams, "visao") as DashboardFilters["rankingView"]) ||
      undefined,
  };

  return filters;
}

export function getMonthOptions(): FilterOption[] {
  return [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ].map((label, index) => ({
    value: String(index + 1),
    label,
  }));
}

export function createSearchParams(filters: DashboardFilters) {
  const params = new URLSearchParams();

  params.set("mes", String(filters.month));
  params.set("ano", String(filters.year));

  if (filters.startDate) {
    params.set("inicio", filters.startDate);
  }

  if (filters.endDate) {
    params.set("fim", filters.endDate);
  }

  if (filters.teamId) {
    params.set("equipe", filters.teamId);
  }

  if (filters.operatorId) {
    params.set("operador", filters.operatorId);
  }

  if (filters.walletId) {
    params.set("carteira", filters.walletId);
  }

  if (filters.creditor) {
    params.set("credor", filters.creditor);
  }

  if (filters.revenueType) {
    params.set("tipoReceita", filters.revenueType);
  }

  if (filters.agreementStatus) {
    params.set("statusAcordo", filters.agreementStatus);
  }

  if (filters.rankingView) {
    params.set("visao", filters.rankingView);
  }

  return params;
}
