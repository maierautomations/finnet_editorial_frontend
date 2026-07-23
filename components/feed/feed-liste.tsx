"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import type { FeedItem } from "@/lib/schema";
import { anzeigeStatus, formatiereRelativeZeit } from "@/lib/feed-berechnungen";
import { StatusBadge } from "@/components/feed/status-badge";

export function FeedListe({
  items,
  onAuswahl,
}: {
  items: FeedItem[];
  onAuswahl: (item: FeedItem) => void;
}) {
  // Minuten-Ticker fuer die Relativzeiten: SWR haelt bei unveraendertem Feed die
  // data-Referenz stabil (deep-equal im Cache), ohne eigenen Takt wuerden die
  // Angaben einfrieren. Ein Re-Render pro Minute ist billig, dabei animiert
  // nichts (stabile Keys, keine Enter-Animationen).
  const [jetzt, setJetzt] = useState(() => new Date());
  useEffect(() => {
    const intervall = setInterval(() => setJetzt(new Date()), 60_000);
    return () => clearInterval(intervall);
  }, []);

  return (
    <Card className="rounded-2xl py-0">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.runId}>
            <button
              type="button"
              onClick={() => onAuswahl(item)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <StatusBadge
                status={anzeigeStatus(item)}
                className="min-w-24 shrink-0 justify-center"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  <span className="font-medium">{item.hauptaktie}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    {item.title || "ohne Titel"}
                  </span>
                </span>
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                  {item.runId.slice(0, 15)}
                </span>
              </span>
              <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {formatiereRelativeZeit(item.erstelltAm, jetzt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
