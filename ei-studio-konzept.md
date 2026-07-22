# EI Studio, das Redaktions-Frontend für den CMS-Artikel-Workflow

Konzept und Bauplan zum Vibecoden mit Cursor / Claude Code. Stand: 22. Juli 2026.

## 1. Idee in einem Satz

Ein modernes, internes Mini-Dashboard, in dem Redakteure per Klick ein Artikel-Briefing abschicken, live zusehen, wie ihr Artikel durch die Automatisierung läuft, und auf einen Blick sehen, was die Strecke schon produziert hat.

Arbeitstitel: **EI Studio** (Editorial Intelligence Studio). Alternativen: Briefing-Desk, Artikel-Cockpit. Empfehlung: EI Studio, kurz, passt zum Projektnamen.

## 2. Architektur (bewusst simpel)

```
Browser (Next.js Frontend)
   |  POST /api/briefing        |  GET /api/feed
   v                            v
Next.js Route Handler (Proxy, Token serverseitig)
   |                            |
   v                            v
n8n Webhook "EI Briefing-Intake"   n8n Webhook "EI Feed"
   |                            |
   v                            v
Bestehender EI-Workflow         Review-Google-Sheet (Read)
(Briefing validieren -> ... -> Sheet + CMS)
```

Grundsätze:

- Das Frontend hat **keinen eigenen Datenbestand**. Quelle der Wahrheit bleibt das Review-Sheet, geschrieben vom bestehenden n8n-Workflow.
- Alle n8n-Aufrufe laufen über **Next.js Route Handler als Proxy**. Der Auth-Token (Header `X-EI-Token`) liegt nur in der Server-Env, nie im Browser. Damit ist auch CORS kein Thema.
- Der bestehende Form-Trigger bleibt parallel funktionsfähig (Fallback).
- Kein Publish aus dem Frontend. Freigabe bleibt im CMS beim Menschen, so wie es die Leitplanken vorsehen.

## 3. Die zwei Screens

### Screen 1: Neues Briefing (Startseite)

Ein fokussiertes Formular, das sich wie ein Werkzeug anfühlt, nicht wie ein Fragebogen.

**Pflichtblock (immer sichtbar):**

- **Thema / Auslöser**: großes Textfeld (Textarea, autogrow), Platzhalter: "Was ist passiert? Worüber soll der Artikel gehen?" Live-Zeichenzähler.
- **Hauptaktie**: zwei Felder nebeneinander, Name und ISIN. ISIN mit Live-Formatvalidierung (Regex `^[A-Z]{2}[A-Z0-9]{9}[0-9]$`), grüner Haken bei gültig. Optionaler Ausbau: Autocomplete aus einer statischen `aktien.json` (Name plus Slug aus der Top-1000-Liste, ISIN wo bekannt).
- **Artikeltyp**: drei anklickbare Karten statt Dropdown. A "Marktgeschehen", B "Analyse / Einordnung", C "Hintergrund". Je ein Satz Erklärung auf der Karte, ausgewählte Karte mit Akzentrahmen.
- **Schwerpunkt / Angle**: einzeiliges Feld, Platzhalter: "Aus welchem Blickwinkel?"

**Optionalblock (eingeklappt, "Mehr Optionen"):**

- **Redakteurskurs**: mit Hinweis-Chip daneben: "Kurs mitgeben = Artikel kann direkt BEREIT werden, sonst bleibt ein Platzhalter drin." Das ist der wichtigste optionale Wert, deshalb an erster Stelle.
- **IR-Domain** (z. B. rheinmetall.com): Hinweis "verbessert die Recherche".
- **Weitere Werte** (kommagetrennt), **Gelieferte Quellen-URLs** (eine pro Zeile), **Ziellänge** (kurz / standard / lang als Segmented Control, Default standard), **Autor**.
- Ressort, Category und News Rank tauchen im Frontend bewusst **nicht** auf. Leer heißt: der Workflow setzt die exakten CMS-Defaults. Ein Feld weniger, ein Fehler weniger.

