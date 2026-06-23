import type { AuditFilters } from "@/types/portal";

type SearchParamsLike =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParam(searchParams: SearchParamsLike, key: string) {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseAuditFilters(searchParams: SearchParamsLike): AuditFilters {
  return {
    query: readSearchParam(searchParams, "q") || undefined,
    entity: readSearchParam(searchParams, "entidade") || undefined,
    action: readSearchParam(searchParams, "acao") || undefined,
    userId: readSearchParam(searchParams, "usuario") || undefined,
    importId: readSearchParam(searchParams, "importacao") || undefined,
    startDate: readSearchParam(searchParams, "inicio") || undefined,
    endDate: readSearchParam(searchParams, "fim") || undefined,
  };
}

export function createAuditSearchParams(filters: AuditFilters) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.entity) {
    params.set("entidade", filters.entity);
  }

  if (filters.action) {
    params.set("acao", filters.action);
  }

  if (filters.userId) {
    params.set("usuario", filters.userId);
  }

  if (filters.importId) {
    params.set("importacao", filters.importId);
  }

  if (filters.startDate) {
    params.set("inicio", filters.startDate);
  }

  if (filters.endDate) {
    params.set("fim", filters.endDate);
  }

  return params;
}
