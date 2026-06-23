export function getAuditActionLabel(action: string) {
  const labels: Record<string, string> = {
    cliente_criado: "Cliente criado",
    cliente_atualizado: "Cliente atualizado",
    cliente_vinculos_atualizados: "Vinculos do cliente atualizados",
    contrato_criado: "Contrato criado",
    contrato_atualizado: "Contrato atualizado",
    acordo_criado: "Acordo criado",
    acordo_cancelado: "Acordo cancelado",
    acordo_status_alterado: "Status do acordo alterado",
    baixa_registrada: "Baixa registrada",
    baixa_estornada: "Baixa estornada",
    importacao_processada: "Importacao processada",
    importacao_revertida: "Importacao revertida",
  };

  return labels[action] ?? action;
}

export function getWriteOffStatusLabel(estornada: boolean) {
  return estornada ? "Estornada" : "Ativa";
}

export function getWriteOffStatusVariant(estornada: boolean) {
  return estornada ? "destructive" : "success";
}
