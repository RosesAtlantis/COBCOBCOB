import { notFound } from "next/navigation";

import { AcordoForm } from "@/components/acordos/acordo-form";
import { AcordosTable } from "@/components/acordos/acordos-table";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/lib/format";
import {
  formatDocument,
  getAgreementStatusLabel,
  getAgreementStatusVariant,
  getClientStatusLabel,
  getClientStatusVariant,
  getPrimaryWalletLabel,
} from "@/lib/clientes-utils";
import { getClienteDetailPageData } from "@/services/clientes-service";

interface ClienteDetailPageProps {
  params: Promise<{ id: string }>;
}

function SummaryCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
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

export default async function ClienteDetailPage({
  params,
}: ClienteDetailPageProps) {
  const { id } = await params;
  const data = await getClienteDetailPageData(id);

  if (!data) {
    notFound();
  }

  const primaryContract = data.contracts[0] ?? null;
  const primaryWallet =
    primaryContract?.carteira ??
    getPrimaryWalletLabel(undefined, data.walletLinks[0]?.credor ?? null);
  const primaryCreditor = primaryContract?.credor ?? data.walletLinks[0]?.credor ?? "-";
  const teamName = primaryContract?.equipe ?? "-";
  const operatorName = primaryContract?.operador ?? "-";

  return (
    <div className="space-y-6">
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getClientStatusVariant(data.client.status)}>
                {getClientStatusLabel(data.client.status)}
              </Badge>
              {data.demoMode ? <Badge variant="outline">Demo</Badge> : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{data.client.nome}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDocument(data.client.cpf_cnpj)}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Carteira principal: {primaryWallet}</span>
              <span>Credor: {primaryCreditor}</span>
              <span>Operador: {operatorName}</span>
            </div>
          </div>

          <AcordoForm
            client={data.client}
            contracts={data.contracts}
            operators={data.operators}
            teams={data.teams}
            wallets={data.wallets}
            canCreate={data.canCreateAgreement}
          />
        </div>
      </section>

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Valor em aberto"
          value={formatCurrency(data.summary.valorEmAberto)}
        />
        <SummaryCard
          label="Valor em acordo"
          value={formatCurrency(data.summary.valorEmAcordo)}
        />
        <SummaryCard
          label="Valor pago"
          value={formatCurrency(data.summary.valorPago)}
        />
        <SummaryCard
          label="Contratos"
          value={formatNumber(data.summary.quantidadeContratos)}
        />
        <SummaryCard
          label="Acordos ativos"
          value={formatNumber(data.summary.acordosAtivos)}
        />
        <SummaryCard
          label="Ultimo pagamento"
          value={data.summary.ultimoPagamento ? formatDate(data.summary.ultimoPagamento) : "-"}
        />
      </section>

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="acordos">Acordos</TabsTrigger>
          <TabsTrigger value="baixas">Pagamentos/Baixas</TabsTrigger>
          <TabsTrigger value="acionamentos">Acionamentos</TabsTrigger>
          <TabsTrigger value="cadastro">Dados cadastrais</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card className="dashboard-surface">
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-sm font-semibold">Panorama do cliente</p>
                  <p className="text-sm text-muted-foreground">
                    Leitura rapida da ficha, com foco em carteira, credor e filas ativas.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                    Carteira principal: <span className="font-medium">{primaryWallet}</span>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                    Credor: <span className="font-medium">{primaryCreditor}</span>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                    Equipe: <span className="font-medium">{teamName}</span>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                    Operador: <span className="font-medium">{operatorName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-surface">
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-sm font-semibold">Acordos em destaque</p>
                  <p className="text-sm text-muted-foreground">
                    Ultimas negociacoes registradas para orientar a proxima acao.
                  </p>
                </div>
                <div className="space-y-3">
                  {data.agreements.slice(0, 3).map((agreement) => (
                    <div
                      key={agreement.id}
                      className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">{agreement.contratoNumero}</p>
                          <p className="text-sm text-muted-foreground">
                            {agreement.carteira} • {agreement.operador}
                          </p>
                        </div>
                        <Badge variant={getAgreementStatusVariant(agreement.status)}>
                          {getAgreementStatusLabel(agreement.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <p className="text-muted-foreground">Negociado</p>
                          <p className="font-mono">{formatCurrency(agreement.valor_acordo)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pago</p>
                          <p className="font-mono">{formatCurrency(agreement.valor_pago)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Restante</p>
                          <p className="font-mono">{formatCurrency(agreement.valorRestante)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contratos" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Contratos vinculados</h2>
            <p className="text-sm text-muted-foreground">
              Base contratual que sustenta a cobranca e os acordos deste cliente.
            </p>
          </div>
          <DataTable
            rows={data.contracts}
            columns={[
              { key: "numero_contrato", header: "Contrato" },
              { key: "carteira", header: "Carteira" },
              { key: "credor", header: "Credor" },
              {
                key: "valor_original",
                header: "Valor original",
                align: "right",
                render: (row) => formatCurrency(row.valor_original),
              },
              {
                key: "valor_em_aberto",
                header: "Em aberto",
                align: "right",
                render: (row) => formatCurrency(row.valor_em_aberto),
              },
              {
                key: "acordosAtivos",
                header: "Acordos ativos",
                align: "right",
                render: (row) => formatNumber(row.acordosAtivos),
              },
              {
                key: "valorPago",
                header: "Pago",
                align: "right",
                render: (row) => formatCurrency(row.valorPago),
              },
              { key: "status", header: "Status" },
            ]}
          />
        </TabsContent>

        <TabsContent value="acordos" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Acordos</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie parcelas, registre baixas e acompanhe o status da negociacao.
            </p>
          </div>
          <AcordosTable
            clientId={data.client.id}
            agreements={data.agreements}
            canCancel={data.canCancelAgreement}
            canRegisterWriteOff={data.canRegisterWriteOff}
          />
        </TabsContent>

        <TabsContent value="baixas" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Pagamentos e baixas</h2>
            <p className="text-sm text-muted-foreground">
              Historico financeiro do cliente, incluindo baixas manuais e registros reaproveitados da tabela de pagamentos.
            </p>
          </div>
          <DataTable
            rows={data.payments}
            columns={[
              { key: "contrato", header: "Contrato" },
              {
                key: "numeroParcela",
                header: "Parcela",
                align: "center",
                render: (row) =>
                  row.numeroParcela > 0 ? formatNumber(row.numeroParcela) : "-",
              },
              {
                key: "dataPagamento",
                header: "Pagamento",
                render: (row) => formatDate(row.dataPagamento),
              },
              {
                key: "valorPago",
                header: "Valor pago",
                align: "right",
                render: (row) => formatCurrency(row.valorPago),
              },
              { key: "formaPagamento", header: "Forma" },
              { key: "registradoPor", header: "Registrado por" },
            ]}
          />
        </TabsContent>

        <TabsContent value="acionamentos" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Acionamentos</h2>
            <p className="text-sm text-muted-foreground">
              Registro de contatos e tratativas recuperadas da operacao atual.
            </p>
          </div>
          <DataTable
            rows={data.actions}
            columns={[
              {
                key: "data_acionamento",
                header: "Data",
                render: (row) => formatDate(row.data_acionamento),
              },
              { key: "evento", header: "Evento" },
              { key: "canal", header: "Canal" },
              { key: "operador", header: "Operador" },
              { key: "equipe", header: "Equipe" },
              { key: "descricao", header: "Descricao" },
            ]}
          />
        </TabsContent>

        <TabsContent value="cadastro" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Dados cadastrais</h2>
            <p className="text-sm text-muted-foreground">
              Endereco, contato e vinculos operacionais do cliente.
            </p>
          </div>
          <ClienteForm
            client={data.client}
            walletLinks={data.walletLinks}
            operatorName={operatorName}
            teamName={teamName}
            primaryWallet={primaryWallet}
            primaryCreditor={primaryCreditor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