**Presets (der Beeindrucken-Moment Nummer 1):**

Über dem Formular drei bis vier Chips, ein Klick füllt Typ und Angle vor:

- "Analysten-Update" (Typ A, Angle: "Neue Analystenstimmen und Kursziele einordnen")
- "Kursbewegung einordnen" (Typ A, Angle: "Auffällige Kursbewegung, Ursachen und Einordnung")
- "Deal / Übernahme einordnen" (Typ B, Angle: "Partnerschaft, Übernahme oder Großauftrag und die Folgen für den Wert")
- "Hintergrund / Story" (Typ C, Angle frei)

Wichtig: Die Chips starten keinen anderen Workflow und wählen keinen aus, sie befüllen nur Formularfelder. Anlässe, für die es bereits eigene Automaten gibt (etwa die Earnings-Vorschau), bekommen bewusst keinen Chip.

**Absenden:**

Button "Artikel erstellen lassen". Danach wechselt die Karte in den **Lauf-Modus**: RunID wird angezeigt (kopierbar), ein Stepper zeigt "Angenommen -> In Arbeit -> Fertig" mit dezenter Puls-Animation. Das Frontend pollt alle 20 Sekunden den Feed, bis die RunID auftaucht, und zeigt dann Status-Badge plus Kicker und Title als Vorschau, mit Hinweis "Details im Review-Sheet" (Link). Typische Laufzeit 3 bis 5 Minuten, das steht auch dran.

### Screen 2: Feed und Stats (zweiter Tab oder untere Hälfte)

**Stat-Karten (oben, vier Stück):**

- Artikel gesamt
- Diese Woche
- Status-Verteilung als Mini-Balken (BEREIT grün, REVIEW_NOETIG amber, FEHLER rot)
- Durchschnittliche Laufzeit (berechenbar: `ErstelltAm` minus Zeitstempel aus der RunID, das Frontend rechnet das selbst)

Optionale fünfte Karte als Management-Gimmick: "Geschätzt gesparte Redaktionszeit", Artikelzahl mal konfigurierbarem Faktor (Default 45 Minuten). Ein ehrlicher Schätzwert, klar als Schätzung gekennzeichnet.

**Artikel-Feed (Liste):**

Jede Zeile: Status-Badge, Hauptaktie, Title, Zeitpunkt, RunID kurz. Klick öffnet einen Drawer rechts mit Kicker, Title, SEO Title, Teaser, offenen Markern und Rest-Findings (das sind genau die Review-Hinweise aus dem Sheet), Confidence, plus Links: "Review-Sheet öffnen" und bei hochgeladenen Artikeln der Hinweis auf die CMS-GUID (EICMS plus ISIN plus Zeit).

Kleines, nützliches Detail: **Duplikat-Hinweis** im Formular, wenn zur eingegebenen ISIN heute schon ein Artikel im Feed existiert ("Heute lief bereits ein Artikel zu dieser Aktie").

## 4. Design-Richtung

- **Look**: cleanes, dunkles Dashboard (Dark Mode als Default, Light optional). Finanz-Ästhetik: viel Ruhe, eine Akzentfarbe, klare Typo.
- **Farben**: Hintergrund `#0B1220`, Karten `#111A2E`, Text `#E6EBF2`, Akzent finanzen-Blau `#2F6FEB`, Status: `#22C55E` (BEREIT), `#F59E0B` (REVIEW_NOETIG), `#EF4444` (FEHLER).
- **Typo**: Inter (oder Geist), Zahlen tabellarisch (`font-variant-numeric: tabular-nums`) für die Stat-Karten.
- **Bewegung**: Framer Motion sparsam. Karten faden sanft ein, der Lauf-Stepper pulsiert, beim Statuswechsel auf Fertig ein kurzer, dezenter Erfolgsmoment. Keine Konfetti-Orgien.
- **Komponenten**: shadcn/ui (Card, Button, Input, Textarea, Badge, Drawer/Sheet, Tabs, Tooltip, Toast via sonner).

