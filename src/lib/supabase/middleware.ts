import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  DEMO_ROLE_COOKIE,
  getSupabasePublicEnv,
  isSupabaseConfigured,
} from "@/lib/env";
import {
  getHomePathByRole,
  hasRoleAccess,
  isPortalRole,
} from "@/lib/permissions";
import type { PortalRole } from "@/types/portal";

const protectedRoutes = [
  "/dashboard",
  "/ranking",
  "/equipes",
  "/carteiras",
  "/operador",
  "/importacoes",
  "/admin",
];

const routeRoleRules: Array<{
  allowedRoles: PortalRole[];
  route: string;
}> = [
  {
    route: "/admin",
    allowedRoles: ["admin", "gerente"],
  },
  {
    route: "/operador",
    allowedRoles: ["operador"],
  },
];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getAllowedRolesForPath(pathname: string) {
  return (
    routeRoleRules.find((rule) => matchesRoute(pathname, rule.route))?.allowedRoles ??
    null
  );
}

function getProfileIssuePath(
  reason: "profile-ausente" | "profile-inativo" | "profile-invalido",
  request: NextRequest,
) {
  return new URL(`/acesso-negado?motivo=${reason}`, request.url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    const demoRole = request.cookies.get(DEMO_ROLE_COOKIE)?.value;

    if (pathname === "/login" && demoRole && isPortalRole(demoRole)) {
      return NextResponse.redirect(new URL(getHomePathByRole(demoRole), request.url));
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user) {
    return response;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("perfil, ativo")
    .eq("user_id", user.id)
    .maybeSingle();

  const role =
    profileRow && isPortalRole(profileRow.perfil) ? profileRow.perfil : null;
  const hasActiveProfile = Boolean(profileRow?.ativo && role);

  if (pathname === "/login") {
    if (hasActiveProfile && role) {
      return NextResponse.redirect(new URL(getHomePathByRole(role), request.url));
    }

    if (!profileRow) {
      return NextResponse.redirect(
        getProfileIssuePath("profile-ausente", request),
      );
    }

    if (!profileRow.ativo) {
      return NextResponse.redirect(
        getProfileIssuePath("profile-inativo", request),
      );
    }

    if (!role) {
      return NextResponse.redirect(
        getProfileIssuePath("profile-invalido", request),
      );
    }

    return response;
  }

  if (!hasActiveProfile || !role) {
    if (isProtectedPath(pathname)) {
      if (!profileRow) {
        return NextResponse.redirect(
          getProfileIssuePath("profile-ausente", request),
        );
      }

      if (!profileRow.ativo) {
        return NextResponse.redirect(
          getProfileIssuePath("profile-inativo", request),
        );
      }

      return NextResponse.redirect(getProfileIssuePath("profile-invalido", request));
    }

    return response;
  }

  const allowedRoles = getAllowedRolesForPath(pathname);

  if (allowedRoles && !hasRoleAccess(role, allowedRoles)) {
    return NextResponse.redirect(new URL(getHomePathByRole(role), request.url));
  }

  return response;
}
