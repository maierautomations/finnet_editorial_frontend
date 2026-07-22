import type { BriefingDaten, FeedItem, FeedStatus } from "@/lib/schema";
import { erzeugeRunId } from "@/lib/runid";

// Mock-Daten fuer USE_MOCK=1. Nur serverseitig verwenden (Route Handler),
// der Client bekommt die Items ausschliesslich ueber GET /api/feed.

type MockVorlage = {
  hauptaktie: string;
  isin: string;
  status: FeedStatus;
  // Abstand des Lauf-Starts zum Modul-Ladezeitpunkt, streng aufsteigend
  minutenZurueck: number;
  // erstelltAm = Start + Laufzeit
  laufzeitSekunden: number;
  kicker: string;
  title: string;
  seoTitle: string;
  teaser: string;
  offeneMarker?: string;
  restFindings?: string;
  confidence?: string;
  fehler?: string;
};

const vorlagen: MockVorlage[] = [
  {
    hauptaktie: "Rheinmetall",
    isin: "DE0007030009",
    status: "BEREIT",
    minutenZurueck: 18,
    laufzeitSekunden: 224,
    kicker: "Rüstungskonzern im Aufwind",
    title: "Rheinmetall sichert sich Milliardenauftrag der Bundeswehr, Aktie auf Rekordhoch",
    seoTitle: "Rheinmetall Aktie: Milliardenauftrag der Bundeswehr treibt Kurs auf Rekordhoch",
    teaser:
      "Die Bundeswehr bestellt Artilleriemunition im Milliardenwert bei Rheinmetall. Die Aktie des Düsseldorfer Konzerns erreicht daraufhin ein neues Allzeithoch, Analysten sehen weiteres Potenzial.",
    confidence: "hoch",
  },
  {
    hauptaktie: "NVIDIA",
    isin: "US67066G1040",
    status: "REVIEW_NOETIG",
    minutenZurueck: 55,
    laufzeitSekunden: 297,
    kicker: "Nach den Quartalszahlen",
    title: "NVIDIA übertrifft die Erwartungen erneut, KI-Nachfrage bleibt der Wachstumstreiber",
    seoTitle: "NVIDIA Aktie nach Zahlen: KI-Nachfrage sorgt für kräftiges Umsatzplus",
    teaser:
      "Der Chipkonzern meldet ein weiteres Rekordquartal. Wie die Aktie nachbörslich reagiert und was Analysten jetzt erwarten.",
    offeneMarker:
      "[Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit]\n[Analystenkonsens prüfen: Quelle, Datum]",
    restFindings: "Kursziel in Absatz 4 ohne Datumsangabe, bitte ergänzen",
    confidence: "mittel",
  },
  {
    hauptaktie: "Commerzbank",
    isin: "DE000CBK1001",
    status: "BEREIT",
    minutenZurueck: 140,
    laufzeitSekunden: 258,
    kicker: "Übernahmefantasie kehrt zurück",
    title: "UniCredit stockt Beteiligung an der Commerzbank weiter auf, Aktie zieht deutlich an",
    seoTitle: "Commerzbank Aktie: UniCredit erhöht Anteil, Kurs springt an",
    teaser:
      "Die italienische Großbank baut ihre Position bei der Commerzbank erneut aus. Am Markt wird wieder über eine Übernahme spekuliert, die Aktie gehört zu den größten Gewinnern im DAX.",
    confidence: "hoch",
  },
  {
    hauptaktie: "Siemens Energy",
    isin: "DE000ENER6Y0",
    status: "BEREIT",
    minutenZurueck: 205,
    laufzeitSekunden: 241,
    kicker: "Energiewende als Kurstreiber",
    title: "Siemens Energy erhält Großauftrag für den Netzausbau in den USA",
    seoTitle: "Siemens Energy Aktie: Großauftrag aus den USA stützt den Kurs",
    teaser:
      "Der Energietechnikkonzern liefert Umspannwerke und Transformatoren für mehrere Netzprojekte in Texas. Das Auftragsbuch wächst damit das sechste Quartal in Folge.",
    confidence: "hoch",
  },
  {
    hauptaktie: "AMD",
    isin: "US0079031078",
    status: "FEHLER",
    minutenZurueck: 320,
    laufzeitSekunden: 61,
    kicker: "",
    title: "",
    seoTitle: "",
    teaser: "",
    fehler:
      "Die Quellenprüfung ist fehlgeschlagen, die IR-Seite von AMD war nicht erreichbar. Briefing erneut absenden.",
  },
  {
    hauptaktie: "SAP",
    isin: "DE0007164600",
    status: "REVIEW_NOETIG",
    minutenZurueck: 1445,
    laufzeitSekunden: 312,
    kicker: "Cloudgeschäft im Fokus",
    title: "SAP wächst in der Cloud erneut zweistellig und bestätigt das Margenziel",
    seoTitle: "SAP Aktie: Cloud-Erlöse wachsen zweistellig, Ausblick bestätigt",
    teaser:
      "Der Softwarekonzern aus Walldorf legt beim Cloud-Umsatz erneut kräftig zu. Für die Aktie bleibt der Umbau des Geschäftsmodells der wichtigste Kurstreiber.",
    offeneMarker: "[Analystenkonsens prüfen: Quelle, Datum]",
    confidence: "mittel",
  },
  {
    hauptaktie: "Deutsche Telekom",
    isin: "DE0005557508",
    status: "BEREIT",
    minutenZurueck: 1530,
    laufzeitSekunden: 199,
    kicker: "Tochter überzeugt erneut",
    title: "T-Mobile US hebt die Prognose an, Deutsche Telekom profitiert",
    seoTitle: "Deutsche Telekom Aktie: T-Mobile US erhöht die Jahresprognose",
    teaser:
      "Die US-Tochter gewinnt mehr Mobilfunkkunden als erwartet und hebt ihre Jahresziele an. Für die T-Aktie ist das Amerika-Geschäft seit Jahren der wichtigste Werttreiber.",
    confidence: "hoch",
  },
  {
    hauptaktie: "Volkswagen Vz",
    isin: "DE0007664039",
    status: "BEREIT",
    minutenZurueck: 1660,
    laufzeitSekunden: 276,
    kicker: "Absatzzahlen aus Fernost",
    title: "Volkswagen verkauft in China wieder mehr Autos, Elektromodelle legen zu",
    seoTitle: "Volkswagen Aktie: China-Absatz steigt, E-Autos gewinnen Marktanteile",
    teaser:
      "Nach zwei schwachen Jahren meldet Volkswagen für China wieder steigende Auslieferungen. Vor allem die neuen Elektromodelle finden mehr Käufer, die Vorzugsaktie reagiert freundlich.",
    confidence: "hoch",
  },
  {
    hauptaktie: "Infineon",
    isin: "DE0006231004",
    status: "REVIEW_NOETIG",
    minutenZurueck: 2925,
    laufzeitSekunden: 331,
    kicker: "Chipwerte gefragt",
    title: "Infineon meldet Großauftrag für KI-Rechenzentren, Aktie legt zu",
    seoTitle: "Infineon Aktie: Großauftrag für KI-Rechenzentren beflügelt den Kurs",
    teaser:
      "Der Münchner Halbleiterkonzern liefert Leistungselektronik für neue KI-Rechenzentren in den USA. Analysten sehen darin einen wichtigen Baustein für das Wachstum der kommenden Jahre.",
    offeneMarker:
      "[Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit]\n[Zahl bestätigen: Umsatz Q2, Quelle]",
    restFindings: "Zwei Quellen sind älter als 30 Tage, aktuellere Belege ergänzen",
    confidence: "niedrig",
  },
  {
    hauptaktie: "Allianz",
    isin: "DE0008404005",
    status: "BEREIT",
    minutenZurueck: 3050,
    laufzeitSekunden: 217,
    kicker: "Kapitalrückfluss an Aktionäre",
    title: "Allianz kündigt neues Aktienrückkaufprogramm über zwei Milliarden Euro an",
    seoTitle: "Allianz Aktie: Neues Rückkaufprogramm über zwei Milliarden Euro",
    teaser:
      "Der Versicherungskonzern setzt seine aktionärsfreundliche Politik fort und kauft erneut eigene Aktien zurück. Die Dividendenrendite bleibt eine der höchsten im DAX.",
    confidence: "hoch",
  },
  {
    hauptaktie: "Hensoldt",
    isin: "DE000HAG0005",
    status: "BEREIT",
    minutenZurueck: 3185,
    laufzeitSekunden: 246,
    kicker: "Verteidigungswerte gefragt",
    title: "Hensoldt gewinnt Radar-Großauftrag für den Eurofighter",
    seoTitle: "Hensoldt Aktie: Radar-Großauftrag für den Eurofighter",
    teaser:
      "Der Sensorspezialist rüstet weitere Eurofighter-Staffeln mit neuen Radaren aus. Das Auftragsbuch des Taufkirchener Unternehmens erreicht damit einen neuen Höchststand.",
    confidence: "mittel",
  },
  {
    hauptaktie: "Tesla",
    isin: "US88160R1014",
    status: "BEREIT",
    minutenZurueck: 4335,
    laufzeitSekunden: 289,
    kicker: "Auslieferungszahlen im Blick",
    title: "Tesla liefert im zweiten Quartal mehr Fahrzeuge aus als erwartet",
    seoTitle: "Tesla Aktie: Auslieferungen im zweiten Quartal über den Erwartungen",
    teaser:
      "Der Elektroautobauer übertrifft mit seinen Quartalsauslieferungen die Schätzungen der Analysten. Die Aktie erholt sich damit weiter von ihrem schwachen Jahresstart.",
    confidence: "mittel",
  },
  {
    hauptaktie: "Deutsche Bank",
    isin: "DE0005140008",
    status: "FEHLER",
    minutenZurueck: 4470,
    laufzeitSekunden: 388,
    kicker: "Quartalszahlen überraschen",
    title: "Deutsche Bank verdient mehr als erwartet, Investmentbanking stützt",
    seoTitle: "Deutsche Bank Aktie: Quartalsgewinn über den Erwartungen",
    teaser:
      "Das Geldhaus profitiert von einem starken Anleihehandel und niedrigeren Kosten. Der Vorstand bestätigt die Renditeziele für das laufende Jahr.",
    confidence: "hoch",
    fehler:
      "Der CMS-Upload ist fehlgeschlagen, der Artikel liegt nur im Review-Sheet. Lauf wiederholen oder das Sheet direkt nutzen.",
  },
  {
    hauptaktie: "RWE",
    isin: "DE0007037129",
    status: "BEREIT",
    minutenZurueck: 5790,
    laufzeitSekunden: 234,
    kicker: "Milliarden für grüne Energie",
    title: "RWE investiert in neuen Offshore-Windpark in der Nordsee",
    seoTitle: "RWE Aktie: Neuer Offshore-Windpark in der Nordsee beschlossen",
    teaser:
      "Der Essener Energiekonzern gibt grünes Licht für einen weiteren Windpark vor der deutschen Küste. Die Anlage soll ab 2029 Strom für mehr als eine Million Haushalte liefern.",
    confidence: "hoch",
  },
  {
    hauptaktie: "Novo Nordisk",
    isin: "DK0062498333",
    status: "REVIEW_NOETIG",
    minutenZurueck: 7210,
    laufzeitSekunden: 305,
    kicker: "Studiendaten bewegen den Kurs",
    title: "Novo Nordisk meldet positive Studiendaten für neue Abnehmtablette",
    seoTitle: "Novo Nordisk Aktie: Positive Studiendaten für Abnehmtablette",
    teaser:
      "Der dänische Pharmakonzern präsentiert vielversprechende Ergebnisse aus einer späten Studienphase. Für die Aktie könnte das Medikament zum nächsten großen Wachstumstreiber werden.",
    offeneMarker: "[Studienergebnis verifizieren: Primärquelle verlinken]",
    restFindings: "Umsatzprognose in Absatz 5 nur mit einer Quelle belegt",
    confidence: "mittel",
  },
  {
    hauptaktie: "Palantir",
    isin: "US69608A1088",
    status: "FEHLER",
    minutenZurueck: 7355,
    laufzeitSekunden: 540,
    kicker: "",
    title: "",
    seoTitle: "",
    teaser: "",
    fehler:
      "Zeitlimit überschritten, der Lauf wurde nach 9 Minuten abgebrochen. Briefing erneut absenden.",
  },
  {
    hauptaktie: "Microsoft",
    isin: "US5949181045",
    status: "BEREIT",
    minutenZurueck: 8655,
    laufzeitSekunden: 263,
    kicker: "Cloudsparte wächst weiter",
    title: "Microsoft steigert Azure-Umsatz kräftig, KI-Dienste treiben das Wachstum",
    seoTitle: "Microsoft Aktie: Azure wächst kräftig dank KI-Diensten",
    teaser:
      "Die Cloudsparte des Softwarekonzerns wächst erneut stärker als erwartet. Vor allem die KI-Angebote sorgen für zusätzliche Nachfrage von Unternehmenskunden.",
    confidence: "hoch",
  },
  {
    hauptaktie: "BASF",
    isin: "DE000BASF111",
    status: "BEREIT",
    minutenZurueck: 9980,
    laufzeitSekunden: 208,
    kicker: "Chemiekonzern auf Kurs",
    title: "BASF kommt beim Sparprogramm schneller voran als geplant",
    seoTitle: "BASF Aktie: Sparprogramm zeigt Wirkung, Kosten sinken schneller",
    teaser:
      "Der Ludwigshafener Chemiekonzern senkt seine Kosten schneller als angekündigt. Für das Gesamtjahr zeigt sich der Vorstand trotz schwacher Nachfrage zuversichtlich.",
    confidence: "hoch",
  },
];

