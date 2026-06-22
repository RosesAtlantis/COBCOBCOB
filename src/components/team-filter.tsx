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

interface TeamFilterProps {
  value?: string;
  options: FilterOption[];
  onChange: (value?: string) => void;
}

export function TeamFilter({ value, options, onChange }: TeamFilterProps) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Equipe
      </Label>
      <Select
        value={value ?? "all"}
        onValueChange={(next) => onChange(!next || next === "all" ? undefined : next)}
      >
        <SelectTrigger className="h-10 rounded-lg border-border/70 bg-background shadow-none">
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
