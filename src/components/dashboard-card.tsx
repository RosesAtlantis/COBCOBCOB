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
  primary: "bg-primary/14 text-primary",
  success: "bg-emerald-500/14 text-emerald-300",
  warning: "bg-amber-500/14 text-amber-300",
  info: "bg-sky-500/14 text-sky-300",
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
    <Card className="dashboard-surface border-border/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("rounded-2xl p-2.5", accentStyles[accent])}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {delta ? <p className="text-xs text-primary">{delta}</p> : null}
      </CardContent>
    </Card>
  );
}
