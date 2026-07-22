"use client";

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { Artikeltyp, BriefingInput } from "@/lib/schema";

// Presets befuellen nur artikeltyp und schwerpunkt, dahinter liegt kein eigener Workflow.
const PRESETS: { label: string; artikeltyp: Artikeltyp; schwerpunkt?: string }[] = [
  {
    label: "Analysten-Update",
    artikeltyp: "A",
    schwerpunkt: "Neue Analystenstimmen und Kursziele einordnen",
  },
  {
    label: "Kursbewegung einordnen",
    artikeltyp: "A",
    schwerpunkt: "Auffällige Kursbewegung, Ursachen und Einordnung",
  },
  {
    label: "Deal / Übernahme einordnen",
    artikeltyp: "B",
    schwerpunkt: "Partnerschaft, Übernahme oder Großauftrag und die Folgen für den Wert",
  },
  {
    label: "Hintergrund",
    artikeltyp: "C",
    // Schwerpunkt bleibt bewusst frei
  },
];

export function PresetChips() {
  const { setValue } = useFormContext<BriefingInput>();

  const anwenden = (preset: (typeof PRESETS)[number]) => {
    setValue("artikeltyp", preset.artikeltyp, { shouldValidate: true, shouldDirty: true });
    if (preset.schwerpunkt !== undefined) {
      setValue("schwerpunkt", preset.schwerpunkt, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Presets:</span>
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => anwenden(preset)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
