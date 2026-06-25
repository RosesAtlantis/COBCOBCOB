import { normalizeCpfCnpj, normalizePhone } from "@/lib/validators";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCpf(digits: string) {
  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  }

  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
}

function formatCnpj(digits: string) {
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return digits.replace(/(\d{2})(\d+)/, "$1.$2");
  }

  if (digits.length <= 8) {
    return digits.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  }

  if (digits.length <= 12) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  }

  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
}

export function formatCpfCnpj(value: string | number | null | undefined) {
  const digits = normalizeCpfCnpj(value);

  if (!digits) {
    return "";
  }

  return digits.length <= 11 ? formatCpf(digits) : formatCnpj(digits);
}

export function formatPhone(value: string | number | null | undefined) {
  const digits = normalizePhone(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  }

  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  }

  return digits.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
}

export function formatCurrencyBR(value: number | null | undefined) {
  return currencyFormatter.format(Number.isFinite(value) ? Number(value) : 0);
}

export function formatPercent(value: number | null | undefined) {
  return `${percentFormatter.format(Number.isFinite(value) ? Number(value) : 0)}%`;
}
