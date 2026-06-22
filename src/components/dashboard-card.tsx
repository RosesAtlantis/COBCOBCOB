import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info";
}

const accentStyles = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-400",
};

export function DashboardCard({
  title,
  value,
  subtitle,
  delta,
  icon: Icon,
  accent = "primary",
}: DashboardCardProps) {
  return (
    <Card className="dashboard-surface">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1.5">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </CardTitle>
          <p className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{value}</p>
        </div>
        <div className={cn("rounded-lg border p-2", accentStyles[accent])}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {subtitle ? <p className="text-sm leading-5 text-muted-foreground">{subtitle}</p> : null}
        {delta ? (
          <p className="inline-flex rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {delta}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
