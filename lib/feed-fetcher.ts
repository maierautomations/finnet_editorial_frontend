import type { FeedAntwort, FeedItem } from "@/lib/schema";

// Geteilter SWR-Fetcher fuer den Key "/api/feed": Feed-Ansicht (Polling 30 s),
// Lauf-Modus (Polling 20 s) und Duplikat-Hinweis nutzen denselben Cache.
export async function feedFetcher(url: string): Promise<FeedItem[]> {
  const res = await fetch(url);
  const daten: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const fehler =
      typeof daten === "object" &&
      daten !== null &&
      typeof (daten as { fehler?: unknown }).fehler === "string"
        ? (daten as { fehler: string }).fehler
        : "Der Feed konnte nicht geladen werden, in einer Minute erneut versuchen";
    throw new Error(fehler);
  }
  return (daten as FeedAntwort).items;
}
