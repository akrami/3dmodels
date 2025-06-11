import React from "react";

export interface ModelControlsProps<T extends Record<string, number>> {
  values: T;
  onChange: (key: keyof T, value: number) => void;
  steps?: Partial<Record<keyof T, number>>;
}

export function ModelControls<T extends Record<string, number>>({
  values,
  onChange,
  steps = {},
}: ModelControlsProps<T>) {
  return (
    <>
      {Object.entries(values).map(([key, value]) => (
        <label key={key} className="flex flex-col gap-1 mb-2 text-sm">
          <span className="capitalize">{key}</span>
          <input
            type="number"
            step={steps[key as keyof T] ?? 1}
            value={value}
            onChange={(e) => onChange(key as keyof T, parseFloat(e.target.value))}
            className="border rounded p-1 bg-white text-black"
          />
        </label>
      ))}
    </>
  );
}
