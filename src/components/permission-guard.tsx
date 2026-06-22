import { hasRoleAccess } from "@/lib/permissions";
import type { PortalRole } from "@/types/portal";

interface PermissionGuardProps {
  role: PortalRole;
  allowedRoles: PortalRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  role,
  allowedRoles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  if (!hasRoleAccess(role, allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
