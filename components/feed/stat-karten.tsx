import { Activity, CalendarDays, Newspaper, Timer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnzeigeStatus, FeedItem } from "@/lib/schema";
import { berechneFeedStats, formatiereLaufzeit } from "@/lib/feed-berechnungen";
import { STATUS_ANZEIGE } from "@/components/feed/status-badge";

const STATUS_REIHEN: { status: AnzeigeStatus; label: string; balken: string }[] = [
  { status: "BEREIT", label: STATUS_ANZEIGE.BEREIT, balken: "bg-status-bereit" },
  { status: "REVIEW_NOETIG", label: STATUS_ANZEIGE.REVIEW_NOETIG, balken: "bg-status-review" },
  { status: "FEHLER", label: STATUS_ANZEIGE.FEHLER, balken: "bg-status-fehler" },
  { status: "ONLINE", label: STATUS_ANZEIGE.ONLINE, balken: "bg-primary" },
];

function StatKarte({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60">
            {icon}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function StatKarten({ items }: { items: FeedItem[] }) {
  const stats = berechneFeedStats(items);

  return (
    <div className="grid gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <StatKarte label="Gesamt" icon={<Newspaper className="size-4 text-muted-foreground" aria-hidden />}>
        <p className="text-2xl font-semibold tabular-nums">{stats.gesamt}</p>
        <p className="text-xs text-muted-foreground">Artikel im Feed</p>
      </StatKarte>

      <StatKarte label="Diese Woche" icon={<CalendarDays className="size-4 text-muted-foreground" aria-hidden />}>
        <p className="text-2xl font-semibold tabular-nums">{stats.dieseWoche}</p>
        <p className="text-xs text-muted-foreground">
          davon heute: <span className="tabular-nums">{stats.heute}</span>
        </p>
      </StatKarte>

      <StatKarte label="Status" icon={<Activity className="size-4 text-muted-foreground" aria-hidden />}>
        <div className="flex flex-col gap-1.5 pt-1">
          {STATUS_REIHEN.map(({ status, label, balken }) => {
            const anzahl = stats.jeStatus[status];
            const breite = stats.gesamt > 0 ? `${(anzahl / stats.gesamt) * 100}%` : "0%";
            return (
              <div key={status} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="tabular-nums">{anzahl}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", balken)} style={{ width: breite }} />
                </div>
              </div>
            );
          })}
        </div>
      </StatKarte>

      <StatKarte label="Durchschnittslaufzeit" icon={<Timer className="size-4 text-muted-foreground" aria-hidden />}>
        {stats.durchschnittslaufzeitSekunden !== null ? (
          <p className="text-2xl font-semibold tabular-nums">
            {formatiereLaufzeit(stats.durchschnittslaufzeitSekunden)}
          </p>
        ) : (
          <p className="text-base text-muted-foreground">keine Angabe</p>
        )}
        <p className="text-xs text-muted-foreground">je Lauf, Start bis fertig</p>
      </StatKarte>
    </div>
  );
}
