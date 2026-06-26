"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { NovoCasoForm } from "@/components/clientes/novo-caso-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FilterOption } from "@/types/portal";

interface ClientQuickCaseDialogProps {
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  canManageWallets?: boolean;
  triggerLabel?: string;
}

export function ClientQuickCaseDialog({
  operators,
  teams,
  wallets,
  canManageWallets = false,
  triggerLabel = "Novo cliente",
}: ClientQuickCaseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-lg" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl overflow-x-hidden sm:w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Cadastre um cliente rapido sem sair da fila de pesquisa.
          </DialogDescription>
        </DialogHeader>

        <NovoCasoForm
          mode="dialog"
          operators={operators}
          teams={teams}
          wallets={wallets}
          canManageWallets={canManageWallets}
          onCancelled={() => setOpen(false)}
          onCreated={(result, action) => {
            if (action === "open") {
              setOpen(false);
              router.push(`/clientes/${result.clientId}`);
              return;
            }

            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
