import { Card, CardContent } from "@/components/ui/card";

interface SummaryItem {
  label: string;
  value: number | string;
}

interface CadastroSummaryGridProps {
  items: SummaryItem[];
}

export function CadastroSummaryGrid({ items }: CadastroSummaryGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="dashboard-surface">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
