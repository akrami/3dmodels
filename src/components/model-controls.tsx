import React from "react";
import { Slider } from "@/components/ui/slider";

export interface ModelControlsProps<T extends Record<string, number>> {
  values: T;
  onChange: (key: keyof T, value: number) => void;
  ranges?: Partial<Record<keyof T, { min: number; max: number; step?: number }>>;
}

export function ModelControls<T extends Record<string, number>>({
  values,
  onChange,
  ranges = {},
}: ModelControlsProps<T>) {
  return (
    <>
      {Object.entries(values as Record<string, number>).map(([k, value]) => {
        const key = k as keyof T;
        const range = (ranges as any)[k] as
          | { min: number; max: number; step?: number }
          | undefined;
        const step = range?.step ?? 1;
        const min = range?.min;
        const max = range?.max;
        return (
          <label key={key as React.Key} className="flex flex-col gap-1 mb-4 text-sm">
            <span className="capitalize mb-1 flex justify-between">
              {String(key)}
              <span>{value}</span>
            </span>
            {range ? (
              <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(v) =>
                  onChange(key as keyof T, parseFloat(v[0].toString()))
                }
              />
            ) : (
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) =>
                  onChange(key as keyof T, parseFloat(e.target.value))
                }
                className="border rounded p-1 bg-white text-black"
              />
            )}
          </label>
        );
      })}
    </>
  );
}
