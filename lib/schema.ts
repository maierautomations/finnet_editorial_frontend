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
};
