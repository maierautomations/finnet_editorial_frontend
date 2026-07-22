import { NextResponse } from "next/server";
import {
  feedItemSchema,
  type FeedAntwort,
  type FeedItem,
  type FehlerAntwort,
} from "@/lib/schema";
import { holeMockFeed } from "@/lib/mock";

// GET /api/feed: USE_MOCK=1 liefert Mock-Daten aus lib/mock.ts, sonst Proxy zum
// n8n-Feed-Webhook (N8N_FEED_URL, Header X-EI-Token aus EI_TOKEN). Seit Next 15
// sind GET-Handler ohnehin dynamisch, force-dynamic haelt das explizit fest.
export const dynamic = "force-dynamic";

const MAX_ITEMS = 200;

function sortiereNeuesteZuerst(items: FeedItem[]): FeedItem[] {
  // ISO-Zeitstempel gleicher Form sortieren als Strings korrekt
  return items.sort((a, b) => (a.erstelltAm < b.erstelltAm ? 1 : -1)).slice(0, MAX_ITEMS);
}

export async function GET(): Promise<NextResponse<FeedAntwort | FehlerAntwort>> {
  if (process.env.USE_MOCK === "1") {
    return NextResponse.json({ items: sortiereNeuesteZuerst(holeMockFeed()) });
  }

  const url = process.env.N8N_FEED_URL;
  const token = process.env.EI_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      {
        ok: false,
        fehler:
          "Der Server ist nicht vollständig konfiguriert, N8N_FEED_URL und EI_TOKEN in .env.local setzen",
      },
      { status: 500 }
    );
  }

  let antwort: Response;
  try {
    antwort = await fetch(url, {
      headers: { "X-EI-Token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // Netzfehler und Timeout landen beide hier
    return NextResponse.json(
      { ok: false, fehler: "n8n ist gerade nicht erreichbar, in einer Minute erneut versuchen" },
      { status: 502 }
    );
  }

  if (!antwort.ok) {
    // Upstream-Fehlertext bewusst nicht durchreichen
    return NextResponse.json(
      { ok: false, fehler: "n8n hat die Anfrage nicht angenommen, in einer Minute erneut versuchen" },
      { status: 502 }
    );
  }

  let daten: unknown;
  try {
    daten = await antwort.json();
  } catch {
    return NextResponse.json(
      { ok: false, fehler: "n8n hat unerwartet geantwortet, der Feed konnte nicht gelesen werden" },
      { status: 502 }
    );
  }

  // Envelope normalisieren: { items: [...] } oder nacktes Array akzeptieren
  const roh = Array.isArray(daten)
    ? daten
    : typeof daten === "object" && daten !== null && Array.isArray((daten as { items?: unknown }).items)
      ? (daten as { items: unknown[] }).items
      : null;

  if (roh === null) {
    return NextResponse.json(
      { ok: false, fehler: "n8n hat unerwartet geantwortet, der Feed konnte nicht gelesen werden" },
      { status: 502 }
    );
  }

  // Einzelne ungueltige Zeilen still verwerfen statt den ganzen Feed zu blockieren
  const items: FeedItem[] = [];
  for (const eintrag of roh) {
    const geparst = feedItemSchema.safeParse(eintrag);
    if (geparst.success) {
      items.push(geparst.data);
    }
  }

  return NextResponse.json({ items: sortiereNeuesteZuerst(items) });
}
