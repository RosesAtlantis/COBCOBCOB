import type { AgreementCenterRow, ClientAgreementRow } from "@/types/portal";

export function toClientAgreementRow(row: AgreementCenterRow): ClientAgreementRow {
  const entrada =
    row.parcelasDetalhe.find((installment) => installment.tipo === "entrada")
      ?.valor_parcela ?? 0;
  const primeiraParcela = row.parcelasDetalhe.find(
    (installment) => installment.tipo !== "entrada",
  );

  return {
    id: row.id,
    cliente_id: row.clientId,
    contrato_id: null,
    data_acordo: row.dataAcordo,
    operador_id: row.operatorId,
    equipe_id: row.teamId,
    carteira_id: row.walletId,
    cpf_cnpj: row.cpfCnpj,
    contrato: row.contrato,
    valor_original: row.valorOriginal,
    valor_acordo: row.valorAcordo,
    valor_entrada: entrada,
    quantidade_parcelas: row.parcelas,
    valor_parcela: primeiraParcela?.valor_parcela ?? 0,
    valor_pago: row.valorPago,
    percentual_honorarios: row.percentualHonorarios ?? null,
    valor_honorarios_previsto: row.valorHonorariosPrevisto ?? null,
    valor_escritorio_previsto: row.valorEscritorioPrevisto ?? null,
    intervalo_meses: 1,
    origem_manual: true,
    data_vencimento_entrada:
      row.parcelasDetalhe.find((installment) => installment.tipo === "entrada")
        ?.data_vencimento ?? null,
    primeiro_vencimento: primeiraParcela?.data_vencimento ?? null,
    forma_pagamento: row.formaPagamento,
    status: row.status,
    observacao: row.observacao,
    criado_por: null,
    chave_externa: null,
    importacao_id: null,
    ultimo_pagamento_em: row.ultimoPagamentoEm,
    criado_em: `${row.dataAcordo}T00:00:00.000Z`,
    atualizado_em: row.ultimaAtualizacao,
    carteira: row.carteira,
    credor: row.credor,
    equipe: row.equipe,
    operador: row.operador,
    contratoNumero: row.contrato,
    valorRestante: row.saldo,
    parcelasPagas: row.parcelasPagas,
    parcelasPendentes: row.parcelasPendentes,
    parcelasAtrasadas: row.parcelasAtrasadas,
    parcelas: row.parcelasDetalhe,
  };
}
