"use client";

import { CarteiraFormDialog } from "@/components/carteiras/carteira-form";
import type { FilterOption } from "@/types/portal";

interface QuickCreateCarteiraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditors: FilterOption[];
  canQuickCreateCreditor?: boolean;
  onCreated: (wallet: {
    id: string;
    nome: string;
    codigo?: string | null;
    creditorId?: string | null;
    creditorName?: string | null;
  }) => void;
}

export function QuickCreateCarteiraModal({
  open,
  onOpenChange,
  creditors,
  canQuickCreateCreditor = false,
  onCreated,
}: QuickCreateCarteiraModalProps) {
  return (
    <CarteiraFormDialog
      compact
      open={open}
      onOpenChange={onOpenChange}
      creditors={creditors}
      canQuickCreateCreditor={canQuickCreateCreditor}
      onSaved={onCreated}
    />
  );
}
