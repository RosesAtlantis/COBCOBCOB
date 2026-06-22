export function getAuditActionLabel(action: string) {
  const labels: Record<string, string> = {
    acordo_criado: "Acordo criado",
    acordo_cancelado: "Acordo cancelado",
    acordo_status_alterado: "Status do acordo alterado",
    baixa_registrada: "Baixa registrada",
    baixa_estornada: "Baixa estornada",
  };

  return labels[action] ?? action;
}

export function getWriteOffStatusLabel(estornada: boolean) {
  return estornada ? "Estornada" : "Ativa";
}

export function getWriteOffStatusVariant(estornada: boolean) {
  return estornada ? "destructive" : "success";
}
