"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { PortalProfile } from "@/types/portal";

interface PortalShellProps {
  profile: PortalProfile;
  demoMode: boolean;
  children: React.ReactNode;
}

export function PortalShell({
  profile,
  demoMode,
  children,
}: PortalShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-0 h-screen p-4">
          <AppSidebar profile={profile} demoMode={demoMode} />
        </div>
      </aside>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 border-border/60 bg-sidebar p-4">
          <AppSidebar
            profile={profile}
            demoMode={demoMode}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          demoMode={demoMode}
          profile={profile}
          onOpenSidebar={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 px-4 pb-6 pt-2 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
