"use client";

import { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import useSWR from "swr";
import { Check, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { feedFetcher } from "@/lib/feed-fetcher";
import { berlinerDatum } from "@/lib/feed-berechnungen";
import { ISIN_REGEX, type BriefingInput } from "@/lib/schema";

export function IsinFeld() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BriefingInput>();

  // Duplikat-Hinweis: gleicher SWR-Key wie die Feed-Ansicht, also kein zusaetzlicher
  // Endpoint und meist ein warmer Cache. Kein eigenes Polling noetig.
  const { data: feedItems } = useSWR("/api/feed", feedFetcher);
  const isinWert = useWatch({ control, name: "hauptIsin" }) ?? "";

  const heutigesDuplikat = useMemo(() => {
    if (!feedItems || !ISIN_REGEX.test(isinWert)) return null;
    const heute = berlinerDatum(new Date());
    return (
      feedItems.find(
        (item) => item.isin === isinWert && berlinerDatum(new Date(item.erstelltAm)) === heute
      ) ?? null
    );
  }, [feedItems, isinWert]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label htmlFor="hauptName" className="text-sm font-medium">
          Hauptaktie Name
        </label>
        <Input
          id="hauptName"
          placeholder="z. B. Rheinmetall"
          aria-invalid={!!errors.hauptName}
          {...register("hauptName")}
        />
        {errors.hauptName && (
          <p className="text-sm text-destructive">Bitte den Namen der Hauptaktie angeben</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="hauptIsin" className="text-sm font-medium">
          ISIN
        </label>
        <Controller
          control={control}
          name="hauptIsin"
          render={({ field }) => {
            const gueltig = ISIN_REGEX.test(field.value ?? "");
            return (
              <div className="relative">
                <Input
                  id="hauptIsin"
                  placeholder="z. B. DE0007030009"
                  maxLength={12}
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-9 uppercase"
                  aria-invalid={!!errors.hauptIsin}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase().trim())}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                {gueltig && (
                  <Check
                    className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-status-bereit"
                    role="img"
                    aria-label="ISIN gültig"
                  />
                )}
              </div>
            );
          }}
        />
        {errors.hauptIsin && <p className="text-sm text-destructive">Keine gültige ISIN</p>}
        {/* Kein Blocker, Absenden bleibt moeglich */}
        {heutigesDuplikat && !errors.hauptIsin && (
          <p role="status" className="flex items-start gap-1.5 text-xs text-status-review">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Zu dieser ISIN gibt es heute schon einen Artikel im Feed ({heutigesDuplikat.hauptaktie}).
              Absenden ist trotzdem möglich.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
