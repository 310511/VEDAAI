"use client";

import { IconMinus, IconPlus } from "@/components/icons";

interface StepperProps {
  value: number;
  min?: number;
  onChange: (value: number) => void;
  label: string;
}

export function Stepper({ value, min = 1, onChange, label }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 active:bg-gray-50"
          aria-label={`Decrease ${label}`}
        >
          <IconMinus />
        </button>
        <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 active:bg-gray-50"
          aria-label={`Increase ${label}`}
        >
          <IconPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
