import { PortalShell } from "@/components/portal-shell";
import { requireActiveProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireActiveProfile();
  const demoMode = !isSupabaseConfigured();

  return (
    <PortalShell profile={profile} demoMode={demoMode}>
      {children}
    </PortalShell>
  );
}
