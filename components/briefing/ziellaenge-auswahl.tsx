"use client";

import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { BriefingInput, Ziellaenge } from "@/lib/schema";

const STUFEN: { wert: Ziellaenge; label: string }[] = [
  { wert: "kurz", label: "kurz" },
  { wert: "standard", label: "standard" },
  { wert: "lang", label: "lang" },
];

export function ZiellaengeAuswahl() {
  const { control } = useFormContext<BriefingInput>();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Ziellänge</span>
      <Controller
        control={control}
        name="ziellaenge"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label="Ziellänge"
            className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1"
          >
            {STUFEN.map((stufe) => {
              const aktiv = field.value === stufe.wert;
              return (
                <button
                  key={stufe.wert}
                  type="button"
                  role="radio"
                  aria-checked={aktiv}
                  onClick={() => field.onChange(stufe.wert)}
                  onBlur={field.onBlur}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    aktiv
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {stufe.label}
                </button>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
