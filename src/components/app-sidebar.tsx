"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  DatabaseZap,
  Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  demoMode,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const groups = getNavigationByRole(profile.perfil);

  function isItemActive(href: string, matchPrefixes?: string[]) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }

    return Boolean(matchPrefixes?.some((prefix) => pathname.startsWith(prefix)));
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 space-y-4 border-b border-sidebar-border px-5 py-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/72">
          <DatabaseZap className="size-3.5" />
          Portal BKO
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold tracking-tight">Operacao e cobranca</p>
          <p className="text-sm text-sidebar-foreground/62">
            Navegacao principal do portal.
          </p>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6 px-4 py-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
                {group.title}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href, item.matchPrefixes);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group block rounded-lg border px-3.5 py-3 transition-colors",
                        isActive
                          ? "border-primary/20 bg-primary/9 text-sidebar-foreground"
                          : "border-transparent text-sidebar-foreground/78 hover:border-sidebar-border hover:bg-sidebar-accent",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-md border p-2",
                            isActive
                              ? "border-primary/15 bg-primary/10 text-primary"
                              : "border-sidebar-border bg-background text-sidebar-foreground/65",
                          )}
                        >
                          <item.icon className="size-4" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          <ChevronRight
                            className={cn(
                              "size-4 text-sidebar-foreground/28 transition-transform",
                              isActive
                                ? "translate-x-0.5 text-primary/70"
                                : "group-hover:translate-x-0.5",
                            )}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="shrink-0 space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile.nome}</p>
            <p className="truncate text-xs text-sidebar-foreground/62">{profile.email}</p>
          </div>
          <Badge className="rounded-md bg-sidebar-primary px-2 py-0.5 text-[11px] font-medium text-sidebar-primary-foreground">
            {roleLabels[profile.perfil]}
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-xs text-sidebar-foreground/68">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-sidebar-foreground/72" />
            <span>Seguranca aplicada</span>
          </div>
          {demoMode ? (
            <Badge
              variant="outline"
              className="rounded-md border-sidebar-border bg-transparent px-2 py-0.5 text-[11px] text-sidebar-foreground/78"
            >
              Demo
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
