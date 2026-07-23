import { NextResponse } from "next/server";
import { onlineAnfrageSchema, type OnlineAntwort } from "@/lib/schema";
import { setzeMockOnline } from "@/lib/mock";

// POST /api/online: Redakteur hakt ab, dass ein Beitrag im CMS online ist.
// USE_MOCK=1 schreibt in die Mock-Registry, sonst Proxy zum n8n-Webhook
// (N8N_ONLINE_URL, Header X-EI-Token aus EI_TOKEN), der die Spalte Online im
// Review-Sheet per RunID-Match setzt. Fehler immer als deutscher Satz.

export async function POST(request: Request): Promise<NextResponse<OnlineAntwort>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, fehler: "Die Anfrage enthält kein gültiges JSON, bitte erneut versuchen" },
      { status: 400 }
    );
  }

  const ergebnis = onlineAnfrageSchema.safeParse(body);
  if (!ergebnis.success) {
    return NextResponse.json(
      { ok: false, fehler: "Die Anfrage ist unvollständig, RunID und Online-Status werden erwartet" },
      { status: 400 }
    );
  }

  if (process.env.USE_MOCK === "1") {
    // Kurze kuenstliche Latenz, damit sich der Mock wie ein echter Aufruf anfuehlt
    await new Promise((resolve) => setTimeout(resolve, 300));
    const bekannt = setzeMockOnline(ergebnis.data.runId, ergebnis.data.online);
    if (!bekannt) {
      return NextResponse.json(
        { ok: false, fehler: "Zur RunID wurde kein Artikel gefunden, den Feed neu laden" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  const url = process.env.N8N_ONLINE_URL;
  const token = process.env.EI_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      {
        ok: false,
        fehler:
          "Der Server ist nicht vollständig konfiguriert, N8N_ONLINE_URL und EI_TOKEN in .env.local setzen",
      },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EI-Token": token },
      body: JSON.stringify(ergebnis.data),
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

  if (upstream.status === 401 || upstream.status === 403) {
    return NextResponse.json(
      {
        ok: false,
        fehler:
          "n8n hat den Zugriff abgelehnt, EI_TOKEN und das Header-Auth-Credential in n8n müssen exakt übereinstimmen",
      },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    // Upstream-Fehlertext bewusst nicht durchreichen
    return NextResponse.json(
      {
        ok: false,
        fehler: "n8n konnte den Online-Status nicht speichern, in einer Minute erneut versuchen",
      },
      { status: 502 }
    );
  }

  // Der Webhook antwortet erst nach dem Sheet-Update; ein explizites ok:false gilt als Ablehnung.
  let antwort: unknown = null;
  try {
    antwort = await upstream.json();
  } catch {
    // Leerer Body zaehlt als Erfolg, entscheidend ist der 2xx-Status
  }
  if (typeof antwort === "object" && antwort !== null && (antwort as { ok?: unknown }).ok === false) {
    return NextResponse.json(
      {
        ok: false,
        fehler: "n8n konnte den Online-Status nicht speichern, in einer Minute erneut versuchen",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
