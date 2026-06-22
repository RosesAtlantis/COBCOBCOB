import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableValue = string | number | boolean | null | undefined;

export interface DataTableColumn<T extends object> {
  key: keyof T;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends object> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  columns,
  rows,
  emptyMessage = "Nenhum dado encontrado para os filtros atuais.",
}: DataTableProps<T>) {
  return (
    <div className="dashboard-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/70 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    "h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="border-border/60 hover:bg-muted/20">
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={cn(
                        "px-4 py-3.5 text-sm",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : String((row[column.key] as DataTableValue) ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
