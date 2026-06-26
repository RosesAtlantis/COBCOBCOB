"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getNavigationByRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { PortalProfile } from "@/types/portal";

interface AppSidebarProps {
  profile: PortalProfile;
  demoMode: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({
  profile,
  demoMode: _demoMode,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const groups = getNavigationByRole(profile.perfil);
  void _demoMode;

  function isItemActive(href: string, matchPrefixes?: string[]) {
    if (href === "/clientes" && pathname.startsWith("/clientes/novo")) {
      return false;
    }

    if (href === "/dashboard") {
      return pathname === href;
    }

    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }

    return Boolean(matchPrefixes?.some((prefix) => pathname.startsWith(prefix)));
  }

  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 border-b border-sidebar-border px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/52">
          Portal BKO
        </p>
        <p className="mt-1 text-sm font-medium text-sidebar-foreground/72">
          Navegacao
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <nav className="space-y-4">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/42">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href, item.matchPrefixes);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground ring-1 ring-sidebar-border"
                          : "text-sidebar-foreground/78 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          isActive
                            ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground"
                            : "border-sidebar-border bg-background text-sidebar-foreground/62 group-hover:border-sidebar-border group-hover:bg-sidebar-accent",
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm font-medium",
                          isActive ? "text-sidebar-foreground" : "text-inherit",
                        )}
                      >
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
