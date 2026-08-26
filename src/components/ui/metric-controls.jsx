"use client";

import { useState } from "react";
import { BarChart3, Check, ChevronDown, LineChart } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ViewToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange("curve")}
        aria-label="Vista de línea"
        aria-pressed={value === "curve"}
        className={`flex h-6 w-7 items-center justify-center rounded-md transition-colors ${
          value === "curve" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LineChart className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("bar")}
        aria-label="Vista de barras"
        aria-pressed={value === "bar"}
        className={`flex h-6 w-7 items-center justify-center rounded-md transition-colors ${
          value === "bar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BarChart3 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function PeriodSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex items-center gap-1 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground">
          {value}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => {
              onChange(option);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] text-foreground hover:bg-muted"
          >
            {option.label}
            {option.label === value && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
