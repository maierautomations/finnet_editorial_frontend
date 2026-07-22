import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/schema";
import {
  formatiereLaufzeit,
  formatiereZeitpunkt,
  laufzeitSekunden,
} from "@/lib/feed-berechnungen";
import { StatusBadge } from "@/components/feed/status-badge";

function DrawerFeld({
  label,
  wert,
  mono = false,
}: {
  label: string;
  wert: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
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

export function FeedDrawer({
  item,
  offen,
  onOpenChange,
}: {
  item: FeedItem | null;
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
}) {
  const laufzeit = item ? laufzeitSekunden(item.runId, item.erstelltAm) : null;

  return (
    <Sheet open={offen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-lg">
        {item && (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3 pr-10">
                <SheetTitle className="text-lg">{item.hauptaktie}</SheetTitle>
                <StatusBadge status={item.status} />
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
                <FeldGruppe titel="Artikel">
                  <DrawerFeld label="Kicker" wert={item.kicker} />
                  <DrawerFeld label="Titel" wert={item.title} />
                  <DrawerFeld label="SEO-Titel" wert={item.seoTitle} />
                  <DrawerFeld label="Teaser" wert={item.teaser} />
                </FeldGruppe>

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
