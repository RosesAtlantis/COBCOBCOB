"use client";

import { CalendarRange } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMonthOptions } from "@/lib/portal-filters";

interface DateFilterProps {
  month: number;
  year: number;
  years: number[];
  startDate?: string;
  endDate?: string;
  showRangeInputs?: boolean;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function DateFilter({
  month,
  year,
  years,
  startDate,
  endDate,
  showRangeInputs = true,
  onMonthChange,
  onYearChange,
  onStartDateChange,
  onEndDateChange,
}: DateFilterProps) {
  const monthOptions = getMonthOptions();
  const controlClassName = "h-10 rounded-lg border-border/70 bg-background shadow-none";

  return (
    <>
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Mes
        </Label>
        <Select value={String(month)} onValueChange={(value) => onMonthChange(Number(value))}>
          <SelectTrigger className={controlClassName}>
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ano
        </Label>
        <Select value={String(year)} onValueChange={(value) => onYearChange(Number(value))}>
          <SelectTrigger className={controlClassName}>
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showRangeInputs ? (
        <>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Inicio
            </Label>
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="date"
                className={`${controlClassName} pl-9`}
                value={startDate ?? ""}
                onChange={(event) => onStartDateChange(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Fim
            </Label>
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="date"
                className={`${controlClassName} pl-9`}
                value={endDate ?? ""}
                onChange={(event) => onEndDateChange(event.target.value)}
              />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
