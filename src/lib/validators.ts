const repeatedDigitsPattern = /^(\d)\1+$/;

function roundTo(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeLocaleNumber(value: string) {
  const sanitized = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/R\$/gi, "")
    .replace(/[^0-9,.-]/g, "");

  if (!sanitized || sanitized === "," || sanitized === ".") {
    return null;
  }

  if (sanitized.includes("-")) {
    return null;
  }

  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    const digits = sanitized.replace(/\D/g, "");
    return digits || null;
  }

  const integerDigits = sanitized.slice(0, decimalIndex).replace(/\D/g, "");
  const fractionDigits = sanitized.slice(decimalIndex + 1).replace(/\D/g, "");
  const separators = sanitized.match(/[.,]/g)?.length ?? 0;
  const usesSingleSeparator = (lastComma === -1 || lastDot === -1) && separators === 1;

  if (usesSingleSeparator && fractionDigits.length === 3 && integerDigits.length >= 1) {
    return `${integerDigits}${fractionDigits}`;
  }

  if (!integerDigits && !fractionDigits) {
    return null;
  }

  return fractionDigits
    ? `${integerDigits || "0"}.${fractionDigits}`
    : integerDigits || "0";
}

function isValidCpf(value: string) {
  if (value.length !== 11 || repeatedDigitsPattern.test(value)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    sum += Number(value[index]) * (10 - index);
  }

  let verifier = (sum * 10) % 11;

  if (verifier === 10) {
    verifier = 0;
  }

  if (verifier !== Number(value[9])) {
    return false;
  }

  sum = 0;

  for (let index = 0; index < 10; index += 1) {
    sum += Number(value[index]) * (11 - index);
  }

  verifier = (sum * 10) % 11;

  if (verifier === 10) {
    verifier = 0;
  }

  return verifier === Number(value[10]);
}

function isValidCnpj(value: string) {
  if (value.length !== 14 || repeatedDigitsPattern.test(value)) {
    return false;
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const calculateVerifier = (digits: string, weights: number[]) => {
    const total = digits
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstVerifier = calculateVerifier(value.slice(0, 12), firstWeights);
  const secondVerifier = calculateVerifier(value.slice(0, 12) + firstVerifier, secondWeights);

  return firstVerifier === Number(value[12]) && secondVerifier === Number(value[13]);
}

export function onlyDigits(value: string | number | null | undefined) {
  return String(value ?? "").replace(/\D+/g, "");
}

export function normalizeCpfCnpj(value: string | number | null | undefined) {
  return onlyDigits(value).slice(0, 14);
}

export function detectCpfCnpjType(value: string | number | null | undefined) {
  const digits = normalizeCpfCnpj(value);

  if (digits.length === 11) {
    return "CPF" as const;
  }

  if (digits.length === 14) {
    return "CNPJ" as const;
  }

  return "INVALIDO" as const;
}

export function isValidCpfCnpjLength(value: string | number | null | undefined) {
  const digits = normalizeCpfCnpj(value);
  return digits.length === 11 || digits.length === 14;
}

export function isValidCpfCnpj(value: string | number | null | undefined) {
  const digits = normalizeCpfCnpj(value);

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

export function normalizePhone(value: string | number | null | undefined) {
  return onlyDigits(value).slice(0, 11);
}

export function isValidPhoneLength(value: string | number | null | undefined) {
  const digits = normalizePhone(value);
  return digits.length === 10 || digits.length === 11;
}

export function parseCurrencyBR(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? roundTo(value, 2) : null;
  }

  const normalized = normalizeLocaleNumber(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return roundTo(parsed, 2);
}

export function parsePercent(value: string | number | null | undefined) {
  const parsed = parseCurrencyBR(value);

  if (parsed === null || parsed < 0 || parsed > 100) {
    return null;
  }

  return roundTo(parsed, 2);
}

export function parseInteger(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
