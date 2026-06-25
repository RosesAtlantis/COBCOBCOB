"use client";

import { CreditorFormDialog } from "@/components/credores/creditor-form-dialog";

interface QuickCreateCredorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (creditor: { id: string; nome: string; codigo?: string | null }) => void;
}

export function QuickCreateCredorModal({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateCredorModalProps) {
  return (
    <CreditorFormDialog
      compact
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onCreated}
    />
  );
}
