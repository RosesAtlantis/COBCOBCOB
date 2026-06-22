"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

let browserClient:
  | ReturnType<typeof createBrowserClient<Database>>
  | null
  | undefined;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv();
    browserClient = createBrowserClient<Database>(url, anonKey);
  }

  return browserClient;
}
