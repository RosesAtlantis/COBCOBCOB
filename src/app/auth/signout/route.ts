import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DEMO_ROLE_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_ROLE_COOKIE);

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