## 5. Tech-Stack

- **Next.js 15** (App Router, TypeScript), **Tailwind CSS**, **shadcn/ui**, **Framer Motion**, **SWR** (Feed-Polling), **react-hook-form + zod** (Formular und Validierung), **sonner** (Toasts).
- Kein State-Backend, keine Datenbank, kein Auth-Provider. Interner Betrieb, Zugriffsschutz über Netz/VPN plus dem serverseitigen Token Richtung n8n. Wenn später nötig: Basic Auth via Middleware, eine Datei.

## 6. API-Verträge (exakt so bauen)

### POST /api/briefing (Frontend-intern, proxied zu n8n)

Request-Body (JSON):

```json
{
  "thema": "string, Pflicht",
  "artikeltyp": "A | B | C, Pflicht",
  "schwerpunkt": "string, Pflicht",
  "hauptName": "string, Pflicht",
  "hauptIsin": "string, Pflicht, Format ^[A-Z]{2}[A-Z0-9]{9}[0-9]$",
  "redakteurskurs": "string, optional",
  "irDomain": "string, optional",
  "weitereWerte": "string, optional, kommagetrennt",
  "quellenUrls": "string, optional, eine URL pro Zeile",
  "ziellaenge": "kurz | standard | lang, optional, Default standard",
  "autor": "string, optional"
}
```

Response: `{ "ok": true, "runId": "20260722-141530-DE0007030009" }` oder `{ "ok": false, "fehler": "..." }`.

Der Route Handler validiert mit zod, hängt den Header `X-EI-Token` (aus `process.env.EI_TOKEN`) an und postet an `process.env.N8N_BRIEFING_URL`.

### GET /api/feed (Frontend-intern, proxied zu n8n)

Response:

```json
{
  "items": [
    {
      "runId": "string",
      "erstelltAm": "ISO-Zeit",
      "status": "BEREIT | REVIEW_NOETIG | FEHLER",
      "hauptaktie": "string",
      "isin": "string",
      "kicker": "string",
      "title": "string",
      "seoTitle": "string",
      "teaser": "string",
      "offeneMarker": "string",
      "restFindings": "string",
      "confidence": "string",
      "fehler": "string"
    }
  ]
}
```

Neueste zuerst, maximal 200 Einträge. Alle Stats rechnet das Frontend aus `items`, n8n liefert nur die Rohliste.

### n8n-Seite (bauen wir nach dem Frontend gemeinsam, zwei kleine Ergänzungen)

1. **EI Briefing-Intake**: Webhook (POST, Token-Check im Code-Node, 401 bei falschem Token), Mapping der camelCase-Keys auf die bestehenden Formular-Feldnamen, RunID-Vergabe, sofortige Antwort per Respond-to-Webhook, dann Einmündung in den bestehenden Ablauf ab "Briefing validieren". Der Form-Trigger bleibt parallel bestehen.
2. **EI Feed**: Webhook (GET, Token-Check), Google Sheets Read auf das Review-Sheet (letzte 200 Zeilen), Code-Node mappt die Spalten auf das Feed-Schema, Respond-to-Webhook mit JSON.

Bis diese zwei Endpoints stehen, läuft das Frontend gegen Mock-Daten (`USE_MOCK=1`).

## 7. Was bewusst NICHT rein kommt (Scope-Schutz)

- Kein Publish-Button, keine Artikel-Bearbeitung im Frontend. Review und Freigabe bleiben im Sheet und CMS.
- Kein Nutzer-Login-System im MVP (interner Betrieb, Token liegt serverseitig).
- Keine Live-Vorschau des kompletten Artikel-HTML im MVP (Stufe 2, der Feed liefert die Felder dafür schon mit, wenn TextHTML später ergänzt wird).
- Keine eigene Datenhaltung, kein Caching-Layer, keine Websockets. Polling reicht.

