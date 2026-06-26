"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { getNavigationByRole } from "@/lib/navigation";
import { roleLabels } from "@/lib/permissions";
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
      <div className="shrink-0 border-b border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground/80">
            <PanelLeft className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/52">
              Portal BKO
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <nav className="space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/42">
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
                        "group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-colors",
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
                      {isActive ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sidebar-primary" />
                      ) : (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-transparent transition-colors group-hover:bg-sidebar-border" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-sidebar-border px-5 py-4">
        <div className="space-y-1.5">
          <p className="truncate text-sm font-medium">{profile.nome}</p>
          <p className="truncate text-xs text-sidebar-foreground/62">{profile.email}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/48">
            {roleLabels[profile.perfil]}
          </p>
        </div>
      </div>
    </div>
  );
}
