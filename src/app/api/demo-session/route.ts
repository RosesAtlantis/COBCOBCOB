import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DEMO_ROLE_COOKIE } from "@/lib/env";
import type { PortalRole } from "@/types/portal";

const allowedRoles = new Set<PortalRole>([
  "admin",
  "gerente",
  "supervisor",
  "operador",
  "financeiro",
]);

export async function POST(request: Request) {
  const body = (await request.json()) as { role?: PortalRole };
  const role = body.role && allowedRoles.has(body.role) ? body.role : "admin";
  const cookieStore = await cookies();

  cookieStore.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
