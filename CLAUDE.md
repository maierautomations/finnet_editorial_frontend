# CLAUDE.md, Projektkontext Finnet Editorial AI

Diese Datei ist der verbindliche Kontext für alle KI-gestützten Code-Änderungen in diesem Repo. Vor jeder Aufgabe vollständig lesen und befolgen.

## Was dieses Projekt ist

Finnet Editorial AI (sichtbare Wortmarke, früher "EI Studio"; interne Namen wie EI_TOKEN, Header X-EI-Token, Vercel-Projekt und Repo tragen weiter das alte Kürzel) ist ein internes Frontend für Redakteure von finanzen.net. Es schickt Artikel-Briefings an einen bestehenden n8n-Workflow (der recherchiert, schreibt, prüft und den Artikel in ein Review-Google-Sheet und als Draft ins CMS legt) und zeigt einen Feed der erzeugten Artikel samt Status und Stats. Das Frontend ist reine Eingabe- und Anzeigefläche. Es hält keine eigenen Daten, publiziert nichts und bearbeitet keine Artikel; einzige Rückschreibe-Aktion ist der Online-Vermerk (Redakteur hakt ab, dass ein Beitrag im CMS online ist, gespeichert in der Sheet-Spalte Online via n8n).

## Stack (nicht diskutieren, so bauen)

- Next.js 15, App Router, TypeScript strict
- Tailwind CSS, shadcn/ui, Framer Motion (sparsam), SWR, react-hook-form, zod, sonner
- Keine Datenbank, kein Auth-Provider, keine Websockets, kein zusätzliches State-Management (React-State und SWR reichen)

## Architektur-Regeln (hart)

1. Der Browser spricht nur mit eigenen Route Handlern (`/api/briefing`, `/api/feed`, `/api/online`). Niemals direkt mit n8n.
2. `EI_TOKEN`, `N8N_BRIEFING_URL`, `N8N_FEED_URL`, `N8N_ONLINE_URL` existieren nur serverseitig (`process.env`), tauchen nie im Client-Bundle auf.
3. `USE_MOCK=1` schaltet alle Routen auf Mock-Daten aus `lib/mock.ts`. Alle Features müssen vollständig mit Mocks funktionieren.
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
  textHtml: string; // Artikel-HTML aus der Sheet-Spalte TextHTML (GroundStyle: p, ul/li, h2/h3, a)
  online: boolean; // Redakteur hat abgehakt, dass der Beitrag im CMS online ist (Sheet-Spalte Online)
};
```

Abgeleitete Werte (im Frontend berechnen): Laufzeit in Sekunden = `erstelltAm` minus Zeitstempel aus der RunID (die ersten 15 Zeichen, lokale Zeit Europe/Berlin), plausibel nur zwischen 30 und 21600 Sekunden (darunter Alt-Zeilen mit ErstelltAm gleich Startzeit, darüber Ausreißer; beides ergibt null und fällt aus dem Durchschnitt). Stats: gesamt, heute, diese Woche, Anzahl je Status, Durchschnittslaufzeit.

`lib/mock.ts` liefert mindestens 15 realistische deutsche Finanz-Beispiele (Rheinmetall, NVIDIA, AMD, Siemens Energy, Commerzbank und so weiter) mit allen drei Status, plausiblen Zeiten der letzten sieben Tage und gefüllten Feldern inklusive Markern wie `[Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit]`, GroundStyle-`textHtml` für alle Nicht-FEHLER-Einträge und einigen bereits abgehakten (`online: true`) Einträgen.

### POST /api/online

Body: `{ runId: string, online: boolean }` (zod: `onlineAnfrageSchema`). Antwort: `{ ok: true }` oder `{ ok: false, fehler: string }`. Bei `USE_MOCK=1` schreibt die Route in eine Mock-Registry, sonst Proxy zum n8n-Webhook `N8N_ONLINE_URL` (Header `X-EI-Token`), der im Review-Sheet die Spalte `Online` der Zeile mit passender RunID auf TRUE/FALSE setzt und erst nach dem Update antwortet.

## Design-Tokens

- Hintergrund `#0B1220`, Karten `#111A2E`, Ränder `#1E2A44`, Text `#E6EBF2`, Sekundärtext `#8A96AC`
- Akzent `#2F6FEB`
- Status: BEREIT `#22C55E`, REVIEW_NOETIG `#F59E0B`, FEHLER `#EF4444`
- Font Inter, Zahlen mit `tabular-nums`
- Dark Mode ist Default. Abgerundete Karten (rounded-2xl), ruhige Schatten, viel Weißraum, eine Akzentfarbe. Animationen dezent: Fade-in für Karten, Puls für den Lauf-Stepper, kurzer Erfolgsmoment bei Status Fertig.

