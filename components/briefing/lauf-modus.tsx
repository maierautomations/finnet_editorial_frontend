"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Copy, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { feedFetcher } from "@/lib/feed-fetcher";
import { formatiereLaufzeit, laufzeitSekunden } from "@/lib/feed-berechnungen";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/feed/status-badge";
import { cn } from "@/lib/utils";

const SCHRITTE = ["Angenommen", "In Arbeit", "Fertig"] as const;

// Nach 10 Minuten ohne Ergebnis erscheint ein Hinweis, der Lauf laeuft trotzdem weiter
const LANGLAEUFER_SEKUNDEN = 600;

export function LaufModus({
  runId,
  gestartetAm,
  onNeuesBriefing,
  onZumFeed,
}: {
  runId: string;
  gestartetAm: number;
  onNeuesBriefing: () => void;
  onZumFeed: () => void;
}) {
  // Geteilter Cache mit der Feed-Ansicht (gleicher Key), eigenes Polling alle 20 Sekunden
  const { data, error } = useSWR("/api/feed", feedFetcher, { refreshInterval: 20_000 });
  const item = data?.find((eintrag) => eintrag.runId === runId) ?? null;

  // Der Schritt "Angenommen" bleibt kurz aktiv, danach uebernimmt "In Arbeit"
  const [angenommenVorbei, setAngenommenVorbei] = useState(false);
  useEffect(() => {
    setAngenommenVorbei(false);
    const timer = setTimeout(() => setAngenommenVorbei(true), 3000);
    return () => clearTimeout(timer);
  }, [runId]);

  // Beim Wechsel vom Formular hierher waere der Fokus sonst verloren
  // (der Submit-Button ist weg), deshalb auf die Ueberschrift setzen
  const ueberschriftRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ueberschriftRef.current?.focus();
  }, [runId]);

  // Sekundenticker fuer die verstrichene Zeit, stoppt sobald das Ergebnis da ist
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    if (item) return;
    const intervall = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(intervall);
  }, [item]);

  const aktiverSchritt = item ? SCHRITTE.length : angenommenVorbei ? 1 : 0;
  const verstrichen = Math.max(0, Math.floor((jetzt - gestartetAm) / 1000));
  const laufzeit = item ? laufzeitSekunden(runId, item.erstelltAm) : null;

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(runId);
      toast.success("RunID kopiert");
    } catch {
      toast.error("Kopieren nicht möglich, die RunID bitte manuell markieren");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl"
    >
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle ref={ueberschriftRef} tabIndex={-1} className="text-xl outline-none">
            {item
              ? item.status === "FEHLER"
                ? "Lauf abgeschlossen, Fehler aufgetreten"
                : "Artikel fertig"
              : "Artikel wird erstellt"}
          </CardTitle>
          <CardDescription>
            {item
              ? "Alle Felder des Artikels stehen im Feed."
              : "Der Workflow recherchiert, schreibt und prüft. Typische Laufzeit: 3 bis 5 Minuten, der Feed wird alle 20 Sekunden geprüft."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">RunID</p>
              <p className="truncate font-mono text-sm">{runId}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={kopieren}
              aria-label="RunID kopieren"
            >
              <Copy aria-hidden /> Kopieren
            </Button>
          </div>

          <ol aria-label="Fortschritt des Laufs" className="flex items-center">
            {SCHRITTE.map((schritt, idx) => {
              const erledigt = idx < aktiverSchritt;
              const aktiv = idx === aktiverSchritt;
              return (
                <li
                  key={schritt}
                  aria-current={aktiv ? "step" : undefined}
                  className={cn("flex min-w-0 items-center gap-2", idx > 0 && "flex-1")}
                >
                  {idx > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        "mx-1 h-px flex-1",
                        idx <= aktiverSchritt ? "bg-primary/50" : "bg-border"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      erledigt
                        ? "border-primary bg-primary text-primary-foreground"
                        : aktiv
                          ? "border-primary"
                          : "border-border"
                    )}
                  >
                    {erledigt ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <span
                        aria-hidden
                        className={cn(
                          "rounded-full",
                          aktiv
                            ? "size-2 animate-pulse bg-primary"
                            : "size-1.5 bg-muted-foreground/40"
                        )}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate text-sm",
                      erledigt || aktiv ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {schritt}
                  </span>
                </li>
              );
            })}
          </ol>

          <div role="status" aria-live="polite" className="flex flex-col gap-2">
            {item ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.status === "BEREIT" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                      className="text-status-bereit"
                    >
                      <CheckCircle2 className="size-5" aria-hidden />
                    </motion.span>
                  )}
                  <StatusBadge status={item.status} />
                  {laufzeit !== null && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Laufzeit {formatiereLaufzeit(laufzeit)}
                    </span>
                  )}
                </div>
                {item.status === "FEHLER" ? (
                  <p className="rounded-lg bg-status-fehler/10 p-3 text-sm text-status-fehler">
                    {item.fehler || "Der Lauf ist fehlgeschlagen, das Briefing bitte erneut absenden."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {item.kicker && (
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {item.kicker}
                      </p>
                    )}
                    <p className="text-base font-medium">{item.title || "ohne Titel"}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
                  <span>
                    Läuft seit <span className="tabular-nums">{formatiereLaufzeit(verstrichen)}</span>,
                    das Ergebnis erscheint hier automatisch.
                  </span>
                </div>
                {error && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TriangleAlert className="size-3.5 shrink-0 text-status-review" aria-hidden />
                    Der Feed ist gerade nicht erreichbar, es wird weiter versucht.
                  </p>
                )}
                {verstrichen > LANGLAEUFER_SEKUNDEN && (
                  <p className="text-xs text-muted-foreground">
                    Der Lauf dauert ungewöhnlich lange. Später im Feed nachsehen oder das Briefing
                    erneut absenden.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onNeuesBriefing}>
            Neues Briefing
          </Button>
          <Button type="button" variant={item ? "default" : "outline"} onClick={onZumFeed}>
            Zum Feed
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
