import "server-only";

import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { getDemoProfileByRole } from "@/lib/mock-data";
import {
  getHomePathByRole,
  hasRoleAccess,
  isPortalRole,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PortalProfile, PortalRole } from "@/types/portal";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapProfileRow(profile: ProfileRow): PortalProfile | null {
  if (!isPortalRole(profile.perfil)) {
    return null;
  }

  return {
    ...profile,
    perfil: profile.perfil,
  };
}

export function isActiveProfile(
  profile: PortalProfile | null | undefined,
): profile is PortalProfile {
  return Boolean(profile?.ativo);
}

function getAccessDeniedPath(reason: "profile-ausente" | "profile-inativo") {
  return `/acesso-negado?motivo=${reason}`;
}

export const getCurrentSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return session;
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export const getCurrentProfile = cache(async (): Promise<PortalProfile | null> => {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
    return getDemoProfileByRole(demoRole);
  }

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!supabase || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = mapProfileRow(data);

  if (!isActiveProfile(profile)) {
    return null;
  }

  return profile;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireActiveProfile(allowedRoles?: PortalRole[]) {
  const profile = await getCurrentProfile();

  if (!isActiveProfile(profile)) {
    const user = await getCurrentUser();
    redirect(user ? getAccessDeniedPath("profile-inativo") : "/login");
  }

  if (allowedRoles && !hasRoleAccess(profile.perfil, allowedRoles)) {
    redirect(getHomePathByRole(profile.perfil));
  }

  return profile;
}

export async function getHomePathForCurrentUser() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (profile) {
    return getHomePathByRole(profile.perfil);
  }

  return user ? getAccessDeniedPath("profile-ausente") : "/login";
}

export function ensureRole(profile: PortalProfile, allowedRoles: PortalRole[]) {
  if (!hasRoleAccess(profile.perfil, allowedRoles)) {
    redirect(getHomePathByRole(profile.perfil));
  }
}
