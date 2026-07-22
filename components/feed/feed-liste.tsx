import { Card } from "@/components/ui/card";
import type { FeedItem } from "@/lib/schema";
import { formatiereFeedZeit } from "@/lib/feed-berechnungen";
import { StatusBadge } from "@/components/feed/status-badge";

export function FeedListe({
  items,
  onAuswahl,
}: {
  items: FeedItem[];
  onAuswahl: (item: FeedItem) => void;
}) {
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
              <StatusBadge status={item.status} className="min-w-24 shrink-0 justify-center" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  <span className="font-medium">{item.hauptaktie}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    {item.title || "ohne Titel"}
                  </span>
                </span>
                <span className="block font-mono text-xs text-muted-foreground">
                  {item.runId.slice(0, 15)}
                </span>
              </span>
              <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {formatiereFeedZeit(item.erstelltAm)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
