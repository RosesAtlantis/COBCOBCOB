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

interface OperatorFilterProps {
  value?: string;
  options: FilterOption[];
  onChange: (value?: string) => void;
}

export function OperatorFilter({
  value,
  options,
  onChange,
}: OperatorFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        Operador
      </Label>
      <Select
        value={value ?? "all"}
        onValueChange={(next) => onChange(!next || next === "all" ? undefined : next)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
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
