interface SummaryItem {
  label: string;
  value: number | string;
}

interface CadastroSummaryGridProps {
  items: SummaryItem[];
}

export function CadastroSummaryGrid({ items }: CadastroSummaryGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="dashboard-stat">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
