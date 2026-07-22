# CLAUDE.md, Projektkontext EI Studio

Diese Datei ist der verbindliche Kontext für alle KI-gestützten Code-Änderungen in diesem Repo. Vor jeder Aufgabe vollständig lesen und befolgen.

## Was dieses Projekt ist

EI Studio ist ein internes Frontend für Redakteure von finanzen.net. Es schickt Artikel-Briefings an einen bestehenden n8n-Workflow (der recherchiert, schreibt, prüft und den Artikel in ein Review-Google-Sheet und als Draft ins CMS legt) und zeigt einen Feed der erzeugten Artikel samt Status und Stats. Das Frontend ist reine Eingabe- und Anzeigefläche. Es hält keine eigenen Daten, publiziert nichts und bearbeitet keine Artikel.

## Stack (nicht diskutieren, so bauen)

- Next.js 15, App Router, TypeScript strict
- Tailwind CSS, shadcn/ui, Framer Motion (sparsam), SWR, react-hook-form, zod, sonner
- Keine Datenbank, kein Auth-Provider, keine Websockets, kein zusätzliches State-Management (React-State und SWR reichen)

## Architektur-Regeln (hart)

1. Der Browser spricht nur mit eigenen Route Handlern (`/api/briefing`, `/api/feed`). Niemals direkt mit n8n.
2. `EI_TOKEN`, `N8N_BRIEFING_URL`, `N8N_FEED_URL` existieren nur serverseitig (`process.env`), tauchen nie im Client-Bundle auf.
3. `USE_MOCK=1` schaltet beide Routen auf Mock-Daten aus `lib/mock.ts`. Alle Features müssen vollständig mit Mocks funktionieren.
4. Quelle der Wahrheit ist der Feed (später das Review-Sheet via n8n). Das Frontend berechnet Stats selbst aus den Feed-Items, es gibt keinen separaten Stats-Endpoint.
5. Fehler von n8n werden nie roh durchgereicht, sondern als `{ ok: false, fehler: "verständlicher deutscher Satz" }` gemappt.

## API-Vertrag

### POST /api/briefing

zod-Schema (exakt):

```ts
const briefingSchema = z.object({
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
```

Antwort: `{ ok: true, runId: string }` oder `{ ok: false, fehler: string }`.

RunID-Format: `JJJJMMTT-HHMMSS-ISIN`, Beispiel `20260722-141530-DE0007030009`. Der Mock generiert sie aus aktueller Zeit plus eingegebener ISIN.

### GET /api/feed

Antwort: `{ items: FeedItem[] }`, neueste zuerst, maximal 200.

```ts
type FeedItem = {
  runId: string;
  erstelltAm: string; // ISO
  status: "BEREIT" | "REVIEW_NOETIG" | "FEHLER";
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
```

Abgeleitete Werte (im Frontend berechnen): Laufzeit in Sekunden = `erstelltAm` minus Zeitstempel aus der RunID (die ersten 15 Zeichen, lokale Zeit Europe/Berlin). Stats: gesamt, heute, diese Woche, Anzahl je Status, Durchschnittslaufzeit.

`lib/mock.ts` liefert mindestens 15 realistische deutsche Finanz-Beispiele (Rheinmetall, NVIDIA, AMD, Siemens Energy, Commerzbank und so weiter) mit allen drei Status, plausiblen Zeiten der letzten sieben Tage und gefüllten Feldern inklusive Markern wie `[Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit]`.

## Design-Tokens

- Hintergrund `#0B1220`, Karten `#111A2E`, Ränder `#1E2A44`, Text `#E6EBF2`, Sekundärtext `#8A96AC`
- Akzent `#2F6FEB`
- Status: BEREIT `#22C55E`, REVIEW_NOETIG `#F59E0B`, FEHLER `#EF4444`
- Font Inter, Zahlen mit `tabular-nums`
- Dark Mode ist Default. Abgerundete Karten (rounded-2xl), ruhige Schatten, viel Weißraum, eine Akzentfarbe. Animationen dezent: Fade-in für Karten, Puls für den Lauf-Stepper, kurzer Erfolgsmoment bei Status Fertig.

## UI-Struktur

- Header: Wortmarke "EI Studio", Tabs "Neues Briefing" und "Feed"
- Tab Neues Briefing: Preset-Chips, Pflichtfelder (Thema, Hauptaktie Name plus ISIN, Artikeltyp als drei Karten, Schwerpunkt), Optionalblock eingeklappt (Redakteurskurs zuerst, mit Hinweis-Chip "Kurs mitgeben = Artikel kann direkt BEREIT werden"), Submit-Button "Artikel erstellen lassen"
- Nach Submit: Lauf-Modus-Karte mit RunID (kopierbar), Stepper Angenommen / In Arbeit / Fertig, Polling des Feeds alle 20 Sekunden bis die RunID auftaucht, dann Status-Badge plus Kicker- und Title-Vorschau
- Tab Feed: vier Stat-Karten, darunter Liste mit Status-Badge, Hauptaktie, Title, Zeit; Klick öffnet Drawer mit allen Feldern des FeedItem
- Duplikat-Hinweis im Formular, wenn zur eingegebenen ISIN heute bereits ein Feed-Item existiert

## Sprach- und Stilregeln (hart, gelten für alle UI-Texte, Kommentare in Code auf Deutsch oder Englisch, UI immer Deutsch)

