import type { AgreementCenterRow, ClientAgreementRow } from "@/types/portal";

export function toAgreementCenterRow(
  row: ClientAgreementRow,
  clientName?: string,
): AgreementCenterRow {
  return {
    id: row.id,
    clientId: row.cliente_id,
    walletId: row.carteira_id,
    operatorId: row.operador_id,
    teamId: row.equipe_id,
    cliente: clientName ?? "Cliente vinculado",
    cpfCnpj: row.cpf_cnpj ?? "",
    contrato: row.contratoNumero,
    carteira: row.carteira,
    credor: row.credor,
    operador: row.operador,
    equipe: row.equipe,
    dataAcordo: row.data_acordo,
    valorOriginal: row.valor_original,
    valorAcordo: row.valor_acordo,
    valorPago: row.valor_pago,
    saldo: row.valorRestante,
    percentualHonorarios: row.percentual_honorarios ?? null,
    valorHonorariosPrevisto: row.valor_honorarios_previsto ?? null,
    valorEscritorioPrevisto: row.valor_escritorio_previsto ?? null,
    parcelas: row.quantidade_parcelas,
    parcelasPagas: row.parcelasPagas,
    parcelasPendentes: row.parcelasPendentes,
    parcelasAtrasadas: row.parcelasAtrasadas,
    status: row.status,
    formaPagamento: row.forma_pagamento,
    observacao: row.observacao,
    ultimoPagamentoEm: row.ultimo_pagamento_em,
    ultimaAtualizacao: row.atualizado_em,
    parcelasDetalhe: row.parcelas,
  };
}

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
    credor_id: null,
    credor: row.credor,
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
