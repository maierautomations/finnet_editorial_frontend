"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ISIN_REGEX, type BriefingInput } from "@/lib/schema";

export function IsinFeld() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BriefingInput>();

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
                    aria-label="ISIN gültig"
                  />
                )}
              </div>
            );
          }}
        />
        {errors.hauptIsin && <p className="text-sm text-destructive">Keine gültige ISIN</p>}
      </div>
    </div>
  );
}
