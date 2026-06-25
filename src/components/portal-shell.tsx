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
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden h-screen w-[292px] shrink-0 border-r border-border/70 bg-sidebar/75 lg:block">
        <div className="h-full p-3">
          <AppSidebar profile={profile} demoMode={demoMode} />
        </div>
      </aside>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[92vw] max-w-[360px] overflow-hidden border-r border-border/70 bg-sidebar p-0"
        >
          <div className="h-full p-3">
            <AppSidebar
              profile={profile}
              demoMode={demoMode}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          demoMode={demoMode}
          profile={profile}
          onOpenSidebar={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
