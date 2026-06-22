import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatDocument,
  formatPhone,
  getClientStatusLabel,
  getClientStatusVariant,
  getPrimaryWalletLabel,
} from "@/lib/clientes-utils";
import type { Client, ClientWalletLink } from "@/types/portal";

interface ClienteFormProps {
  client: Client;
  walletLinks: ClientWalletLink[];
  operatorName: string;
  teamName: string;
  primaryWallet: string;
  primaryCreditor: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value || "-"}</p>
    </div>
  );
}

export function ClienteForm({
  client,
  walletLinks,
  operatorName,
  teamName,
  primaryWallet,
  primaryCreditor,
}: ClienteFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Dados cadastrais</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Informacoes centrais do cliente e base de contato da ficha.
              </p>
            </div>
            <Badge variant={getClientStatusVariant(client.status)}>
              {getClientStatusLabel(client.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Field label="Nome / Razao social" value={client.nome} />
          <Field label="CPF/CNPJ" value={formatDocument(client.cpf_cnpj)} />
          <Field label="E-mail" value={client.email ?? "-"} />
          <Field label="Telefone" value={formatPhone(client.telefone)} />
          <Field label="Endereco" value={client.endereco ?? "-"} />
          <Field label="Cidade / UF" value={`${client.cidade ?? "-"} • ${client.uf ?? "-"}`} />
          <Field label="CEP" value={client.cep ?? "-"} />
          <Field label="Cadastro" value={new Date(client.criado_em).toLocaleDateString("pt-BR")} />
        </CardContent>
      </Card>

      <Card className="dashboard-surface">
        <CardHeader className="border-b border-border/70 pb-5">
          <CardTitle>Vinculos operacionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Field label="Carteira principal" value={primaryWallet} />
          <Field label="Credor" value={primaryCreditor} />
          <Field label="Equipe" value={teamName} />
          <Field label="Operador responsavel" value={operatorName} />

          <Separator className="bg-border/70" />

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Carteiras vinculadas
            </p>
            <div className="space-y-2">
              {walletLinks.length ? (
                walletLinks.map((walletLink) => (
                  <div
                    key={walletLink.id}
                    className="rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-sm"
                  >
                    {getPrimaryWalletLabel(primaryWallet, walletLink.credor)}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                  Nenhuma carteira vinculada na ficha.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
