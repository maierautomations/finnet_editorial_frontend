"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ZiellaengeAuswahl } from "@/components/briefing/ziellaenge-auswahl";
import { cn } from "@/lib/utils";
import type { BriefingInput } from "@/lib/schema";

// Der Block wird nur visuell auf- und zugeklappt, das Panel bleibt gemountet,
// damit die RHF-Registrierung und eingegebene Werte stabil bleiben.
export function MehrOptionen() {
  const [offen, setOffen] = useState(false);
  const { register } = useFormContext<BriefingInput>();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/40 p-4">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="flex items-center justify-between gap-2 text-sm font-medium"
      >
        Mehr Optionen
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", offen && "rotate-180")}
          aria-hidden
        />
      </button>

      <div className={cn("flex-col gap-5", offen ? "flex" : "hidden")}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="redakteurskurs" className="text-sm font-medium">
              Redakteurskurs
            </label>
            <Badge variant="secondary" className="text-status-bereit">
              Kurs mitgeben = Artikel kann direkt BEREIT werden
            </Badge>
          </div>
          <Input
            id="redakteurskurs"
            placeholder="Wert, Währung, Börsenplatz, Datum/Uhrzeit"
            {...register("redakteurskurs")}
          />
          <p className="text-xs text-muted-foreground">
            Ohne Kurs bleibt ein Platzhalter im Artikel und er landet im Review.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="irDomain" className="text-sm font-medium">
            IR-Domain
          </label>
          <Input id="irDomain" placeholder="z. B. rheinmetall.com" {...register("irDomain")} />
          <p className="text-xs text-muted-foreground">Verbessert die Recherche.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="weitereWerte" className="text-sm font-medium">
            Weitere Werte
          </label>
          <Input
            id="weitereWerte"
            placeholder="Weitere Aktien, kommagetrennt"
            {...register("weitereWerte")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quellenUrls" className="text-sm font-medium">
            Quellen-URLs
          </label>
          <Textarea
            id="quellenUrls"
            rows={3}
            placeholder="Eine URL pro Zeile"
            {...register("quellenUrls")}
          />
        </div>

        <ZiellaengeAuswahl />

        <div className="flex flex-col gap-2">
          <label htmlFor="autor" className="text-sm font-medium">
            Autor
          </label>
          <Input id="autor" placeholder="Name oder Kürzel" {...register("autor")} />
        </div>
      </div>
    </div>
  );
}
