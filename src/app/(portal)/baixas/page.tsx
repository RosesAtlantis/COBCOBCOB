import { BaixasFilters } from "@/components/financeiro/baixas-filters";
import { BaixasTable } from "@/components/financeiro/baixas-table";
import { CentralSummaryCard } from "@/components/financeiro/central-summary-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { parseWriteOffCenterFilters } from "@/lib/financeiro-filters";
import { getBaixasPageData } from "@/services/baixas-service";

interface BaixasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BaixasPage({ searchParams }: BaixasPageProps) {
  const filters = parseWriteOffCenterFilters(await searchParams);
  const data = await getBaixasPageData(filters);

  return (
    <div className="space-y-6">
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Financeiro
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Central de baixas</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Recebimentos do acordo, usuario responsavel, forma de pagamento,
              estornos e rastreabilidade financeira em uma unica visao.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md px-3 py-1">
              {data.writeOffs.length} baixa(s) visivel(is)
            </Badge>
            {data.demoMode ? (
              <Badge variant="outline" className="rounded-md px-3 py-1">
                Demo
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <CentralSummaryCard
          label="Recebido no periodo"
          value={formatCurrency(data.summary.recebidoNoPeriodo)}
        />
        <CentralSummaryCard
          label="Quantidade de baixas"
          value={formatNumber(data.summary.quantidadeBaixas)}
        />
        <CentralSummaryCard
          label="Ticket medio"
          value={formatCurrency(data.summary.ticketMedio)}
        />
        <CentralSummaryCard
          label="Baixas estornadas"
          value={formatNumber(data.summary.baixasEstornadas)}
        />
        <CentralSummaryCard
          label="Honorarios escritorio"
          value={formatCurrency(data.summary.honorariosEscritorio ?? 0)}
        />
        <CentralSummaryCard
          label="Valor repassado"
          value={formatCurrency(data.summary.valorRepassado ?? 0)}
        />
        <CentralSummaryCard
          label="Maior carteira"
          value={data.summary.maiorCarteira}
        />
        <CentralSummaryCard
          label="Maior operador"
          value={data.summary.maiorOperador}
        />
      </section>

      <BaixasFilters
        key={JSON.stringify(data.filters)}
        filters={data.filters}
        options={data.options}
      />
      <BaixasTable rows={data.writeOffs} canReverseWriteOff={data.canReverseWriteOff} />
    </div>
  );
}
