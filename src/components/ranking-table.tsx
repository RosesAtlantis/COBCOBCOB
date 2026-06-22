import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import type { OperatorRankingRow } from "@/types/portal";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";

interface RankingTableProps {
  rows: OperatorRankingRow[];
}

export function RankingTable({ rows }: RankingTableProps) {
  return (
    <DataTable
      rows={rows}
      columns={[
        {
          key: "position",
          header: "Pos.",
          render: (row) => (
            <Badge
              variant={row.position <= 3 ? "default" : "outline"}
              className="rounded-md px-2 py-0.5 text-[11px]"
            >
              #{row.position}
            </Badge>
          ),
        },
        { key: "operator", header: "Operador" },
        { key: "team", header: "Equipe" },
        { key: "wallet", header: "Carteira" },
        {
          key: "collected",
          header: "Arrecadado",
          align: "right",
          render: (row) => formatCurrency(row.collected),
        },
        {
          key: "agreements",
          header: "Acordos",
          align: "right",
          render: (row) => formatNumber(row.agreements),
        },
        {
          key: "goal",
          header: "Meta",
          align: "right",
          render: (row) => formatCurrency(row.goal),
        },
        {
          key: "goalCompletion",
          header: "% Meta",
          align: "right",
          render: (row) => (
            <span className="font-medium text-primary">
              {formatPercent(row.goalCompletion)}
            </span>
          ),
        },
        {
          key: "averageTicket",
          header: "Ticket medio",
          align: "right",
          render: (row) => formatCurrency(row.averageTicket),
        },
      ]}
    />
  );
}
