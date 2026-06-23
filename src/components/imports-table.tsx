"use client";

import { useState } from "react";

import { ImportReversalDialog } from "@/components/import-reversal-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import type { ImportRecord } from "@/types/portal";

interface ImportsTableProps {
  rows: ImportRecord[];
}

export function ImportsTable({ rows }: ImportsTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<ImportRecord | null>(null);

  return (
    <>
      <div className="dashboard-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tipo
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Arquivo
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Linhas
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Importadas
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Erros
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Reversao
                </TableHead>
                <TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Data
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Acoes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="border-border/60 hover:bg-muted/15">
                  <TableCell className="px-4 py-3.5 text-sm">{row.tipo}</TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">{row.nome_arquivo}</TableCell>
                  <TableCell className="px-4 py-3.5 text-right text-sm">
                    {formatNumber(row.total_linhas)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right text-sm">
                    {formatNumber(row.linhas_importadas)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right text-sm">
                    {formatNumber(row.linhas_erro)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">{row.status}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="space-y-1">
                      <Badge variant={row.revertida ? "destructive" : "secondary"}>
                        {row.revertida ? "Revertida" : "Ativa"}
                      </Badge>
                      {row.revertida_em ? (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(row.revertida_em)}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm">
                    {formatDate(row.criado_em)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={row.revertida}
                      onClick={() => setSelectedRecord(row)}
                    >
                      Reverter importacao
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ImportReversalDialog
        record={selectedRecord}
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRecord(null);
          }
        }}
      />
    </>
  );
}
