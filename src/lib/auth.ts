import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { getDemoProfileByRole } from "@/lib/mock-data";
import { getHomePathByRole, hasRoleAccess } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PortalProfile, PortalRole } from "@/types/portal";

function mapProfile(
  profile: Database["public"]["Tables"]["profiles"]["Row"],
): PortalProfile {
  return {
    ...profile,
    perfil: profile.perfil as PortalRole,
  };
}

export const getCurrentProfile = cache(async (): Promise<PortalProfile | null> => {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
    return getDemoProfileByRole(demoRole);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = data as Database["public"]["Tables"]["profiles"]["Row"] | null;

  if (!profile || !profile.ativo) {
    return null;
  }

  return mapProfile(profile);
});

export async function requireActiveProfile() {
  const profile = await getCurrentProfile();

  if (!profile?.ativo) {
    redirect("/login");
  }

  return profile;
}

export async function getHomePathForCurrentUser() {
  const profile = await getCurrentProfile();
  return profile ? getHomePathByRole(profile.perfil) : "/login";
}

export function ensureRole(profile: PortalProfile, allowedRoles: PortalRole[]) {
  if (!hasRoleAccess(profile.perfil, allowedRoles)) {
    redirect(getHomePathByRole(profile.perfil));
  }
}
