import { z } from "zod";

// ISIN-Format, gleiche Quelle fuer zod-Schema und Live-Validierung im Formular
export const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

// API-Vertrag aus CLAUDE.md, exakt so belassen
export const briefingSchema = z.object({
  thema: z.string().min(10, "Bitte das Thema etwas ausführlicher beschreiben"),
  artikeltyp: z.enum(["A", "B", "C"]),
  schwerpunkt: z.string().min(3),
  hauptName: z.string().min(2),
  hauptIsin: z.string().regex(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/, "Keine gültige ISIN"),
  redakteurskurs: z.string().optional().default(""),
  irDomain: z.string().optional().default(""),
  weitereWerte: z.string().optional().default(""),
  quellenUrls: z.string().optional().default(""),
  ziellaenge: z.enum(["kurz", "standard", "lang"]).optional().default("standard"),
  autor: z.string().optional().default(""),
});

// Input und Output divergieren wegen .optional().default():
// im Formular duerfen optionale Felder fehlen, nach dem Parsen sind sie garantiert gesetzt.
export type BriefingInput = z.input<typeof briefingSchema>;
export type BriefingDaten = z.output<typeof briefingSchema>;

export type Artikeltyp = BriefingDaten["artikeltyp"];
export type Ziellaenge = BriefingDaten["ziellaenge"];

export type BriefingAntwort =
  | { ok: true; runId: string }
  | { ok: false; fehler: string };

export type FeedStatus = "BEREIT" | "REVIEW_NOETIG" | "FEHLER";

// Anzeige-Status: abgehakte Beitraege (online) erscheinen in der UI als ONLINE
// statt ihres Sheet-Status. Reiner Frontend-Zustand, das Sheet kennt nur die drei Werte.
export type AnzeigeStatus = FeedStatus | "ONLINE";

export type FeedItem = {
  runId: string;
  erstelltAm: string; // ISO
  status: FeedStatus;
  hauptaktie: string;
  isin: string;
  kicker: string;
  title: string;
  seoTitle: string;
  teaser: string;
  offeneMarker: string;
  restFindings: string;
  confidence: string;
  fehler: string;
  // Artikel-HTML aus der Review-Sheet-Spalte TextHTML (GroundStyle: p, ul/li, h2/h3, a)
  textHtml: string;
  // Vom Redakteur abgehakt: Beitrag ist im CMS online (Review-Sheet-Spalte Online)
  online: boolean;
};

export type FehlerAntwort = { ok: false; fehler: string };

export type FeedAntwort = { items: FeedItem[] };

// Laufzeit-Validierung fuer Upstream-Daten aus n8n (Phase 7): Kernfelder strikt,
// Textfelder tolerant per .catch(""), damit einzelne Luecken kein Item verwerfen.
export const feedItemSchema = z.object({
  runId: z.string().min(1),
  erstelltAm: z.string().min(1),
  status: z.enum(["BEREIT", "REVIEW_NOETIG", "FEHLER"]),
  hauptaktie: z.string().catch(""),
  isin: z.string().catch(""),
  kicker: z.string().catch(""),
  title: z.string().catch(""),
  seoTitle: z.string().catch(""),
  teaser: z.string().catch(""),
  offeneMarker: z.string().catch(""),
  restFindings: z.string().catch(""),
  confidence: z.string().catch(""),
  fehler: z.string().catch(""),
  textHtml: z.string().catch(""),
  // Das Sheet liefert Strings ("TRUE"/"FALSE"/"", je nach Locale auch "WAHR"),
  // der Mock echte Booleans; fehlende Spalte (Alt-Zeilen) faellt auf false.
  online: z
    .preprocess(
      (wert) =>
        typeof wert === "string"
          ? ["TRUE", "WAHR", "JA", "1"].includes(wert.trim().toUpperCase())
          : wert,
      z.boolean()
    )
    .catch(false),
});

// POST /api/online: Redakteur hakt ab, dass ein Beitrag im CMS online ist
export const onlineAnfrageSchema = z.object({
  runId: z.string().min(1),
  online: z.boolean(),
});

export type OnlineAntwort = { ok: true } | { ok: false; fehler: string };
