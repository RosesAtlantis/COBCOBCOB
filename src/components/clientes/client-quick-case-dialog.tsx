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

interface WalletCreditorMap {
  walletId: string;
  creditorId: string | null;
  creditorName: string | null;
}

interface ClientQuickCaseDialogProps {
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  walletCreditors: WalletCreditorMap[];
  canManageCreditors?: boolean;
}

export function ClientQuickCaseDialog({
  operators,
  teams,
  wallets,
  creditors,
  walletCreditors,
  canManageCreditors = false,
}: ClientQuickCaseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-lg" />}>
        Novo caso
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo caso</DialogTitle>
          <DialogDescription>
            Abra um caso rapido sem sair da fila de clientes.
          </DialogDescription>
        </DialogHeader>

        <NovoCasoForm
          mode="dialog"
          operators={operators}
          teams={teams}
          wallets={wallets}
          creditors={creditors}
          walletCreditors={walletCreditors}
          canManageCreditors={canManageCreditors}
          onCancelled={() => setOpen(false)}
          onCreated={(result, action) => {
            if (action === "open") {
              setOpen(false);
              router.push(`/clientes/${result.clientId}`);
              router.refresh();
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
