"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterOption } from "@/types/portal";

interface WalletFilterProps {
  value?: string;
  options: FilterOption[];
  label?: string;
  onChange: (value?: string) => void;
}

export function WalletFilter({
  value,
  options,
  label = "Carteira",
  onChange,
}: WalletFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value ?? "all"}
        onValueChange={(next) => onChange(!next || next === "all" ? undefined : next)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
