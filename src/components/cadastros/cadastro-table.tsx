"use client";

import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CadastroColumn<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
}

interface CadastroTableProps<T> {
  rows: T[];
  columns: CadastroColumn<T>[];
  emptyTitle: string;
  emptyDescription: string;
}

const defaultHeaderClassName =
  "h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

export function CadastroTable<T>({
  rows,
  columns,
  emptyTitle,
  emptyDescription,
}: CadastroTableProps<T>) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="dashboard-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/70 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.headerClassName ?? defaultHeaderClassName}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index}
                className="border-border/60 hover:bg-muted/15"
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className ?? "px-4 py-3.5"}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