## UI-Struktur

- Header: Wortmarke "Finnet Editorial AI", Tabs "Neues Briefing" und "Feed"
- Tab Neues Briefing: Preset-Chips, Pflichtfelder (Thema, Hauptaktie Name plus ISIN, Artikeltyp als drei Karten, Schwerpunkt), Optionalblock eingeklappt (Redakteurskurs zuerst, mit Hinweis-Chip "Kurs mitgeben = Artikel kann direkt BEREIT werden"), Submit-Button "Artikel erstellen lassen"
- Nach Submit: Lauf-Modus-Karte mit RunID (kopierbar), Stepper Angenommen / In Arbeit / Fertig, Polling des Feeds alle 20 Sekunden bis die RunID auftaucht, dann Status-Badge plus Kicker- und Title-Vorschau
- Tab Feed: vier Stat-Karten (Status-Verteilung inklusive ONLINE-Reihe), darunter Filterzeile (Status-Chips Alle / BEREIT / REVIEW NÖTIG / FEHLER / ONLINE, Toggle "Noch nicht online" als Arbeitsvorrat-Sicht, Textsuche über Aktie und Titel), darunter Liste mit Status-Badge (abgehakte Beiträge als ONLINE in Primärblau), Hauptaktie, Title und relativer Zeit ("vor 5 min", älter als ein Tag als Datum); Klick öffnet Drawer mit allen Feldern des FeedItem, Online-Toggle ("Als online markieren"), Kopier-Buttons für Kicker/Titel/SEO-Titel/Teaser und aufklappbarem Bereich "Artikel anzeigen" (gerendertes textHtml). Die Chips BEREIT und REVIEW NÖTIG zeigen nur noch nicht abgehakte Beiträge (Filter auf Anzeige-Status)
- Duplikat-Hinweis im Formular, wenn zur eingegebenen ISIN heute bereits ein Feed-Item existiert
- Fertig-Toast: wird der Lauf fertig, während der Feed-Tab aktiv ist, erscheint ein sonner-Toast (im Briefing-Tab übernimmt der Erfolgsmoment des Lauf-Modus)

## Sprach- und Stilregeln (hart, gelten für alle UI-Texte, Kommentare in Code auf Deutsch oder Englisch, UI immer Deutsch)

1. Alle sichtbaren Texte auf Deutsch, mit echten Umlauten (ä, ö, ü, ß). Niemals ae, oe, ue als Ersatz.
2. Keine Gedankenstriche in UI-Texten. Kommas, Doppelpunkte oder Klammern verwenden.
3. Status-Wörter exakt so anzeigen: BEREIT, REVIEW NÖTIG (Anzeige) für den Wert REVIEW_NOETIG, FEHLER. Abgehakte Beiträge zeigen ONLINE (abgeleiteter Anzeige-Status via `anzeigeStatus()`, kein Sheet-Wert).
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
- Kein Publish-, Freigabe- oder Edit-Feature für Artikel. Der Online-Vermerk (`/api/online`) ist bewusst nur ein Abhaken fürs Tracking im Review-Sheet, kein Publish.
- Keine Änderungen am API-Vertrag ohne ausdrückliche Anweisung.

## Projektstand (Stand 23. Juli 2026)

Erledigt (Phasen 0 bis 6):

