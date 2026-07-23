import type { AnzeigeStatus, FeedItem } from "@/lib/schema";

// Abgeleitete Werte aus Feed-Items, komplett client-tauglich (keine Server-Imports).
// Laufzeit-Trick: RunID-Praefix und erstelltAm werden beide als Berliner Wanduhr
// gelesen und wie UTC verrechnet, so entfaellt die Wanduhr-zu-Instant-Konvertierung.

export type FeedStats = {
  gesamt: number;
  heute: number;
  dieseWoche: number;
  jeStatus: Record<AnzeigeStatus, number>;
  durchschnittslaufzeitSekunden: number | null;
};

// Anzeige-Status eines Items: abgehakt (online) verdraengt BEREIT und
// REVIEW_NOETIG in der Anzeige, ein FEHLER-Lauf kann nicht online sein.
export function anzeigeStatus(item: Pick<FeedItem, "status" | "online">): AnzeigeStatus {
  return item.online && item.status !== "FEHLER" ? "ONLINE" : item.status;
}

// Exakt dieselben Optionen wie in lib/runid.ts, sonst laufen RunID-Wanduhr und
// erstelltAm-Wanduhr formal auseinander. Einmal bauen, Konstruktion ist teuer.
const berlinFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function berlinerZeitTeile(zeitpunkt: Date): Record<string, string> {
  const teile: Record<string, string> = {};
  for (const p of berlinFormat.formatToParts(zeitpunkt)) {
    teile[p.type] = p.value;
  }
  return teile;
}

// "JJJJ-MM-TT" fuer String-Vergleiche, Phase 5 nutzt das auch fuer den Duplikat-Hinweis
export function berlinerDatum(zeitpunkt: Date): string {
  const t = berlinerZeitTeile(zeitpunkt);
  return `${t.year}-${t.month}-${t.day}`;
}

const RUNID_ZEIT = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-/;

// Mehr als 6 Stunden gilt als nicht verwertbar, negativ ebenso (etwa bei Laeufen
// ueber die Sommerzeit-Umstellung, akzeptiertes Restrisiko zwei Naechte pro Jahr).
const MAX_LAUFZEIT_SEKUNDEN = 21_600;

// Unter 30 Sekunden gilt als unplausibel: ein echter Lauf braucht Minuten. Alt-Zeilen
// im Review-Sheet von vor dem ErstelltAm-Fix im n8n-Workflow tragen die Startzeit als
// ErstelltAm (Laufzeit 0 s) und wuerden den Durchschnitt druecken.
const MIN_LAUFZEIT_SEKUNDEN = 30;

export function laufzeitSekunden(runId: string, erstelltAm: string): number | null {
  const treffer = RUNID_ZEIT.exec(runId);
  if (!treffer) return null;
  const ende = new Date(erstelltAm);
  if (Number.isNaN(ende.getTime())) return null;

  const startWand = Date.UTC(
    +treffer[1],
    +treffer[2] - 1,
    +treffer[3],
    +treffer[4],
    +treffer[5],
    +treffer[6]
  );
  const t = berlinerZeitTeile(ende);
  const endeWand = Date.UTC(+t.year, +t.month - 1, +t.day, +t.hour, +t.minute, +t.second);

  const sekunden = Math.round((endeWand - startWand) / 1000);
  if (sekunden < MIN_LAUFZEIT_SEKUNDEN || sekunden > MAX_LAUFZEIT_SEKUNDEN) return null;
  return sekunden;
}

// Wochenstart Montag (deutsche Konvention), gerechnet auf der UTC-Achse der
// Berliner Wandtage: Tagesarithmetik in UTC kennt keine DST-Spruenge.
function berlinerWochenstart(jetzt: Date): string {
  const t = berlinerZeitTeile(jetzt);
  const heuteUtc = Date.UTC(+t.year, +t.month - 1, +t.day);
  const abstandZuMontag = (new Date(heuteUtc).getUTCDay() + 6) % 7; // getUTCDay: 0 = Sonntag
  const montag = new Date(heuteUtc - abstandZuMontag * 86_400_000);
  const monat = String(montag.getUTCMonth() + 1).padStart(2, "0");
  const tag = String(montag.getUTCDate()).padStart(2, "0");
  return `${montag.getUTCFullYear()}-${monat}-${tag}`;
}

