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
    <div className="dashboard-stat">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold tracking-tight sm:text-xl">
        {value}
      </p>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
