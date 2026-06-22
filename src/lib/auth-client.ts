"use client";

import type { Session, User } from "@supabase/supabase-js";

import { getHomePathByRole, isPortalRole } from "@/lib/permissions";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { PortalProfile } from "@/types/portal";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function mapProfileRow(profile: ProfileRow): PortalProfile | null {
  if (!isPortalRole(profile.perfil)) {
    return null;
  }

  return {
    ...profile,
    perfil: profile.perfil,
  };
}

function isActiveProfile(
  profile: PortalProfile | null | undefined,
): profile is PortalProfile {
  return Boolean(profile?.ativo);
}

export async function getCurrentBrowserSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();

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
}

export async function getCurrentBrowserUser(): Promise<User | null> {
  const supabase = getSupabaseClient();

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
}

export async function getCurrentBrowserProfile(): Promise<{
  error: string | null;
  profile: PortalProfile | null;
}> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error: "Configure o Supabase para habilitar a autenticacao real.",
      profile: null,
    };
  }

  const user = await getCurrentBrowserUser();

  if (!user) {
    return {
      error: "Sessao nao encontrada. Faca login novamente.",
      profile: null,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: "Nao foi possivel carregar o profile do usuario autenticado.",
      profile: null,
    };
  }

  if (!data) {
    return {
      error: "Seu usuario nao possui profile cadastrado na tabela profiles.",
      profile: null,
    };
  }

  const profile = mapProfileRow(data);

  if (!profile) {
    return {
      error: "O perfil cadastrado possui um papel invalido.",
      profile: null,
    };
  }

  if (!isActiveProfile(profile)) {
    return {
      error: "Seu usuario esta inativo no Portal BKO.",
      profile: null,
    };
  }

  return {
    error: null,
    profile,
  };
}

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error: "Configure o Supabase para habilitar a autenticacao real.",
      redirectTo: null,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
      redirectTo: null,
    };
  }

  const profileResult = await getCurrentBrowserProfile();

  if (!profileResult.profile) {
    await supabase.auth.signOut();

    return {
      error:
        profileResult.error ??
        "Nao foi possivel validar o profile do usuario autenticado.",
      redirectTo: null,
    };
  }

  return {
    error: null,
    redirectTo: getHomePathByRole(profileResult.profile.perfil),
  };
}

export async function signOutCurrentSession() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