- Phase 0: Next.js 15.5.21 (App Router, TypeScript strict, Turbopack), Tailwind v4, shadcn/ui (CLI 4.x, Preset radix-nova) mit card, button, input, textarea, badge, tabs, sheet, tooltip; zod v4, react-hook-form, @hookform/resolvers 5.x, swr, framer-motion, sonner. `.env.example` committet, `.env.local` mit `USE_MOCK=1` lokal.
- Phase 1: Design-Tokens komplett in `app/globals.css`, Inter via next/font (Variable `--font-sans`), Dark Mode als Default (`<html lang="de" class="dark">`), Header mit Wortmarke und Tabs in `components/studio-shell.tsx`.
- Phase 2: Briefing-Formular komplett (`components/briefing/`), Preset-Chips, Artikeltyp-Karten, ISIN-Live-Validierung mit grünem Haken, Zeichenzähler, Optionalblock "Mehr Optionen", Ziellänge-Segmented-Control; `POST /api/briefing` als Mock (zod-Validierung, RunID via `lib/runid.ts`).
- Verifikation Phasen 0 bis 2: curl-Tests auf `POST /api/briefing` (200 mit RunID im Format, 400 bei ungültiger ISIN und bei kaputtem JSON), Compliance-Greps (console.log, Gedankenstriche, NEXT_PUBLIC, Secret-Namen im Client-Bundle) alle sauber.
- Phase 3: `lib/mock.ts` (18 realistische Einträge, 11 BEREIT, 4 REVIEW_NOETIG, 3 FEHLER, Export `holeMockFeed()`), `GET /api/feed` mit USE_MOCK-Zweig und n8n-Proxy (Header X-EI-Token, Fehler-Mapping auf deutsche Sätze, neueste zuerst, Kappung auf 200, Einzelzeilen-Validierung via `feedItemSchema`), Proxy-Zweig in `POST /api/briefing`. Fehlerpfade getestet: 502 bei unerreichbarem n8n, 500 bei fehlender Konfiguration, Mock-Feed byte-stabil zwischen Requests.
- Phase 4: `lib/feed-berechnungen.ts` (Laufzeit aus RunID-Zeitstempel und erstelltAm, Stats, deutsche Zeitformatierung, alles Europe/Berlin), `components/feed/` mit `feed-ansicht.tsx` (SWR, Polling 30 s, Lade-, Fehler-, Leer-Zustand), `stat-karten.tsx` (Gesamt, Diese Woche mit "davon heute", Status-Verteilung als Mini-Balken, Durchschnittslaufzeit), `feed-liste.tsx`, `feed-drawer.tsx` (Sheet mit allen 13 Feldern), `status-badge.tsx`; `feed-platzhalter.tsx` gelöscht, `studio-shell.tsx` rendert `FeedAnsicht`.
- Phase 5: Lauf-Modus komplett. `components/briefing/lauf-modus.tsx` (RunID-Zeile mit Kopier-Button und sonner-Bestätigung, Stepper Angenommen / In Arbeit / Fertig mit Puls auf dem aktiven Schritt, Sekundenticker "Läuft seit", Ergebnisblock mit StatusBadge, Kicker- und Title-Vorschau, fehler-Text bei FEHLER, Erfolgsmoment bei BEREIT, Hinweis nach 10 Minuten ohne Ergebnis); Lauf-State (`runId`, `gestartetAm`) lebt in `briefing-formular.tsx` und überlebt Tab-Wechsel dank forceMount; Aktionen "Neues Briefing" (reset plus Fokus auf Thema) und "Zum Feed" (Prop `onZumFeed` von `studio-shell.tsx`). Mock-Registry in `lib/mock.ts`: `registriereMockLauf()` schreibt in ein globalThis-Singleton, `holeMockFeed()` mischt fertige Läufe dazu, Items erscheinen 60 bis 90 Sekunden nach Submit (deterministisch aus RunID-Hash), mit Redakteurskurs als BEREIT, ohne als REVIEW_NOETIG mit Kurs-Marker; Felder plausibel aus dem Briefing abgeleitet (Title und Teaser aus Thema, Kicker aus Schwerpunkt, SEO-Titel ohne Namensverdopplung).
- Phase 6: Duplikat-Hinweis am ISIN-Feld in `isin-feld.tsx` (heutige Feed-Items zur eingegebenen ISIN über den geteilten SWR-Cache und `berlinerDatum()`, dezenter Hinweis, kein Blocker). Feinschliff-Durchgang: Fade-in nur auf Ansichts-Ebene (nichts triggert bei Feed-Polls neu), aria-Attribute (Stepper als `ol` mit `aria-current="step"`, Live-Region `role="status"` im Lauf-Modus, `role="img"` am ISIN-Haken), Fokus-Management (nach Submit auf die Lauf-Modus-Überschrift, nach "Neues Briefing" auf das Thema-Feld), Textkonsistenz-Greps (Gedankenstriche, Ausrufezeichen, console.log) sauber.
- Verifikation Phasen 5 und 6: curl-Tests gegen den Dev-Server mit `USE_MOCK=1`: POST liefert RunID, das Item ist unmittelbar danach nicht im Feed, nach gut 90 Sekunden erscheint es mit korrektem Status (mit Kurs BEREIT und confidence hoch, ohne Kurs REVIEW_NOETIG mit Kurs-Platzhalter und restFindings), Laufzeit aus RunID und erstelltAm im 60-bis-90-Sekunden-Fenster.