function baueItem(vorlage: MockVorlage, jetzt: Date): FeedItem {
  const start = new Date(jetzt.getTime() - vorlage.minutenZurueck * 60_000);
  return {
    runId: erzeugeRunId(vorlage.isin, start),
    erstelltAm: new Date(start.getTime() + vorlage.laufzeitSekunden * 1000).toISOString(),
    status: vorlage.status,
    hauptaktie: vorlage.hauptaktie,
    isin: vorlage.isin,
    kicker: vorlage.kicker,
    title: vorlage.title,
    seoTitle: vorlage.seoTitle,
    teaser: vorlage.teaser,
    offeneMarker: vorlage.offeneMarker ?? "",
    restFindings: vorlage.restFindings ?? "",
    confidence: vorlage.confidence ?? "",
    fehler: vorlage.fehler ?? "",
  };
}

// Einmal pro Serverprozess ausgewertet: RunIDs und Zeiten bleiben zwischen Requests stabil.
const mockFeed: FeedItem[] = (() => {
  const jetzt = new Date();
  return vorlagen.map((vorlage) => baueItem(vorlage, jetzt));
})();

// ---- Registry eingereichter Briefings (Phase 5) ----
// Als globalThis-Singleton, weil HMR im Dev-Server getrennte Modulgraphen je Route
// erzeugen kann; ein Objekt im Modul-Scope waere dann nicht zwischen den Routen geteilt.

