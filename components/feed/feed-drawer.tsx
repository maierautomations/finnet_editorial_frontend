"use client";

import { useState } from "react";
import { ChevronDown, CircleCheck, Copy } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/schema";
import {
  anzeigeStatus,
  formatiereLaufzeit,
  formatiereZeitpunkt,
  laufzeitSekunden,
} from "@/lib/feed-berechnungen";
import { StatusBadge } from "@/components/feed/status-badge";

function DrawerFeld({
  label,
  wert,
  mono = false,
  kopierbar = false,
}: {
  label: string;
  wert: string;
  mono?: boolean;
  kopierbar?: boolean;
}) {
  const kopieren = async () => {
    try {
      // Rohwert unveraendert kopieren, fuers direkte Einfuegen ins CMS
      await navigator.clipboard.writeText(wert);
      toast.success(`${label} kopiert`);
    } catch {
      toast.error("Kopieren nicht möglich, den Text bitte manuell markieren");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {kopierbar && wert !== "" && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={kopieren}
            aria-label={`${label} kopieren`}
            className="-my-1 text-muted-foreground hover:text-foreground"
          >
            <Copy aria-hidden />
          </Button>
        )}
      </div>
      {wert ? (
        <p className={cn("text-sm whitespace-pre-line", mono && "font-mono break-all")}>{wert}</p>
      ) : (
        <p className="text-sm text-muted-foreground">keine Angabe</p>
      )}
    </div>
  );
}

function FeldGruppe({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titel}</h3>
      {children}
    </section>
  );
}

// Eingeklappter Artikel im GroundStyle-HTML (Aufklapp-Muster wie MehrOptionen).
// Das HTML stammt aus dem eigenen n8n-Workflow (Review-Sheet-Spalte TextHTML)
// und gilt als vertrauenswuerdig, deshalb dangerouslySetInnerHTML ohne Sanitizer.
function ArtikelInhalt({ html }: { html: string }) {
  const [offen, setOffen] = useState(false);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="flex items-center justify-between gap-2 text-sm font-medium"
      >
        Artikel anzeigen
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", offen && "rotate-180")}
          aria-hidden
        />
      </button>
      <div
        className={cn("artikel-inhalt", offen ? "block" : "hidden")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

export function FeedDrawer({
  item,
  offen,
  onOpenChange,
  onOnlineUmschalten,
}: {
  item: FeedItem | null;
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
  onOnlineUmschalten: (item: FeedItem) => Promise<void>;
}) {
  const laufzeit = item ? laufzeitSekunden(item.runId, item.erstelltAm) : null;
  // Doppelklick-Guard, solange der Online-Status gespeichert wird
  const [speichertOnline, setSpeichertOnline] = useState(false);

  return (
    <Sheet open={offen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        {item && (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3 pr-10">
                <SheetTitle className="text-lg">{item.hauptaktie}</SheetTitle>
                <StatusBadge status={anzeigeStatus(item)} />
              </div>
              <SheetDescription className="font-mono">
                {item.isin || "keine Angabe"}
              </SheetDescription>
            </SheetHeader>

            {item.fehler && (
              <div className="mx-4 mt-4 rounded-lg bg-status-fehler/10 p-3 text-sm text-status-fehler">
                {item.fehler}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-6">
                {item.status !== "FEHLER" && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Im CMS online</p>
                      <p className="text-xs text-muted-foreground">
                        Abhaken, sobald der Beitrag online ist
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={item.online}
                      disabled={speichertOnline}
                      onClick={async () => {
                        setSpeichertOnline(true);
                        await onOnlineUmschalten(item);
                        setSpeichertOnline(false);
                      }}
                    >
                      {item.online ? (
                        <>
                          <CircleCheck className="text-status-bereit" aria-hidden /> Online
                        </>
                      ) : (
                        "Als online markieren"
                      )}
                    </Button>
                  </div>
                )}

                <FeldGruppe titel="Artikel">
                  <DrawerFeld label="Kicker" wert={item.kicker} kopierbar />
                  <DrawerFeld label="Titel" wert={item.title} kopierbar />
                  <DrawerFeld label="SEO-Titel" wert={item.seoTitle} kopierbar />
                  <DrawerFeld label="Teaser" wert={item.teaser} kopierbar />
                </FeldGruppe>

                {item.textHtml.trim() !== "" && (
                  // key setzt den Aufklapp-Zustand beim Item-Wechsel zurueck
                  <ArtikelInhalt key={item.runId} html={item.textHtml} />
                )}

                <FeldGruppe titel="Prüfung">
                  <DrawerFeld label="Offene Marker" wert={item.offeneMarker} />
                  <DrawerFeld label="Rest-Findings" wert={item.restFindings} />
                  <DrawerFeld label="Confidence" wert={item.confidence} />
                </FeldGruppe>

                <FeldGruppe titel="Lauf">
                  <DrawerFeld label="RunID" wert={item.runId} mono />
                  <DrawerFeld label="Erstellt am" wert={formatiereZeitpunkt(item.erstelltAm)} />
                  <DrawerFeld
                    label="Laufzeit"
                    wert={laufzeit !== null ? formatiereLaufzeit(laufzeit) : ""}
                  />
                </FeldGruppe>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