- Phase 7, Frontend-Seite: n8n-Anschluss der Proxy-Routen fertig. `POST /api/briefing` erzeugt die RunID serverseitig, schickt den Payload mit den Formular-Labels des n8n-Form-Triggers (`baueIntakePayload()`, Ziellänge auf die Dropdown-Labels gemappt, weitereWerte von kommagetrennt auf zeilenweise) und akzeptiert die Respond-Immediately-Antwort (2xx ohne runId im Body zählt als angenommen, eine upstream-runId hätte Vorrang, explizites ok:false gilt als Ablehnung). `GET /api/feed` normalisiert die Review-Sheet-Spalten (`normalisiereZeile()`, RunID/ErstelltAm/... auf camelCase), unbekannte Spalten wie TextHTML und row_number entfernt `feedItemSchema`, Leer- und Kaputt-Zeilen werden still verworfen. 401/403 von n8n mappen beide Routen auf einen eigenen Satz (Token-Abgleich). `.env.local` enthält beide Production-URLs und den Token, `USE_MOCK=1` bleibt bis zum Live-Test der lokale Default.
- Verifikation Phase 7 (offline): Tests gegen einen lokalen n8n-Stub im Format der echten Sheet-Zeilen (PascalCase, Extra-Spalten, Leerzeile von "Always Output Data", kaputte Status-Zeile): Feed liefert genau die gültigen Zeilen camelCase-normalisiert und neueste zuerst, Intake-Payload kommt mit runId und exakt den Form-Labels bei n8n an, falscher Token ergibt auf beiden Routen die Token-Fehlermeldung, Mock-Gegentest unverändert grün.

`npm run build` und `npx eslint .` laufen fehlerfrei, alles funktioniert mit `USE_MOCK=1` ohne Netzwerkzugriff auf n8n.