type RegistrierterLauf = {
  // Unix-Millis, ab denen der Lauf im Feed auftaucht
  fertigAb: number;
  item: FeedItem;
};

const REGISTRY_SCHLUESSEL = "__eiStudioMockLaeufe";

function holeRegistry(): Map<string, RegistrierterLauf> {
  const ablage = globalThis as typeof globalThis & {
    [REGISTRY_SCHLUESSEL]?: Map<string, RegistrierterLauf>;
  };
  ablage[REGISTRY_SCHLUESSEL] ??= new Map();
  return ablage[REGISTRY_SCHLUESSEL];
}

// Deterministische Mock-Laufzeit 60 bis 90 Sekunden aus der RunID, stabil je Lauf
function mockLaufzeitMs(runId: string): number {
  let hash = 0;
  for (let i = 0; i < runId.length; i++) {
    hash = (hash * 31 + runId.charCodeAt(i)) % 9973;
  }
  return (60 + (hash % 31)) * 1000;
}

function ersterSatz(text: string): string {
  const bereinigt = text.trim().replace(/\s+/g, " ");
  // Mindestens 20 Zeichen vor dem Satzende, sonst schneiden Abkuerzungen wie "z. B." zu frueh
  const treffer = bereinigt.match(/^.{20,}?[.!?](?=\s|$)/);
  const satz = treffer ? treffer[0] : bereinigt;
  return satz.replace(/[.!?]+$/, "").trim();
}

