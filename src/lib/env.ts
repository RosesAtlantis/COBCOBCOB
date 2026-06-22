const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publicSupabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const DEMO_ROLE_COOKIE = "portal_bko_demo_role";

export function isSupabaseConfigured() {
  return Boolean(
    publicSupabaseUrl &&
      (publicSupabaseAnonKey || publicSupabasePublishableKey),
  );
}

export function hasServiceRoleKey() {
  return Boolean(supabaseServiceRoleKey);
}

export function hasSupabaseAnonKey() {
  return Boolean(publicSupabaseAnonKey);
}

export function hasSupabasePublishableKey() {
  return Boolean(publicSupabasePublishableKey);
}

export function getSupabasePublicEnv() {
  const resolvedPublicKey =
    publicSupabaseAnonKey || publicSupabasePublishableKey;

  if (!isSupabaseConfigured() || !publicSupabaseUrl || !resolvedPublicKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return {
    url: publicSupabaseUrl,
    anonKey: resolvedPublicKey,
    publishableKey: publicSupabasePublishableKey ?? null,
  };
}

export function getSupabaseServiceRoleKey() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return supabaseServiceRoleKey;
}

export function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Portal BKO";
}