- Phase 7, n8n-Seite und Live-Test: alle Workflow-Anpassungen umgesetzt (Intake-Webhook POST mit Header-Auth `X-EI-Token` und Respond Immediately, Unwrap-Code-Node vor "Briefing validieren", runId-Übernahme aus dem Payload via `g('runId')`, ErstelltAm als Abschlusszeit in Review- und Fehlerzeile, Feed-Workflow als Webhook → Get Rows → Code-Mapping → Respond mit All Incoming Items, beide Workflows aktiv). Live-End-to-End-Test am 23. Juli 2026 erfolgreich: Briefing über die App abgesendet, n8n-Lauf 5 Minuten 11 Sekunden, Item erschien mit der Frontend-RunID als REVIEW_NOETIG mit allen Feldern an Position 0. Lokal ist seither wieder `USE_MOCK=1` der Default (echte n8n-Läufe kosten Geld und Executions, auch das Feed-Polling zählt); für einen gezielten Live-Check kurz auf 0 stellen und danach zurück. Production auf Vercel hat sein eigenes `USE_MOCK=0` in den Env-Settings.
- Phase 8, Deployment: live auf Vercel. Projekt `finnet-editorial-frontend` (Team maierautomations-projects, Hobby-Plan), Production-URL https://finnet-editorial-frontend.vercel.app, fünf Env-Variablen in Production gesetzt (`USE_MOCK=0`, `EI_TOKEN`, `N8N_BRIEFING_URL`, `N8N_FEED_URL`, `STUDIO_PASSWORT`; der Passwort-Wert steht nur in den Vercel-Env-Settings, bewusst nicht im Repo). Smoke-Test verifiziert: 401 ohne Passwort auf Seite und API, 200 mit Passwort, echter Feed. Code liegt im privaten GitHub-Repo https://github.com/maierautomations/finnet_editorial_frontend.

- GitHub-Integration ist mit dem Vercel-Projekt verbunden: jeder Push auf main deployt automatisch nach Production. Manuelle Deploys gehen weiterhin per `npx vercel deploy --prod --token <Vercel-Token>`. Eine README.md für GitHub liegt im Root.

- Phase 9 (23. Juli 2026), Umbenennung, Laufzeit-Fix, Artikel-Anzeige, Online-Abhaken, Feed-Feinschliff:
  - Sichtbare Wortmarke überall "Finnet Editorial AI" (Header in `studio-shell.tsx`, Metadata in `app/layout.tsx`, Basic-Auth-Realm in `middleware.ts`, README, diese Datei). Interne Namen unverändert (EI_TOKEN, X-EI-Token, `__eiStudioMock...`-Registry-Keys, Vercel-Projekt, Repo, `ei-studio-konzept.md`).
  - Laufzeit-Untergrenze: `laufzeitSekunden()` liefert null unter 30 s (`MIN_LAUFZEIT_SEKUNDEN`), damit Alt-Zeilen mit ErstelltAm gleich Startzeit den Durchschnitt nicht mehr auf 0 drücken. Mock-Laufzeiten (min. 61 s) unberührt.
  - `textHtml` im FeedItem (API-Vertrag-Erweiterung, ausdrücklich freigegeben): `feedItemSchema` mit `.catch("")`, `SPALTEN_ZUORDNUNG` um `TextHTML: "textHtml"`, 16 Mock-Einträge mit GroundStyle-HTML (REVIEW_NOETIG-Einträge mit ihren Markern im Text, AMD/Palantir leer), Registry-Läufe erzeugen HTML via `baueMockArtikelHtml()`. Anzeige im Drawer als DIY-Collapsible "Artikel anzeigen" (`ArtikelInhalt`, `dangerouslySetInnerHTML`, HTML stammt aus dem eigenen Workflow), Typografie über `.artikel-inhalt` in `globals.css`.
  - Online-Abhaken sheet-basiert: `online: boolean` im FeedItem (Schema-preprocess akzeptiert TRUE/WAHR/JA/1-Strings und Booleans, `.catch(false)`), neue Route `POST /api/online` (Mock-Zweig `setzeMockOnline()` mit globalThis-Registry `__eiStudioMockOnline`, sonst Proxy zu `N8N_ONLINE_URL`, Fehler-Mapping wie Briefing-Route), Drawer-Toggle "Als online markieren" (bei FEHLER ausgeblendet, Pending-Guard), Online-Haken in der Liste, Filter-Chip "Noch nicht online". Optimistisches SWR-Update mit `rollbackOnError` und `revalidate: false` (der 30-s-Poll konvergiert). n8n-Seite noch offen, siehe unten.
  - Feed-Feinschliff (vom Nutzer per Auswahl beauftragt): Kopier-Buttons je Feld im Drawer (Kicker, Titel, SEO-Titel, Teaser, Muster aus dem Lauf-Modus), Filterzeile `feed-filter.tsx` (Status-Chips mit Farb-Punkt, Suche über Aktie und Titel, `KeineTreffer`-Zustand mit Reset), relative Zeitangaben in der Liste (`formatiereRelativeZeit()` plus Minuten-Ticker), Fertig-Toast bei aktivem Feed-Tab (Prop-Kette `feedTabAktiv` Shell zu Formular zu LaufModus, Ref-Guard je RunID, nutzt exportiertes `STATUS_ANZEIGE`), Politur (Tab-Fade über tw-animate-css nur beim data-state-Flip, Stat-Karten-Icons in Container, Mobile-Paddings, Stat-Grid ab 420 px zweispaltig, Drawer mobil volle Breite, RunID-Zeile mobil ausgeblendet). Bewusst nicht gebaut: "Erneut absenden bei FEHLER" (vom Nutzer abgewählt).
  - Der Drawer hält nur noch die RunID und leitet das Item live aus dem SWR-Cache ab (optimistische Updates wirken sofort in Drawer, Liste, Stats).
  - Verifikation: curl gegen Dev-Server mit USE_MOCK=1 (Feed liefert textHtml/online für alle 18 plus Registry-Items, Online-Toggle-Roundtrip inklusive 404 bei unbekannter RunID und 400 bei kaputtem Body, Registry-Lauf erscheint nach 60 bis 90 s mit generiertem HTML und Kurs-Marker), Compliance-Greps sauber, `npm run build` und `npx eslint .` fehlerfrei, keine Secret-Namen im Client-Bundle.

