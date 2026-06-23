import type {
  AgreementCenterFilters,
  AgreementInstallmentStatus,
  AgreementStatus,
  InstallmentCenterFilters,
  WriteOffCenterFilters,
} from "@/types/portal";

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

function readNumberParam(searchParams: SearchParamsLike, key: string) {
  const value = readSearchParam(searchParams, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseAgreementCenterFilters(searchParams: SearchParamsLike) {
  const filters: AgreementCenterFilters = {
    query: readSearchParam(searchParams, "q") || undefined,
    walletId: readSearchParam(searchParams, "carteira") || undefined,
    creditor: readSearchParam(searchParams, "credor") || undefined,
    teamId: readSearchParam(searchParams, "equipe") || undefined,
    operatorId: readSearchParam(searchParams, "operador") || undefined,
    status:
      (readSearchParam(searchParams, "status") as AgreementStatus | undefined) ||
      undefined,
    startDate: readSearchParam(searchParams, "inicio") || undefined,
    endDate: readSearchParam(searchParams, "fim") || undefined,
    minValue: readNumberParam(searchParams, "valorMin"),
    maxValue: readNumberParam(searchParams, "valorMax"),
  };

  return filters;
}

export function createAgreementCenterSearchParams(filters: AgreementCenterFilters) {
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

  if (filters.teamId) {
    params.set("equipe", filters.teamId);
  }

  if (filters.operatorId) {
    params.set("operador", filters.operatorId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.startDate) {
    params.set("inicio", filters.startDate);
  }

  if (filters.endDate) {
    params.set("fim", filters.endDate);
  }

  if (typeof filters.minValue === "number") {
    params.set("valorMin", String(filters.minValue));
  }

  if (typeof filters.maxValue === "number") {
    params.set("valorMax", String(filters.maxValue));
  }

  return params;
}

export function parseInstallmentCenterFilters(searchParams: SearchParamsLike) {
  const filters: InstallmentCenterFilters = {
    query: readSearchParam(searchParams, "q") || undefined,
    walletId: readSearchParam(searchParams, "carteira") || undefined,
    creditor: readSearchParam(searchParams, "credor") || undefined,
    teamId: readSearchParam(searchParams, "equipe") || undefined,
    operatorId: readSearchParam(searchParams, "operador") || undefined,
    status:
      (readSearchParam(
        searchParams,
        "status",
      ) as AgreementInstallmentStatus | undefined) || undefined,
    revenueType:
      (readSearchParam(searchParams, "tipoReceita") as
        | InstallmentCenterFilters["revenueType"]
        | undefined) || undefined,
    startDate: readSearchParam(searchParams, "inicio") || undefined,
    endDate: readSearchParam(searchParams, "fim") || undefined,
  };

  return filters;
}

export function createInstallmentCenterSearchParams(
  filters: InstallmentCenterFilters,
) {
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

  if (filters.teamId) {
    params.set("equipe", filters.teamId);
  }

  if (filters.operatorId) {
    params.set("operador", filters.operatorId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.revenueType) {
    params.set("tipoReceita", filters.revenueType);
  }

  if (filters.startDate) {
    params.set("inicio", filters.startDate);
  }

  if (filters.endDate) {
    params.set("fim", filters.endDate);
  }

  return params;
}

export function parseWriteOffCenterFilters(searchParams: SearchParamsLike) {
  const filters: WriteOffCenterFilters = {
    query: readSearchParam(searchParams, "q") || undefined,
    walletId: readSearchParam(searchParams, "carteira") || undefined,
    creditor: readSearchParam(searchParams, "credor") || undefined,
    teamId: readSearchParam(searchParams, "equipe") || undefined,
    operatorId: readSearchParam(searchParams, "operador") || undefined,
    paymentMethod: readSearchParam(searchParams, "forma") || undefined,
    registeredBy: readSearchParam(searchParams, "registradoPor") || undefined,
    revenueType:
      (readSearchParam(searchParams, "tipoReceita") as
        | WriteOffCenterFilters["revenueType"]
        | undefined) || undefined,
    reversedStatus:
      (readSearchParam(searchParams, "estorno") as
        | WriteOffCenterFilters["reversedStatus"]
        | undefined) || undefined,
    startDate: readSearchParam(searchParams, "inicio") || undefined,
    endDate: readSearchParam(searchParams, "fim") || undefined,
  };

  return filters;
}

export function createWriteOffCenterSearchParams(filters: WriteOffCenterFilters) {
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

  if (filters.teamId) {
    params.set("equipe", filters.teamId);
  }

  if (filters.operatorId) {
    params.set("operador", filters.operatorId);
  }

  if (filters.paymentMethod) {
    params.set("forma", filters.paymentMethod);
  }

  if (filters.registeredBy) {
    params.set("registradoPor", filters.registeredBy);
  }

  if (filters.revenueType) {
    params.set("tipoReceita", filters.revenueType);
  }

  if (filters.reversedStatus) {
    params.set("estorno", filters.reversedStatus);
  }

  if (filters.startDate) {
    params.set("inicio", filters.startDate);
  }

  if (filters.endDate) {
    params.set("fim", filters.endDate);
  }

  return params;
}