function kappeAnWortgrenze(text: string, maxZeichen: number): string {
  if (text.length <= maxZeichen) return text;
  const geschnitten = text.slice(0, maxZeichen);
  const schnitt = geschnitten.lastIndexOf(" ");
  const basis = schnitt > maxZeichen / 2 ? geschnitten.slice(0, schnitt) : geschnitten;
  return `${basis.replace(/[\s,;:]+$/, "")} …`;
}

function grossAmAnfang(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Der Mock-Zweig von POST /api/briefing registriert hier den Lauf. Das Item erscheint
// nach 60 bis 90 Sekunden im Feed, Felder plausibel aus dem Briefing abgeleitet:
// mit Redakteurskurs direkt BEREIT, ohne Kurs REVIEW_NOETIG mit Kurs-Platzhalter
// (passend zum Hinweis-Chip im Formular).
export function registriereMockLauf(briefing: BriefingDaten, runId: string): void {
  const fertigAb = Date.now() + mockLaufzeitMs(runId);
  const mitKurs = briefing.redakteurskurs.trim().length > 0;
  const titelBasis = grossAmAnfang(ersterSatz(briefing.thema));
  const teaserBasis = kappeAnWortgrenze(briefing.thema.trim().replace(/\s+/g, " "), 200);
  // Beginnt das Thema mit dem Aktiennamen, den Namen im SEO-Titel nicht verdoppeln
  const seoKern = titelBasis.toLowerCase().startsWith(briefing.hauptName.toLowerCase())
    ? titelBasis.slice(briefing.hauptName.length).replace(/^[\s:,]+/, "")
    : titelBasis;

  const item: FeedItem = {
    runId,
    erstelltAm: new Date(fertigAb).toISOString(),
    status: mitKurs ? "BEREIT" : "REVIEW_NOETIG",
    hauptaktie: briefing.hauptName,
    isin: briefing.hauptIsin,
    kicker: kappeAnWortgrenze(grossAmAnfang(briefing.schwerpunkt.trim()), 60),
    title: kappeAnWortgrenze(titelBasis, 110),
    seoTitle: kappeAnWortgrenze(
      seoKern.length > 0
        ? `${briefing.hauptName} Aktie: ${grossAmAnfang(seoKern)}`
        : `${briefing.hauptName} Aktie: ${titelBasis}`,
      90
    ),
    teaser: /[.!?…]$/.test(teaserBasis) ? teaserBasis : `${teaserBasis}.`,
    offeneMarker: mitKurs ? "" : "[Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit]",
    restFindings: mitKurs ? "" : "Redakteurskurs fehlt, Kursangabe vor der Freigabe ergänzen",
    confidence: mitKurs ? "hoch" : "mittel",
    fehler: "",
  };

  holeRegistry().set(runId, { fertigAb, item });
}

// Statische Beispiele plus fertige Laeufe aus der Registry. Flache Kopien,
// damit sort() und Mutationen beim Aufrufer nichts an den Quellen aendern.
export function holeMockFeed(): FeedItem[] {
  const jetzt = Date.now();
  const fertigeLaeufe: FeedItem[] = [];
  for (const lauf of holeRegistry().values()) {
    if (lauf.fertigAb <= jetzt) {
      fertigeLaeufe.push({ ...lauf.item });
    }
  }
  return [...mockFeed, ...fertigeLaeufe];
}
