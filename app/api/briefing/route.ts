import { NextResponse } from "next/server";
import { briefingSchema, type BriefingAntwort } from "@/lib/schema";
import { erzeugeRunId } from "@/lib/runid";

// Phase 2: Die Route antwortet immer als Mock. Der USE_MOCK-Zweig und der
// n8n-Proxy (N8N_BRIEFING_URL, EI_TOKEN) kommen in Phase 3 dazu.
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

  // Kurze kuenstliche Latenz, damit sich der Mock wie ein echter Aufruf anfuehlt
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({ ok: true, runId: erzeugeRunId(ergebnis.data.hauptIsin) });
}
