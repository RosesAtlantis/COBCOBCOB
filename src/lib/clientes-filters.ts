import type { ClientListFilters } from "@/types/portal";

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

export function parseClientFilters(searchParams: SearchParamsLike) {
  const filters: ClientListFilters = {
    query: readSearchParam(searchParams, "q") || undefined,
    walletId: readSearchParam(searchParams, "carteira") || undefined,
    creditor: readSearchParam(searchParams, "credor") || undefined,
    city: readSearchParam(searchParams, "cidade") || undefined,
    state: readSearchParam(searchParams, "uf") || undefined,
    teamId: readSearchParam(searchParams, "equipe") || undefined,
    operatorId: readSearchParam(searchParams, "operador") || undefined,
    status: (readSearchParam(searchParams, "status") as ClientListFilters["status"]) || undefined,
  };

  return filters;
}

export function createClientSearchParams(filters: ClientListFilters) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.walletId) {
    params.set("carteira", filters.walletId);
  }

  if (filters.creditor) {
    params.set("credor", filters.creditor);
  }

  if (filters.city) {
    params.set("cidade", filters.city);
  }

  if (filters.state) {
    params.set("uf", filters.state);
  }

  if (filters.teamId) {
    params.set("equipe", filters.teamId);
  }

  if (filters.operatorId) {
    params.set("operador", filters.operatorId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return params;
}
