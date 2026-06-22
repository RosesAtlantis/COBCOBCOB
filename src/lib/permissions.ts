import type { PortalRole } from "@/types/portal";

export const portalRoles: PortalRole[] = [
  "admin",
  "gerente",
  "supervisor",
  "operador",
  "financeiro",
];

export const roleLabels: Record<PortalRole, string> = {
  admin: "Admin",
  gerente: "Gerente",
  supervisor: "Supervisor",
  operador: "Operador",
  financeiro: "Financeiro",
};

export function isPortalRole(value: string): value is PortalRole {
  return portalRoles.includes(value as PortalRole);
}

export function hasRoleAccess(
  currentRole: PortalRole,
  allowedRoles: PortalRole[],
) {
  return allowedRoles.includes(currentRole);
}

export function canImport(currentRole: PortalRole) {
  return ["admin", "gerente", "supervisor", "financeiro"].includes(currentRole);
}

export function canManageAdmin(currentRole: PortalRole) {
  return ["admin", "gerente"].includes(currentRole);
}

export function canSeeFinancialOverview(currentRole: PortalRole) {
  return ["admin", "gerente", "financeiro", "supervisor"].includes(
    currentRole,
  );
}

export function canViewClients(currentRole: PortalRole) {
  return ["admin", "gerente", "supervisor", "operador", "financeiro"].includes(
    currentRole,
  );
}

export function canCreateAgreements(currentRole: PortalRole) {
  return ["admin", "gerente", "supervisor", "operador"].includes(currentRole);
}

export function canCancelAgreements(currentRole: PortalRole) {
  return ["admin", "gerente", "supervisor"].includes(currentRole);
}

export function canRegisterAgreementPayments(currentRole: PortalRole) {
  return ["admin", "gerente", "financeiro", "supervisor"].includes(
    currentRole,
  );
}

export function getHomePathByRole(currentRole: PortalRole) {
  return currentRole === "operador" ? "/operador" : "/dashboard";
}
