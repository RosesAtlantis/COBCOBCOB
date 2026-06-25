"use client";

import { CarteiraFormDialog } from "@/components/carteiras/carteira-form";

interface QuickCreateCarteiraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (wallet: {
    id: string;
    nome: string;
    codigo?: string | null;
    descricao?: string | null;
  }) => void;
}

export function QuickCreateCarteiraModal({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateCarteiraModalProps) {
  return (
    <CarteiraFormDialog
      compact
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onCreated}
    />
  );
}