export function berechneFeedStats(items: FeedItem[], jetzt: Date = new Date()): FeedStats {
  const heuteDatum = berlinerDatum(jetzt);
  const wochenstart = berlinerWochenstart(jetzt);
  const jeStatus: Record<AnzeigeStatus, number> = {
    BEREIT: 0,
    REVIEW_NOETIG: 0,
    FEHLER: 0,
    ONLINE: 0,
  };
  let heute = 0;
  let dieseWoche = 0;
  let laufzeitSumme = 0;
  let laufzeitAnzahl = 0;

  for (const item of items) {
    jeStatus[anzeigeStatus(item)] += 1;

    const erstellt = new Date(item.erstelltAm);
    if (!Number.isNaN(erstellt.getTime())) {
      const datum = berlinerDatum(erstellt);
      if (datum === heuteDatum) heute += 1;
      if (datum >= wochenstart) dieseWoche += 1;
    }

    const laufzeit = laufzeitSekunden(item.runId, item.erstelltAm);
    if (laufzeit !== null) {
      laufzeitSumme += laufzeit;
      laufzeitAnzahl += 1;
    }
  }

  return {
    gesamt: items.length,
    heute,
    dieseWoche,
    jeStatus,
    durchschnittslaufzeitSekunden:
      laufzeitAnzahl > 0 ? Math.round(laufzeitSumme / laufzeitAnzahl) : null,
  };
}

export function formatiereLaufzeit(sekunden: number): string {
  if (sekunden < 60) return `${sekunden} s`;
  const minuten = Math.floor(sekunden / 60);
  const rest = sekunden % 60;
  return rest === 0 ? `${minuten} min` : `${minuten} min ${rest} s`;
}

// Kurzform fuer die Liste: gleicher Berliner Tag "heute, 14:32", sonst "18.07., 09:15"
export function formatiereFeedZeit(erstelltAm: string, jetzt: Date = new Date()): string {
  const zeitpunkt = new Date(erstelltAm);
  if (Number.isNaN(zeitpunkt.getTime())) return "keine Angabe";
  const t = berlinerZeitTeile(zeitpunkt);
  const uhrzeit = `${t.hour}:${t.minute}`;
  if (berlinerDatum(zeitpunkt) === berlinerDatum(jetzt)) {
    return `heute, ${uhrzeit}`;
  }
  return `${t.day}.${t.month}., ${uhrzeit}`;
}

// Langform fuer den Drawer: "22.07.2026, 14:32 Uhr"
export function formatiereZeitpunkt(erstelltAm: string): string {
  const zeitpunkt = new Date(erstelltAm);
  if (Number.isNaN(zeitpunkt.getTime())) return "keine Angabe";
  const t = berlinerZeitTeile(zeitpunkt);
  return `${t.day}.${t.month}.${t.year}, ${t.hour}:${t.minute} Uhr`;
}

// Relativzeit fuer die Feed-Liste. Bewusst echte Instant-Differenz (Date-Millis),
// nicht die Berliner Wanduhr-Achse: die braucht nur der RunID-Vergleich in
// laufzeitSekunden, eine Differenz zweier Instants ist zeitzonenunabhaengig.
export function formatiereRelativeZeit(erstelltAm: string, jetzt: Date = new Date()): string {
  const zeitpunkt = new Date(erstelltAm);
  if (Number.isNaN(zeitpunkt.getTime())) return "keine Angabe";
  const diffSekunden = Math.floor((jetzt.getTime() - zeitpunkt.getTime()) / 1000);
  // Faengt auch leichte Uhrenabweichungen in die Zukunft ab
  if (diffSekunden < 60) return "gerade eben";
  if (diffSekunden < 3600) return `vor ${Math.floor(diffSekunden / 60)} min`;
  if (diffSekunden < 86_400) return `vor ${Math.floor(diffSekunden / 3600)} Std`;
  return formatiereFeedZeit(erstelltAm, jetzt);
}
