import { NextResponse } from "next/server";
import { briefingSchema, type BriefingAntwort, type BriefingDaten } from "@/lib/schema";
import { erzeugeRunId } from "@/lib/runid";
import { registriereMockLauf } from "@/lib/mock";

// POST /api/briefing: USE_MOCK=1 antwortet als Mock, sonst Proxy zum n8n-Intake-Webhook
// (N8N_BRIEFING_URL, Header X-EI-Token aus EI_TOKEN). Fehler immer als deutscher Satz.

// Der n8n-Workflow liest die Eingabe ueber die Labels seines urspruenglichen Form-Triggers
// (Code-Node "Briefing validieren"). Der Payload traegt deshalb exakt diese Schluessel.
// Die runId erzeugt der Server hier und schickt sie mit; im Workflow gewinnt sie ueber
// g('runId') gegen die dort erzeugte (siehe n8n-Checkliste in CLAUDE.md).
const ZIELLAENGE_LABELS: Record<BriefingDaten["ziellaenge"], string> = {
  kurz: "Kurzmeldung (ca. 1.500 bis 2.000 Zeichen)",
  standard: "Standard (ca. 2.500 bis 3.500 Zeichen)",
  lang: "Einordnung (ca. 3.000 bis 4.200 Zeichen)",
};

function baueIntakePayload(daten: BriefingDaten, runId: string): Record<string, string> {
  return {
    runId,
    "Thema / Auslöser": daten.thema,
    // "Briefing validieren" prueft nur den Anfangsbuchstaben (/^[ABC]/)
    Artikeltyp: daten.artikeltyp,
    "Schwerpunkt / Angle": daten.schwerpunkt,
    "Hauptaktie Name": daten.hauptName,
    "Hauptaktie ISIN": daten.hauptIsin,
    "Redakteurskurs (Wert, Währung, Börsenplatz, Datum/Uhrzeit)": daten.redakteurskurs,
    "Gelieferte Quellen (URLs oder Text)": daten.quellenUrls,
    // Frontend sammelt weitere Werte kommagetrennt, der Workflow erwartet einen je Zeile
    "Weitere Werte (Name und ISIN je Zeile)": daten.weitereWerte
      .split(",")
      .map((wert) => wert.trim())
      .filter(Boolean)
      .join("\n"),
    "IR-Domain (z.B. investor.apple.com)": daten.irDomain,
    "Ziellänge": ZIELLAENGE_LABELS[daten.ziellaenge],
    "Autor/in": daten.autor,
  };
}
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

  const runId = erzeugeRunId(ergebnis.data.hauptIsin);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EI-Token": token },
      body: JSON.stringify(baueIntakePayload(ergebnis.data, runId)),
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
      { ok: false, fehler: "n8n hat das Briefing nicht angenommen, in einer Minute erneut versuchen" },
      { status: 502 }
    );
  }

  // Der Webhook antwortet mit "Respond Immediately", also ohne runId im Body.
  // 2xx zaehlt als angenommen; nur ein explizites ok:false gilt als Ablehnung.
  let antwort: unknown = null;
  try {
    antwort = await upstream.json();
  } catch {
    // Body ist bei Respond Immediately zweitrangig, ein leerer oder kaputter Body ist ok
  }
  if (typeof antwort === "object" && antwort !== null && (antwort as { ok?: unknown }).ok === false) {
    return NextResponse.json(
      { ok: false, fehler: "n8n hat das Briefing abgelehnt, Eingaben prüfen und erneut absenden" },
      { status: 502 }
    );
  }

  // Sollte der Workflow spaeter doch eine eigene runId zurueckgeben, hat sie Vorrang,
  // denn sie ist es, die im Review-Sheet landet
  const upstreamRunId =
    typeof antwort === "object" && antwort !== null ? (antwort as { runId?: unknown }).runId : undefined;
  return NextResponse.json({
    ok: true,
    runId: typeof upstreamRunId === "string" && upstreamRunId.length > 0 ? upstreamRunId : runId,
  });
}
