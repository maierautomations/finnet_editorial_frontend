"use client";

import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { briefingSchema, type BriefingAntwort, type BriefingDaten, type BriefingInput } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PresetChips } from "@/components/briefing/preset-chips";
import { ArtikeltypAuswahl } from "@/components/briefing/artikeltyp-auswahl";
import { IsinFeld } from "@/components/briefing/isin-feld";
import { MehrOptionen } from "@/components/briefing/mehr-optionen";

export function BriefingFormular() {
  const form = useForm<BriefingInput, unknown, BriefingDaten>({
    resolver: zodResolver(briefingSchema),
    defaultValues: {
      thema: "",
      schwerpunkt: "",
      hauptName: "",
      hauptIsin: "",
      redakteurskurs: "",
      irDomain: "",
      weitereWerte: "",
      quellenUrls: "",
      ziellaenge: "standard",
      autor: "",
      // artikeltyp bewusst ohne Default: bleibt bis zur Kartenauswahl leer,
      // zod erzwingt die Auswahl beim Submit
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const themaLaenge = watch("thema")?.length ?? 0;

  const onSubmit: SubmitHandler<BriefingDaten> = async (daten) => {
    let antwort: BriefingAntwort;
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(daten),
      });
      antwort = (await res.json()) as BriefingAntwort;
    } catch {
      toast.error("Der Server ist gerade nicht erreichbar, in einer Minute erneut versuchen");
      return;
    }

    if (antwort.ok) {
      toast.success("Briefing angenommen", {
        description: `RunID: ${antwort.runId}`,
      });
    } else {
      toast.error(antwort.fehler);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-4"
    >
      <FormProvider {...form}>
        <PresetChips />
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Neues Briefing</CardTitle>
              <CardDescription>
                Briefing ausfüllen und abschicken, der Workflow recherchiert, schreibt und
                prüft den Artikel. Typische Laufzeit: 3 bis 5 Minuten.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="thema" className="text-sm font-medium">
                  Thema / Auslöser
                </label>
                <Textarea
                  id="thema"
                  rows={3}
                  placeholder="Was ist passiert? Worüber soll der Artikel gehen?"
                  aria-invalid={!!errors.thema}
                  {...register("thema")}
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-destructive">
                    {errors.thema ? "Bitte das Thema etwas ausführlicher beschreiben" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {themaLaenge} Zeichen
                  </p>
                </div>
              </div>

              <IsinFeld />

              <ArtikeltypAuswahl />

              <div className="flex flex-col gap-2">
                <label htmlFor="schwerpunkt" className="text-sm font-medium">
                  Schwerpunkt / Angle
                </label>
                <Input
                  id="schwerpunkt"
                  placeholder="Aus welchem Blickwinkel?"
                  aria-invalid={!!errors.schwerpunkt}
                  {...register("schwerpunkt")}
                />
                {errors.schwerpunkt && (
                  <p className="text-sm text-destructive">
                    Bitte einen Schwerpunkt angeben, mindestens 3 Zeichen
                  </p>
                )}
              </div>

              <MehrOptionen />
            </CardContent>
            <CardFooter className="justify-end border-t border-border pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {isSubmitting ? "Wird gesendet" : "Artikel erstellen lassen"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </motion.div>
  );
}
