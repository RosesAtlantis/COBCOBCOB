import { formatCpfCnpj, formatPhone } from "@/lib/formatters";
import { normalizeCpfCnpj, normalizePhone, onlyDigits } from "@/lib/validators";

export function maskCpfCnpjInput(value: string | null | undefined) {
  return formatCpfCnpj(normalizeCpfCnpj(value ?? ""));
}

export function maskPhoneInput(value: string | null | undefined) {
  return formatPhone(normalizePhone(value ?? ""));
}

export function maskCepInput(value: string | null | undefined) {
  const digits = onlyDigits(value ?? "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return digits.replace(/(\d{5})(\d+)/, "$1-$2");
}