1. Alle sichtbaren Texte auf Deutsch, mit echten Umlauten (ä, ö, ü, ß). Niemals ae, oe, ue als Ersatz.
2. Keine Gedankenstriche in UI-Texten. Kommas, Doppelpunkte oder Klammern verwenden.
3. Status-Wörter exakt so anzeigen: BEREIT, REVIEW NÖTIG (Anzeige) für den Wert REVIEW_NOETIG, FEHLER.
4. Ton: knapp, klar, kollegial. Keine Ausrufezeichen-Kaskaden, kein Marketing-Sprech.
5. Fehlertexte sagen, was zu tun ist ("n8n ist gerade nicht erreichbar, in einer Minute erneut versuchen").

## Definition of Done je Phase

- Jede Phase endet mit `npm run build` ohne Fehler und ohne TypeScript-Errors.
- Keine toten Imports, keine console.logs im Commit.
- Alles funktioniert mit `USE_MOCK=1` ohne Netzwerkzugriff auf n8n.
- Komponenten unter `components/`, Routen unter `app/api/`, Typen und Schemas unter `lib/schema.ts`, Mocks unter `lib/mock.ts`.

## Was verboten ist

- Keine zusätzlichen Abhängigkeiten ohne Notwendigkeit (kein Redux, kein axios, kein moment.js; fetch und date-fns-freie Eigenlogik reichen).
- Keine Credentials, Tokens oder n8n-URLs im Client-Code oder im Repo.
- Kein Publish-, Freigabe- oder Edit-Feature für Artikel.
- Keine Änderungen am API-Vertrag ohne ausdrückliche Anweisung.

## Projektstand (Stand 22. Juli 2026)

Erledigt (Phasen 0 bis 2):

- Phase 0: Next.js 15.5.21 (App Router, TypeScript strict, Turbopack), Tailwind v4, shadcn/ui (CLI 4.x, Preset radix-nova) mit card, button, input, textarea, badge, tabs, sheet, tooltip; zod v4, react-hook-form, @hookform/resolvers 5.x, swr, framer-motion, sonner. `.env.example` committet, `.env.local` mit `USE_MOCK=1` lokal.
- Phase 1: Design-Tokens komplett in `app/globals.css`, Inter via next/font (Variable `--font-sans`), Dark Mode als Default (`<html lang="de" class="dark">`), Header mit Wortmarke und Tabs in `components/studio-shell.tsx`.
- Phase 2: Briefing-Formular komplett (`components/briefing/`), Preset-Chips, Artikeltyp-Karten, ISIN-Live-Validierung mit grünem Haken, Zeichenzähler, Optionalblock "Mehr Optionen", Ziellänge-Segmented-Control; `POST /api/briefing` als Mock (zod-Validierung, RunID via `lib/runid.ts`). Feed-Tab zeigt einen Platzhalter.

`npm run build` läuft fehlerfrei. Die manuelle Verifikation (curl-Tests, UI-Durchlauf, Sprachregel-Greps) steht noch aus und ist der erste Schritt der nächsten Session.

Offen: Phase 3 (beide Routen mit USE_MOCK-Zweig und n8n-Proxy, `lib/mock.ts`, `GET /api/feed`), Phase 4 (Feed und Stats), Phase 5 (Lauf-Modus), Phase 6 (Feinschliff), Phase 7 (n8n-Anschluss).

### Technische Notizen für Folge-Sessions

- Tailwind v4: kein tailwind.config, alle Tokens in `app/globals.css` (`:root` und `.dark` identisch, Mapping im `@theme inline`-Block). Status-Farben sind als Utilities verfügbar: `bg-status-bereit`, `text-status-review`, `bg-status-fehler`, auch mit Opacity wie `bg-status-bereit/10`.
- shadcn CLI 4.x: Komponenten importieren Radix aus dem Monopaket `radix-ui`. Neue Komponenten mit `npx shadcn@latest add <name> -y` holen.
- sonner direkt verwenden (Toaster liegt in `app/layout.tsx`, theme="dark"). Niemals `shadcn add sonner`, das zieht next-themes als unnötige Dependency.
- zod v4 plus resolvers 5.x: Formulare mit `useForm<BriefingInput, unknown, BriefingDaten>` typisieren (`z.input` vs `z.output` wegen `.optional().default()`), niemals `z.infer` für Feldwerte. Typen liegen in `lib/schema.ts`.
- Tabs: beide TabsContent haben `forceMount` plus `data-[state=inactive]:hidden`, denn Radix blendet forceMounted Content nicht selbst aus. So überlebt der Formular-State den Tab-Wechsel (wichtig für Phase 5).
- RunID: `erzeugeRunId(isin)` in `lib/runid.ts`, Intl.DateTimeFormat mit timeZone Europe/Berlin und hourCycle h23, nur serverseitig verwenden.
- `.gitignore`: `.env*` ist ignoriert, `.env.example` per `!.env.example` freigestellt. Der n8n-Workflow-Export (JSON im Root) bleibt bewusst unversioniert.
- Feld-Fehlertexte: das zod-Schema bleibt exakt wie im API-Vertrag, deutsche Fehlertexte für Felder ohne eigene Schema-Message (schwerpunkt, hauptName, artikeltyp) werden im Formular selbst gerendert.
