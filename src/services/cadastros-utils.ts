import "server-only";

import { z } from "zod";

import { normalizeText } from "@/lib/clientes-utils";
import { isSupabaseConfigured } from "@/lib/env";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const demoEntityIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/i;

function isSupportedEntityId(value: string) {
  return uuidPattern.test(value) || (!isSupabaseConfigured() && demoEntityIdPattern.test(value));
}

export function entityIdSchema(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => isSupportedEntityId(value), message);
}

export function resolveNullableString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function resolveNullableNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
}

export function filterByQuery<T>(
  rows: T[],
  query: string | undefined,
  getSearchText: (row: T) => string,
) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) => normalizeText(getSearchText(row)).includes(normalizedQuery));
}

export function formatMutationError(message: string | undefined, fallback: string) {
  const normalized = normalizeText(message);

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.includes("row level security") ||
    normalized.includes("row-level security") ||
    normalized.includes("permission denied")
  ) {
    return "Seu perfil nao possui permissao para concluir este cadastro.";
  }

  if (normalized.includes("duplicate key")) {
    return "Ja existe um registro com estes dados principais.";
  }

  return message ? `${fallback} Detalhes: ${message}` : fallback;
}