## 8. Step-by-Step-Plan (Vibecoding-Phasen)

Jede Phase ist ein eigener, abgeschlossener Prompt-Zyklus in Cursor / Claude Code. Erst wenn die Definition of Done erfüllt ist, kommt die nächste Phase.

**Phase 0, Setup (15 Min), ERLEDIGT 22.07.2026:** Projekt angelegt (Next.js 15.5.21 mit TypeScript, Tailwind v4, App Router, Turbopack), shadcn/ui initialisiert (CLI 4.x, Preset radix-nova), framer-motion, swr, react-hook-form, zod v4, sonner installiert. `.env.example` committet, `.env.local` mit `USE_MOCK=1`.

**Phase 1, Shell und Design-System (30 Min), ERLEDIGT 22.07.2026:** Layout mit Header (Wortmarke "EI Studio", Tabs "Neues Briefing" / "Feed" in `components/studio-shell.tsx`), Farb-Tokens in `app/globals.css`, Inter geladen, Dark Mode als Default.

**Phase 2, Briefing-Formular (60 Min), ERLEDIGT 22.07.2026 (Verifikation offen):** Formular mit react-hook-form und zod nach dem Schema aus Abschnitt 6, Artikeltyp-Karten, Preset-Chips, Optionalblock einklappbar, ISIN-Live-Validierung, Zeichenzähler, Ziellänge-Segmented-Control. Submit ruft `/api/briefing` (Mock-Route mit zod-Validierung und RunID). `npm run build` läuft fehlerfrei, der manuelle DoD-Durchlauf (curl, UI, Greps) steht noch aus.

**Phase 3, API-Routen (30 Min):** Route Handler `/api/briefing` und `/api/feed` mit zod-Validierung, Proxy-Logik, Token-Header, sauberem Fehler-Mapping und Mock-Zweig (`USE_MOCK=1` liefert Beispieldaten aus `lib/mock.ts`, mindestens 15 realistische Feed-Einträge mit allen drei Status). Done: Beide Routen liefern Mock-JSON nach Vertrag.

**Phase 4, Feed und Stats (60 Min):** Feed-Tab mit SWR (Polling 30 Sekunden), vier Stat-Karten (Berechnung im Frontend, Laufzeit aus RunID-Zeitstempel vs. erstelltAm), Artikel-Liste mit Status-Badges, Detail-Drawer. Done: Mit Mock-Daten sehen Liste, Karten und Drawer fertig aus.

**Phase 5, Lauf-Modus (45 Min):** Nach Submit wechselt die Briefing-Karte in den Stepper (Angenommen / In Arbeit / Fertig), Polling auf die eigene RunID im Feed, bei Treffer Statuswechsel mit Badge und Vorschau (Kicker, Title), Duplikat-Hinweis im Formular bei gleicher ISIN am selben Tag. Done: Kompletter Ablauf mit Mock durchspielbar.

**Phase 6, Feinschliff (45 Min):** Empty States, Fehlerzustände (n8n nicht erreichbar), Responsive bis Tablet, Framer-Motion-Feinheiten, Favicon, Titel. Done: Fühlt sich fertig an, `npm run build` läuft fehlerfrei.

**Phase 7, Anschluss an n8n (mit Claude im n8n-Chat):** Die zwei Webhook-Workflows aus Abschnitt 6 bauen, `USE_MOCK=0`, Ende-zu-Ende-Test mit einem echten Briefing.

## 9. Folge-Prompt für das nächste Fenster (Verifikation plus Phase 3 und 4, copy-paste)

