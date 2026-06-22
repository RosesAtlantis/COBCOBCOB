import { Card, CardContent } from "@/components/ui/card";

interface CentralSummaryCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export function CentralSummaryCard({
  label,
  value,
  subtitle,
}: CentralSummaryCardProps) {
  return (
    <Card className="dashboard-surface">
      <CardContent className="space-y-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}
