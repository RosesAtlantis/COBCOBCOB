import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
  hasServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/env";
import type { Database } from "@/types/database";

let adminClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseAdminClient() {
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return null;
  }

  if (!adminClient) {
    const { url } = getSupabasePublicEnv();
    adminClient = createClient<Database>(url, getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