```
Lies zuerst die Datei CLAUDE.md im Repo-Root vollständig, sie ist der verbindliche Projektkontext. Der Abschnitt "Projektstand" beschreibt, was schon gebaut ist (Phasen 0 bis 2), die "Technischen Notizen" erklären die wichtigsten Implementierungsdetails (Tailwind v4 Tokens, zod-Typisierung mit z.input/z.output, Tabs mit forceMount).

Aufgabe für diese Session, in dieser Reihenfolge:

1. Verifikation der Phasen 0 bis 2 (Definition of Done, steht noch aus):
   - npm run build ohne Fehler.
   - Dev-Server mit USE_MOCK=1 starten. curl-Test auf POST /api/briefing: gültiger Body liefert { ok: true, runId } im Format JJJJMMTT-HHMMSS-ISIN, ungültiger Body liefert Status 400 mit { ok: false, fehler }.
   - UI-Durchlauf: Pflichtfeld-Fehler auf Deutsch, Zeichenzähler zählt live, ISIN DE0007030009 zeigt grünen Haken, DE123 zeigt "Keine gültige ISIN", Preset-Chips setzen nur Artikeltyp und Schwerpunkt, Optionalblock klappt auf, Ziellänge default standard, Formular-State überlebt den Tab-Wechsel, Erfolgs-Toast mit RunID.
   - Greps: kein console.log in app/components/lib, keine Gedankenstriche in UI-Texten, EI_TOKEN und N8N_ tauchen nur serverseitig auf.
   Gefundene Probleme direkt beheben.

2. Phase 3, API-Routen komplett:
   - lib/mock.ts: mindestens 15 realistische deutsche Finanz-Beispiele (Rheinmetall, NVIDIA, AMD, Siemens Energy, Commerzbank und so weiter) mit allen drei Status, plausiblen Zeiten der letzten sieben Tage, gefüllten Feldern inklusive Markern wie [Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit]. RunIds konsistent zum Format, erstelltAm 3 bis 5 Minuten nach dem RunID-Zeitstempel.
   - GET /api/feed: bei USE_MOCK=1 Mock-Daten (neueste zuerst, maximal 200), sonst Proxy zu N8N_FEED_URL mit Header X-EI-Token aus EI_TOKEN. Fehler als { ok: false, fehler: "verständlicher deutscher Satz" }, nie roh durchreichen.
   - POST /api/briefing: USE_MOCK-Zweig (bestehende Mock-Logik) plus Proxy-Zweig zu N8N_BRIEFING_URL mit X-EI-Token, gleiches Fehler-Mapping.

3. Phase 4, Feed und Stats:
   - Feed-Tab mit SWR (Polling 30 Sekunden): vier Stat-Karten (gesamt, diese Woche, Status-Verteilung als Mini-Balken, Durchschnittslaufzeit aus erstelltAm minus RunID-Zeitstempel, Europe/Berlin), alles im Frontend aus den Items berechnet.
   - Artikel-Liste: Status-Badge (BEREIT grün, REVIEW NÖTIG amber, FEHLER rot, Anzeige exakt so), Hauptaktie, Title, Zeit, RunID kurz. Klick öffnet Sheet-Drawer mit allen Feldern des FeedItem.
   - Der Feed-Platzhalter in components/feed/feed-platzhalter.tsx wird durch die echte Feed-Ansicht ersetzt.

Am Ende: npm run build fehlerfrei, alles funktioniert mit USE_MOCK=1 ohne Netzwerkzugriff, keine console.logs. Halte dich strikt an die Sprach- und Stilregeln aus CLAUDE.md (deutsche UI-Texte, echte Umlaute, keine Gedankenstriche). Danach Phase 5 (Lauf-Modus) und Phase 6 (Feinschliff) in einem weiteren Fenster.
```

## 10. Danach

Nach Phase 6 melden, dann bauen wir gemeinsam die zwei n8n-Endpoints (Intake und Feed), stellen `USE_MOCK=0` und machen den Ende-zu-Ende-Test. Der bestehende Form-Trigger bleibt als Fallback aktiv.
