"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, DatabaseZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  const items = getNavigationByRole(profile.perfil);

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-sidebar-border/80 bg-sidebar/95 px-4 py-5 text-sidebar-foreground shadow-[0_22px_60px_-28px_rgba(0,0,0,0.9)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/70">
            <DatabaseZap className="size-3.5" />
            Portal BKO
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              Central de Performance
            </h2>
            <p className="text-sm text-sidebar-foreground/68">
              Indicadores financeiros, operacionais e de cobranca em tempo real.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/75 p-3">
          <p className="text-sm font-medium">{profile.nome}</p>
          <p className="mt-1 text-xs text-sidebar-foreground/65">{profile.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-sidebar-primary text-sidebar-primary-foreground">
              {roleLabels[profile.perfil]}
            </Badge>
            {demoMode ? (
              <Badge variant="outline" className="border-primary/35 text-primary">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <Separator className="my-4 bg-sidebar-border" />

      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group rounded-2xl border px-3 py-3 transition-colors",
                isActive
                  ? "border-primary/35 bg-primary/10 text-sidebar-foreground"
                  : "border-transparent bg-transparent text-sidebar-foreground/78 hover:border-sidebar-border hover:bg-sidebar-accent/60",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-xl border p-2",
                    isActive
                      ? "border-primary/35 bg-primary/15 text-primary"
                      : "border-sidebar-border bg-sidebar-accent/70 text-sidebar-foreground/70",
                  )}
                >
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{item.title}</span>
                    <ChevronRight className="size-4 text-sidebar-foreground/35 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-xs text-sidebar-foreground/58">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/65 p-3 text-xs text-sidebar-foreground/68">
        <p className="font-medium text-sidebar-foreground">Seguranca aplicada</p>
        <p className="mt-1 leading-relaxed">
          O acesso aos dados respeita perfil, equipe e operador no banco e na interface.
        </p>
      </div>
    </div>
  );
}
