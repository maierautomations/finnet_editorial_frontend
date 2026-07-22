import { NextResponse } from "next/server";
import { briefingSchema, type BriefingAntwort } from "@/lib/schema";
import { erzeugeRunId } from "@/lib/runid";
import { registriereMockLauf } from "@/lib/mock";

// POST /api/briefing: USE_MOCK=1 antwortet als Mock, sonst Proxy zum n8n-Intake-Webhook
// (N8N_BRIEFING_URL, Header X-EI-Token aus EI_TOKEN). Fehler immer als deutscher Satz.
export async function POST(request: Request): Promise<NextResponse<BriefingAntwort>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, fehler: "Die Anfrage enthält kein gültiges JSON, bitte erneut absenden" },
      { status: 400 }
    );
  }

  const ergebnis = briefingSchema.safeParse(body);
  if (!ergebnis.success) {
    return NextResponse.json(
      {
        ok: false,
        fehler: "Bitte die Eingaben prüfen, es fehlen Pflichtangaben oder die ISIN ist ungültig",
      },
      { status: 400 }
    );
  }

  if (process.env.USE_MOCK === "1") {
    // Kurze kuenstliche Latenz, damit sich der Mock wie ein echter Aufruf anfuehlt
    await new Promise((resolve) => setTimeout(resolve, 500));
    const runId = erzeugeRunId(ergebnis.data.hauptIsin);
    // Der Lauf taucht nach 60 bis 90 Sekunden im Mock-Feed auf (Phase 5, Lauf-Modus)
    registriereMockLauf(ergebnis.data, runId);
    return NextResponse.json({ ok: true, runId });
  }

  const url = process.env.N8N_BRIEFING_URL;
  const token = process.env.EI_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      {
        ok: false,
        fehler:
          "Der Server ist nicht vollständig konfiguriert, N8N_BRIEFING_URL und EI_TOKEN in .env.local setzen",
      },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EI-Token": token },
      // Geparste Daten senden, damit die optionalen Felder garantiert gesetzt sind
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

  if (!upstream.ok) {
    // Upstream-Fehlertext bewusst nicht durchreichen
    return NextResponse.json(
      { ok: false, fehler: "n8n hat das Briefing nicht angenommen, in einer Minute erneut versuchen" },
      { status: 502 }
    );
  }

  let antwort: unknown;
  try {
    antwort = await upstream.json();
  } catch {
    return NextResponse.json(
      { ok: false, fehler: "n8n hat unerwartet geantwortet, das Briefing bitte erneut absenden" },
      { status: 502 }
    );
  }

  const runId =
    typeof antwort === "object" && antwort !== null && (antwort as { ok?: unknown }).ok === true
      ? (antwort as { runId?: unknown }).runId
      : undefined;
  if (typeof runId === "string" && runId.length > 0) {
    return NextResponse.json({ ok: true, runId });
  }

  // Auch ein Upstream-ok:false wird nicht roh durchgereicht
  return NextResponse.json(
    { ok: false, fehler: "n8n hat das Briefing abgelehnt, Eingaben prüfen und erneut absenden" },
    { status: 502 }
  );
}
