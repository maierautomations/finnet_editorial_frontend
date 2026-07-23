# EI Studio

Internes Redaktions-Frontend für finanzen.net. Redakteure schicken Artikel-Briefings an einen bestehenden n8n-Workflow (der recherchiert, schreibt, prüft und den Entwurf in ein Review-Google-Sheet sowie als Draft ins CMS legt) und verfolgen die erzeugten Artikel in einem Feed mit Status und Statistiken. Das Frontend ist reine Eingabe- und Anzeigefläche: es hält keine eigenen Daten, publiziert nichts und bearbeitet keine Artikel.

## Funktionen

- Briefing-Formular mit Preset-Chips, ISIN-Live-Validierung, Artikeltyp-Karten und eingeklapptem Optionalblock
- Lauf-Modus nach dem Absenden: kopierbare RunID, Stepper (Angenommen, In Arbeit, Fertig), automatisches Polling bis der Artikel im Feed erscheint
- Feed mit Stat-Karten (gesamt, diese Woche, Status-Verteilung, Durchschnittslaufzeit), Liste und Detail-Drawer mit allen Feldern
- Duplikat-Hinweis, wenn zur eingegebenen ISIN heute schon ein Artikel existiert
- Vollständiger Mock-Betrieb ohne n8n über `USE_MOCK=1`

## Stack

Next.js 15 (App Router, TypeScript strict, Turbopack), Tailwind CSS v4, shadcn/ui, SWR, react-hook-form, zod, Framer Motion, sonner. Keine Datenbank, kein Auth-Provider, kein zusätzliches State-Management.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # USE_MOCK=1 reicht fuer den Start
npm run dev
```

Die App läuft dann auf http://localhost:3000 und funktioniert mit `USE_MOCK=1` komplett ohne Netzwerkzugriff auf n8n.

### Umgebungsvariablen

Alle Variablen sind rein serverseitig und tauchen nie im Client-Bundle auf. Werte stehen nur in `.env.local` (gitignored) beziehungsweise in den Vercel-Env-Settings.

| Variable | Zweck |
| --- | --- |
| `USE_MOCK` | `1` = beide API-Routen liefern Mock-Daten aus `lib/mock.ts`, `0` = Proxy zu n8n |
| `N8N_BRIEFING_URL` | n8n-Webhook für den Briefing-Intake |
| `N8N_FEED_URL` | n8n-Webhook, der die Zeilen des Review-Sheets liefert |
| `EI_TOKEN` | Auth-Token für beide n8n-Webhooks (Header `X-EI-Token`) |
| `STUDIO_PASSWORT` | Gemeinsames Redaktions-Passwort (Basic Auth via `middleware.ts`); nicht gesetzt = kein Schutz, lokal leer lassen |

## Architektur in Kürze

Der Browser spricht ausschließlich mit den eigenen Route Handlern `POST /api/briefing` und `GET /api/feed`, niemals direkt mit n8n. Die Routen validieren mit zod, mappen die Feldnamen auf den n8n-Vertrag, reichen Fehler nie roh durch (immer als verständlicher deutscher Satz) und normalisieren die Spalten des Review-Sheets auf das Frontend-Format. Quelle der Wahrheit ist der Feed, Statistiken berechnet das Frontend selbst aus den Feed-Items.

## Deployment

Läuft auf Vercel (Projekt `finnet-editorial-frontend`). Das Repo ist mit Vercel verbunden: **jeder Push auf `main` deployt automatisch nach Production.** Die fünf Umgebungsvariablen sind in den Vercel-Project-Settings gepflegt, der Zugriff ist über `STUDIO_PASSWORT` (Basic Auth) geschützt.

## Hinweis für KI-Sessions

`CLAUDE.md` im Root ist der verbindliche Projektkontext (API-Vertrag, Design-Tokens, Sprachregeln, Projektstand, n8n-Vertrag). Vor Änderungen vollständig lesen.
