"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AnzeigeStatus } from "@/lib/schema";
import { STATUS_ANZEIGE } from "@/components/feed/status-badge";

export type StatusFilter = AnzeigeStatus | "ALLE";

// Die Chips filtern auf den Anzeige-Status: BEREIT und REVIEW NÖTIG zeigen nur
// noch nicht abgehakte Beitraege, abgehakte laufen unter ONLINE.
const STATUS_CHIPS: { wert: StatusFilter; label: string; punkt?: string }[] = [
  { wert: "ALLE", label: "Alle" },
  { wert: "BEREIT", label: STATUS_ANZEIGE.BEREIT, punkt: "bg-status-bereit" },
  { wert: "REVIEW_NOETIG", label: STATUS_ANZEIGE.REVIEW_NOETIG, punkt: "bg-status-review" },
  { wert: "FEHLER", label: STATUS_ANZEIGE.FEHLER, punkt: "bg-status-fehler" },
  { wert: "ONLINE", label: STATUS_ANZEIGE.ONLINE, punkt: "bg-primary" },
];

// Kontrollierte Filterzeile: Status-Chips, Toggle "Noch nicht online" (der
// Arbeitsvorrat des Redakteurs) und Textsuche. Der State lebt in FeedAnsicht,
// gefiltert wird nur die Liste, die Stat-Karten rechnen auf den Gesamtdaten.
export function FeedFilter({
  statusFilter,
  onStatusFilter,
  suche,
  onSuche,
  nurNichtOnline,
  onNurNichtOnline,
}: {
  statusFilter: StatusFilter;
  onStatusFilter: (filter: StatusFilter) => void;
  suche: string;
  onSuche: (suche: string) => void;
  nurNichtOnline: boolean;
  onNurNichtOnline: (nurNichtOnline: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_CHIPS.map(({ wert, label, punkt }) => (
        <Button
          key={wert}
          type="button"
          size="sm"
          className="rounded-full"
          variant={statusFilter === wert ? "secondary" : "outline"}
          aria-pressed={statusFilter === wert}
          onClick={() => onStatusFilter(wert)}
        >
          {punkt && <span aria-hidden className={cn("size-1.5 rounded-full", punkt)} />}
          {label}
        </Button>
      ))}
      <span aria-hidden className="h-4 w-px bg-border" />
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        variant={nurNichtOnline ? "secondary" : "outline"}
        aria-pressed={nurNichtOnline}
        onClick={() => onNurNichtOnline(!nurNichtOnline)}
      >
        Noch nicht online
      </Button>
      <div className="relative w-full sm:ml-auto sm:w-64">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={suche}
          onChange={(event) => onSuche(event.target.value)}
          placeholder="Aktie oder Titel suchen"
          aria-label="Feed durchsuchen"
          className="pl-8"
        />
      </div>
    </div>
  );
}