- Phase 9, Nachschärfung nach dem ersten Live-Test (23. Juli 2026): Abgehakte Beiträge zeigen jetzt überall den Anzeige-Status ONLINE statt BEREIT/REVIEW NÖTIG (`AnzeigeStatus = FeedStatus | "ONLINE"` in `lib/schema.ts`, Ableitung `anzeigeStatus()` in `lib/feed-berechnungen.ts`, Badge-Stil `bg-primary/10 text-primary`). Status-Filter um den ONLINE-Chip erweitert, BEREIT/REVIEW-NÖTIG-Chips filtern auf den Anzeige-Status (zeigen also nur nicht abgehakte), Toggle "Noch nicht online" bleibt bewusst als Arbeitsvorrat-Sicht. Status-Verteilung in den Stat-Karten hat eine ONLINE-Reihe, der separate Online-Haken in der Liste ist entfernt (das Badge übernimmt). Der Sheet-Status bleibt unangetastet, ONLINE ist reine Anzeige.
- Phase 9, n8n-Seite (23. Juli 2026): Online-Webhook in n8n gebaut (POST, Header-Auth X-EI-Token, Google Sheets Update Row mit RunID-Match, Respond nach dem Update) und die Produktions-URL als `N8N_ONLINE_URL` in `.env.local` sowie per Vercel-CLI in den Production-Envs gesetzt (jetzt sechs Variablen). Der Feed-Workflow liefert `textHtml` und `online` mit, live verifiziert über den lokalen Proxy: alle Sheet-Zeilen kommen mit gefülltem textHtml an. Lokal steht `USE_MOCK=0` für den Live-Test.

Offen: Live-Test des Online-Toggles durch die Redaktion. Voraussetzung dafür: die Spalte `Online` existiert als Header im Review-Sheet (Tab "Review"), sonst schlägt das Update im n8n-Webhook fehl und die App zeigt den gemappten Fehlersatz.

Offen (optional): eigene Domain, Übergabe an internes Hosting der finanzen.net-IT, Rotation von EI_TOKEN und Vercel-Token bei Bedarf.

### Technische Notizen für Folge-Sessions

