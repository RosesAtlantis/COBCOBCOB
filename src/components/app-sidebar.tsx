"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  PanelLeftClose,
  PanelLeftOpen,
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export function AppSidebar({
  profile,
  demoMode,
  collapsed = false,
  onToggleCollapse,
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm">
      <div className="shrink-0 space-y-6 px-5 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border/90 bg-sidebar-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/70">
              <DatabaseZap className="size-3.5" />
              {!collapsed ? "Portal BKO" : "BKO"}
            </div>
            {!collapsed ? (
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold tracking-tight">Central de Performance</h2>
                <p className="text-sm leading-6 text-sidebar-foreground/62">
                  Indicadores de cobranca, operacao e financeiro em um unico ambiente.
                </p>
              </div>
            ) : null}
          </div>

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent px-3.5 py-3.5">
            <p className="text-sm font-semibold">{profile.nome}</p>
            <p className="mt-1 text-xs text-sidebar-foreground/62">{profile.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="rounded-md bg-sidebar-primary px-2 py-0.5 text-[11px] font-medium text-sidebar-primary-foreground">
                {roleLabels[profile.perfil]}
              </Badge>
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
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/70">
            <DatabaseZap className="size-3.5" />
            {roleLabels[profile.perfil]}
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-8 px-4 py-6">
          {groups.map((group) => (
            <div key={group.title} className="space-y-3">
              {!collapsed ? (
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
                  {group.title}
                </p>
              ) : null}
              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href, item.matchPrefixes);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.title : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group block rounded-xl border transition-colors",
                        collapsed ? "px-2.5 py-3.5" : "px-4 py-4",
                        isActive
                          ? "border-primary/25 bg-primary/10 text-sidebar-foreground"
                          : "border-transparent text-sidebar-foreground/78 hover:border-sidebar-border hover:bg-sidebar-accent/70",
                      )}
                    >
                      <div
                        className={cn(
                          "flex gap-3",
                          collapsed ? "items-center justify-center" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg border p-2",
                            collapsed ? "mx-auto" : "mt-0.5",
                            isActive
                              ? "border-primary/25 bg-primary/12 text-primary"
                              : "border-sidebar-border bg-sidebar-accent text-sidebar-foreground/65",
                          )}
                        >
                          <item.icon className="size-4" />
                        </div>
                        {!collapsed ? (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium leading-5">{item.title}</span>
                              <ChevronRight
                                className={cn(
                                  "size-4 text-sidebar-foreground/28 transition-transform",
                                  isActive ? "translate-x-0.5 text-primary/70" : "group-hover:translate-x-0.5",
                                )}
                              />
                            </div>
                            <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-sidebar-foreground/55">
                              {item.description}
                            </p>
                          </div>
                        ) : null}
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

      <div className="shrink-0 px-5 py-5">
        <div
          className={cn(
            "rounded-xl border border-sidebar-border bg-sidebar-accent text-xs text-sidebar-foreground/68",
            collapsed ? "px-2 py-3 text-center" : "px-3 py-3",
          )}
        >
          <div
            className={cn(
              "text-sidebar-foreground",
              collapsed ? "flex items-center justify-center" : "flex items-center gap-2",
            )}
          >
            {collapsed ? <ChevronLeft className="size-3.5" /> : <Shield className="size-3.5" />}
            {!collapsed ? <p className="font-medium">Seguranca aplicada</p> : null}
          </div>
          {!collapsed ? (
            <p className="mt-1.5 leading-relaxed">
              O acesso respeita perfil, equipe e operador na interface e no banco.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
