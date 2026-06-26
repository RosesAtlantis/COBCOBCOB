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
    <div className="flex min-h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden h-screen w-[272px] shrink-0 border-r border-border/70 bg-sidebar xl:w-[280px] lg:block">
        <AppSidebar profile={profile} demoMode={demoMode} />
      </aside>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[300px] overflow-hidden border-r border-border/70 bg-sidebar p-0"
        >
          <AppSidebar
            profile={profile}
            demoMode={demoMode}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <Topbar
          demoMode={demoMode}
          profile={profile}
          onOpenSidebar={() => setMobileMenuOpen(true)}
        />
        <main className="min-w-0 flex-1 px-3 pb-6 pt-4 sm:px-5 sm:pb-8 lg:px-6 xl:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}