- Tailwind v4: kein tailwind.config, alle Tokens in `app/globals.css` (`:root` und `.dark` identisch, Mapping im `@theme inline`-Block). Status-Farben sind als Utilities verfügbar: `bg-status-bereit`, `text-status-review`, `bg-status-fehler`, auch mit Opacity wie `bg-status-bereit/10`.
- shadcn CLI 4.x: Komponenten importieren Radix aus dem Monopaket `radix-ui`. Neue Komponenten mit `npx shadcn@latest add <name> -y` holen.
- sonner direkt verwenden (Toaster liegt in `app/layout.tsx`, theme="dark"). Niemals `shadcn add sonner`, das zieht next-themes als unnötige Dependency.
- zod v4 plus resolvers 5.x: Formulare mit `useForm<BriefingInput, unknown, BriefingDaten>` typisieren (`z.input` vs `z.output` wegen `.optional().default()`), niemals `z.infer` für Feldwerte. Typen liegen in `lib/schema.ts`.
- Tabs: beide TabsContent haben `forceMount` plus `data-[state=inactive]:hidden`, denn Radix blendet forceMounted Content nicht selbst aus. So überlebt der Formular-State den Tab-Wechsel (wichtig für Phase 5).
- RunID: `erzeugeRunId(isin)` in `lib/runid.ts`, Intl.DateTimeFormat mit timeZone Europe/Berlin und hourCycle h23, nur serverseitig verwenden.
- `.gitignore`: `.env*` ist ignoriert, `.env.example` per `!.env.example` freigestellt. Der n8n-Workflow-Export (JSON im Root) bleibt bewusst unversioniert.
- Feld-Fehlertexte: das zod-Schema bleibt exakt wie im API-Vertrag, deutsche Fehlertexte für Felder ohne eigene Schema-Message (schwerpunkt, hauptName, artikeltyp) werden im Formular selbst gerendert.
- Mock-Feed: `holeMockFeed()` in `lib/mock.ts` liefert flache Kopien, Zeiten und RunIDs entstehen einmal pro Serverprozess beim Modul-Load und bleiben zwischen Requests stabil. Die Phase-5-Registry eingereichter Briefings (Briefing-Route schreibt, Feed-Route liest) wegen HMR und getrennter Dev-Modulgraphen als globalThis-Singleton bauen.
- `lib/feed-berechnungen.ts` ist client-tauglich: Laufzeit über den Wanduhr-als-UTC-Trick (RunID-Präfix und erstelltAm beide als Berliner Wanduhr lesen, Differenz rechnen als wäre es UTC), Guard 30 bis 21600 Sekunden (Untergrenze wegen Alt-Zeilen mit ErstelltAm gleich Startzeit, Obergrenze gegen Ausreißer), sonst null und aus dem Durchschnitt ausgeschlossen. `berlinerDatum()` für den Duplikat-Hinweis in Phase 6 wiederverwenden. Der Intl-Formatter nutzt exakt dieselben Optionen wie `lib/runid.ts`. `formatiereRelativeZeit()` rechnet dagegen bewusst auf echten Instants (Date-Millis), die Wanduhr-Achse braucht nur der RunID-Vergleich.
- Zugriffsschutz: `middleware.ts` im Root schützt alles inklusive `/api` per Basic Auth mit einem gemeinsamen Passwort aus `STUDIO_PASSWORT` (kein Auth-Provider, keine Nutzerverwaltung, Nutzername egal). Ist die Variable nicht gesetzt, ist alles offen, lokal bleibt sie deshalb leer. Getestet: ohne Variable 200, mit Variable 401 ohne und mit falscher Kennung, 200 mit richtiger, statische Assets ausgenommen (matcher).
- Deployment-Vorsicht: das GitHub-Repo ist mit Vercel verbunden, jeder Push auf main triggert einen Production-Deploy. Committen ohne Push ist der sichere Zwischenstand; erst pushen, wenn Build und eslint grün sind.
- n8n-Vertrag (aus den Workflow-Exporten im Root abgeleitet): Der Artikel-Workflow liest die Eingabe über die deutschen Form-Labels ("Thema / Auslöser", "Hauptaktie ISIN", ...), prüft beim Artikeltyp nur den Anfangsbuchstaben und mappt die Ziellänge über die Dropdown-Labels. Das Review-Sheet hat 23 Spalten in PascalCase (RunID, ErstelltAm, Status, ..., TextHTML, ..., Fehler) plus die neue Spalte `Online`, Status-Werte exakt BEREIT / REVIEW_NOETIG / FEHLER, auch FEHLER-Zeilen tragen die RunID. Der Feed-Workflow ("My workflow") mappt in seiner Code-Node selbst schon auf camelCase (`runId: String(z.RunID ?? "")` usw.); `textHtml` und `online` müssen dort als Zeilen ergänzt sein, sonst fallen sie im Frontend auf ""/false. Übersetzungsstellen im Frontend: `baueIntakePayload()` in `app/api/briefing/route.ts`, `normalisiereZeile()` in `app/api/feed/route.ts` (fängt auch rohes PascalCase ab), `app/api/online/route.ts` (reicht `{ runId, online }` an `N8N_ONLINE_URL` durch); ändert sich der Workflow, nur dort anpassen.
- `StatusBadge` in `components/feed/status-badge.tsx` ist die geteilte Statusanzeige (Mapping REVIEW_NOETIG auf Anzeige "REVIEW NÖTIG", abgehakte Beiträge als ONLINE); das Record `STATUS_ANZEIGE` (Typ `AnzeigeStatus`) ist exportiert und die einzige Quelle für Status-Strings in Toasts, Filter-Chips und Stat-Reihen. Badges immer über `anzeigeStatus(item)` füttern, nur der Lauf-Modus nutzt `item.status` direkt (frische Läufe sind nie online).
- SWR: den Key "/api/feed" in Phase 5 wiederverwenden (geteilter Cache und `mutate`, abweichendes `refreshInterval` je Hook erlaubt, Lauf-Modus pollt alle 20 s). Das Feed-Polling läuft auch weiter, während der Briefing-Tab aktiv ist (SWR pausiert nur bei verstecktem Browser-Tab), das ist gewollt: Daten sind beim Tab-Wechsel warm.
- `GET /api/feed` hat `export const dynamic = "force-dynamic"` als expliziten Guard (seit Next 15 ohnehin Default für GET-Handler). Upstream-Zeilen validiert `feedItemSchema` (zod `.catch("")` für Textfelder), ungültige Zeilen werden still verworfen statt den Feed zu blockieren.
- `npm run build` niemals parallel zum laufenden Dev-Server ausführen, beide teilen sich `.next` und der Build zerschießt die Dev-Artefakte (danach Dev-Server neu starten).
- Artikel-Anzeige: `ArtikelInhalt` in `feed-drawer.tsx` rendert `textHtml` per `dangerouslySetInnerHTML` (einzige Stelle mit Fremd-HTML im DOM, Quelle ist der eigene Workflow, bewusst kein Sanitizer). Typografie über die Klasse `.artikel-inhalt` in `globals.css` (`@layer components`), kein @tailwindcss/typography. Bandbreite: `textHtml` kommt aktuell für alle Feed-Zeilen mit, bei wenigen Zeilen okay; wächst das Sheet spürbar, auf Detail-Abruf je RunID umstellen (eigene Route plus n8n-Webhook, bewusst noch nicht gebaut).
- Relativzeit in der Liste braucht den Minuten-Ticker in `feed-liste.tsx`: SWR hält bei unverändertem Feed die data-Referenz stabil (deep-equal), ohne eigenen Takt frieren die Angaben ein. Der Ticker animiert nichts (stabile Keys).
- Online-Toggle: optimistisches `mutate` auf den geteilten Key "/api/feed" mit `optimisticData`, `rollbackOnError: true` und `revalidate: false` (Sofort-Revalidate könnte den noch nicht durchgeschriebenen Sheet-Wert zurückliefern und den Haken flackern lassen; der 30-s-Poll konvergiert). Der Drawer hält deshalb nur die RunID und leitet das Item live aus dem Cache ab. Mock-Seite: `setzeMockOnline()` plus globalThis-Registry `__eiStudioMockOnline` in `lib/mock.ts`.
- Tab-Fade: `data-[state=active]:animate-in fade-in duration-200` auf beiden TabsContent (tw-animate-css). Triggert nur beim data-state-Flip des Tab-Wechsels; Feed-Polls re-rendern nur Kinder und starten die CSS-Animation nicht neu.
