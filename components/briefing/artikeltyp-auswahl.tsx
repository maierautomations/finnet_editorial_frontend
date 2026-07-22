"use client";

import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { Artikeltyp, BriefingInput } from "@/lib/schema";

const TYPEN: { wert: Artikeltyp; titel: string; beschreibung: string }[] = [
  {
    wert: "A",
    titel: "Marktgeschehen",
    beschreibung: "Aktuelle Nachricht oder Kursbewegung, schnell und faktenbasiert eingeordnet.",
  },
  {
    wert: "B",
    titel: "Analyse / Einordnung",
    beschreibung: "Bewertung mit Kontext, Zahlen und Stimmen zu einem konkreten Anlass.",
  },
  {
    wert: "C",
    titel: "Hintergrund",
    beschreibung: "Tiefergehende Story zu Unternehmen, Branche oder Trend.",
  },
];

export function ArtikeltypAuswahl() {
  const {
    control,
    formState: { errors },
  } = useFormContext<BriefingInput>();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Artikeltyp</span>
      <Controller
        control={control}
        name="artikeltyp"
        render={({ field }) => (
          <div role="radiogroup" aria-label="Artikeltyp" className="grid gap-3 sm:grid-cols-3">
            {TYPEN.map((typ) => {
              const aktiv = field.value === typ.wert;
              return (
                <button
                  key={typ.wert}
                  type="button"
                  role="radio"
                  aria-checked={aktiv}
                  onClick={() => field.onChange(typ.wert)}
                  onBlur={field.onBlur}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border bg-card p-4 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    aktiv
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md text-xs font-semibold",
                      aktiv ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {typ.wert}
                  </span>
                  <span className="text-sm font-medium">{typ.titel}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {typ.beschreibung}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.artikeltyp && (
        <p className="text-sm text-destructive">Bitte einen Artikeltyp wählen</p>
      )}
    </div>
  );
}
