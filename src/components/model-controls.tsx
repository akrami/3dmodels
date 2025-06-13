import React from "react";

export interface ModelControlsProps<T extends Record<string, number>> {
  values: T;
  onChange: (key: keyof T, value: number) => void;
  steps?: Partial<Record<keyof T, number>>;
  ranges?: Partial<Record<keyof T, { min: number; max: number; step?: number }>>;
}

export function ModelControls<T extends Record<string, number>>({
  values,
  onChange,
  steps = {},
  ranges = {},
}: ModelControlsProps<T>) {
  return (
    <>
      {Object.entries(values).map(([key, value]) => {
        const range = ranges[key as keyof T];
        const step = range?.step ?? steps[key as keyof T] ?? 1;
        const inputType = range ? "range" : "number";
        return (
          <label key={key} className="flex flex-col gap-1 mb-2 text-sm">
            <span className="capitalize flex justify-between">
              {key}
              <span>{value}</span>
            </span>
            <input
              type={inputType}
              min={range?.min}
              max={range?.max}
              step={step}
              value={value}
              onChange={(e) =>
                onChange(key as keyof T, parseFloat(e.target.value))
              }
              className="border rounded p-1 bg-white text-black"
            />
          </label>
        );
      })}
    </>
  );
}
