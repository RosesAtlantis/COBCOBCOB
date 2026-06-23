"use client";

import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("portal-bko-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(
      "portal-bko-sidebar-collapsed",
      String(desktopCollapsed),
    );
  }, [desktopCollapsed]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "hidden h-screen shrink-0 border-r border-border/70 bg-sidebar/70 transition-[width] duration-200 lg:block",
          desktopCollapsed ? "w-28" : "w-[296px]",
        )}
      >
        <div className="h-full p-4">
          <AppSidebar
            profile={profile}
            demoMode={demoMode}
            collapsed={desktopCollapsed}
            onToggleCollapse={() => setDesktopCollapsed((current) => !current)}
          />
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
        <main className="flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
