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
  // GroundStyle-Artikel-HTML (p, ul/li); FEHLER-Laeufe ohne Artikel lassen es weg
  textHtml?: string;
  // Beitrag bereits im CMS online (vom Redakteur abgehakt)
  online?: boolean;
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
    textHtml:
      "<p>Die Bundeswehr hat bei Rheinmetall Artilleriemunition im Wert von mehreren Milliarden Euro bestellt. Es ist der größte Einzelauftrag in der Geschichte des Düsseldorfer Konzerns, die Auslieferung ist bis 2030 geplant.</p>" +
      "<ul><li>Auftragsvolumen: rund 3,5 Milliarden Euro inklusive Optionen</li><li>Produktion überwiegend am Standort Unterlüß</li><li>Erste Lieferungen bereits im kommenden Jahr</li></ul>" +
      "<p>Die Rheinmetall Aktie notierte am Vormittag auf XETRA bei 1.842,50 Euro und damit 3,8 Prozent im Plus auf einem neuen Allzeithoch.</p>" +
      "<p>Analysten sehen weiteres Potenzial: Der Auftrag untermauert die Prognose des Managements, das für das laufende Jahr ein Umsatzwachstum von mehr als 25 Prozent in Aussicht gestellt hat.</p>",
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
    textHtml:
      "<p>NVIDIA hat die Erwartungen der Wall Street erneut übertroffen. Der Umsatz stieg im abgelaufenen Quartal auf 62,4 Milliarden US-Dollar, getrieben von der anhaltend hohen Nachfrage nach KI-Beschleunigern.</p>" +
      "<ul><li>Datacenter-Sparte wächst um 68 Prozent zum Vorjahr</li><li>Bruttomarge bei 74,2 Prozent</li><li>Prognose für das laufende Quartal über dem Konsens</li></ul>" +
      "<p>Die NVIDIA Aktie notierte nachbörslich bei [Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit] deutlich im Plus.</p>" +
      "<p>Analysten reagieren positiv: [Analystenkonsens prüfen: Quelle, Datum]. Mehrere Häuser haben ihre Kursziele zuletzt angehoben.</p>",
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
    textHtml:
      "<p>UniCredit hat ihre Beteiligung an der Commerzbank erneut aufgestockt. Nach Angaben aus Finanzkreisen liegt der Anteil der Italiener nun bei knapp 29,9 Prozent und damit unmittelbar unter der Schwelle für ein Pflichtangebot.</p>" +
      "<ul><li>UniCredit hält jetzt knapp 29,9 Prozent</li><li>Ab 30 Prozent wäre ein Übernahmeangebot verpflichtend</li><li>Der Bund hält weiter rund 12 Prozent</li></ul>" +
      "<p>Die Commerzbank Aktie legte auf XETRA um 4,6 Prozent auf 18,42 Euro zu und war damit stärkster Wert im DAX.</p>" +
      "<p>Am Markt wird nun darüber spekuliert, ob UniCredit den nächsten Schritt geht. Ein förmliches Angebot gilt spätestens für das kommende Jahr als wahrscheinlich.</p>",
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
    textHtml:
      "<p>Siemens Energy hat einen Großauftrag für den Ausbau des Stromnetzes in den USA erhalten. Der Konzern liefert Umspannwerke und Transformatoren für mehrere Netzprojekte in Texas.</p>" +
      "<ul><li>Auftragswert im hohen dreistelligen Millionenbereich</li><li>Lieferungen ab 2027 aus Werken in den USA und Europa</li><li>Auftragsbuch wächst das sechste Quartal in Folge</li></ul>" +
      "<p>Die Siemens Energy Aktie gewann auf XETRA 2,1 Prozent auf 94,80 Euro.</p>" +
      "<p>Das Netzgeschäft ist derzeit der stabilste Gewinnbringer des Konzerns und gleicht die anhaltenden Probleme der Windkrafttochter weiter aus.</p>",
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
    textHtml:
      "<p>SAP ist beim Cloud-Umsatz erneut zweistellig gewachsen. Die Erlöse aus dem Cloudgeschäft stiegen im Quartal um 26 Prozent auf 5,9 Milliarden Euro, der Konzern bestätigte seine Margenziele für das Gesamtjahr.</p>" +
      "<ul><li>Cloud-Backlog wächst um 28 Prozent</li><li>Operative Marge legt auf 27,5 Prozent zu</li><li>Ausblick für 2026 bestätigt</li></ul>" +
      "<p>Für die SAP Aktie bleibt der Umbau zum Cloudkonzern der wichtigste Kurstreiber. [Analystenkonsens prüfen: Quelle, Datum]</p>",
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
    textHtml:
      "<p>T-Mobile US hat nach einem starken Quartal die Jahresprognose angehoben. Die US-Tochter der Deutschen Telekom gewann erneut mehr Vertragskunden als von Analysten erwartet.</p>" +
      "<ul><li>1,3 Millionen neue Vertragskunden im Quartal</li><li>Prognose für den freien Cashflow angehoben</li><li>Aktienrückkäufe laufen planmäßig weiter</li></ul>" +
      "<p>Die T-Aktie notierte auf XETRA 1,4 Prozent fester bei 34,12 Euro.</p>" +
      "<p>Das Amerika-Geschäft bleibt der wichtigste Werttreiber des Bonner Konzerns, es steht inzwischen für gut zwei Drittel des Konzernumsatzes.</p>",
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
    textHtml:
      "<p>Volkswagen hat in China nach zwei schwachen Jahren wieder mehr Autos verkauft. Die Auslieferungen stiegen im ersten Halbjahr um 6 Prozent, vor allem die neuen Elektromodelle finden mehr Käufer.</p>" +
      "<ul><li>Halbjahresabsatz in China: 1,45 Millionen Fahrzeuge</li><li>E-Modelle legen um 41 Prozent zu</li><li>Neue Kompaktmodelle mit lokalem Partner ab Herbst</li></ul>" +
      "<p>Die Volkswagen Vorzugsaktie gewann auf XETRA 1,9 Prozent auf 108,55 Euro.</p>" +
      "<p>Der China-Markt bleibt für Wolfsburg entscheidend, dort verdient der Konzern trotz des Preisdrucks weiterhin einen erheblichen Teil seines Gewinns.</p>",
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
    textHtml:
      "<p>Infineon hat einen Großauftrag für die Stromversorgung von KI-Rechenzentren an Land gezogen. Der Münchner Halbleiterkonzern liefert Leistungselektronik für neue Rechenzentrumsstandorte in den USA.</p>" +
      "<ul><li>Mehrjahresvertrag mit einem führenden Cloud-Anbieter</li><li>Lieferstart in der zweiten Jahreshälfte</li><li>Umsatz im zweiten Quartal: [Zahl bestätigen: Umsatz Q2, Quelle]</li></ul>" +
      "<p>Die Infineon Aktie notierte bei [Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit] im Plus.</p>" +
      "<p>Analysten sehen in dem Auftrag einen wichtigen Baustein für das Wachstum der kommenden Jahre, die Bewertung bleibt im Branchenvergleich moderat.</p>",
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
    textHtml:
      "<p>Die Allianz kauft erneut eigene Aktien zurück. Der Versicherungskonzern kündigte ein neues Rückkaufprogramm über zwei Milliarden Euro an, das noch im laufenden Quartal startet.</p>" +
      "<ul><li>Volumen: zwei Milliarden Euro bis Jahresende</li><li>Dividendenrendite weiter über 5 Prozent</li><li>Solvenzquote bei komfortablen 218 Prozent</li></ul>" +
      "<p>Die Allianz Aktie legte auf XETRA 1,2 Prozent auf 312,40 Euro zu.</p>" +
      "<p>Der Konzern setzt damit seine aktionärsfreundliche Kapitalpolitik fort, seit 2017 hat die Allianz mehr als 15 Milliarden Euro für Rückkäufe eingesetzt.</p>",
    online: true,
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
    textHtml:
      "<p>Hensoldt rüstet weitere Eurofighter-Staffeln mit neuen Radaren aus. Der Sensorspezialist aus Taufkirchen erhielt einen entsprechenden Großauftrag für die Ausstattung von zwei weiteren Tranchen.</p>" +
      "<ul><li>Auftragswert im mittleren dreistelligen Millionenbereich</li><li>Auslieferung zwischen 2027 und 2031</li><li>Auftragsbuch auf neuem Höchststand</li></ul>" +
      "<p>Die Hensoldt Aktie gewann auf XETRA 2,7 Prozent auf 68,90 Euro.</p>" +
      "<p>Das Unternehmen profitiert weiter von steigenden Verteidigungsbudgets, für das Gesamtjahr stellt der Vorstand ein Umsatzwachstum von rund 10 Prozent in Aussicht.</p>",
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
    textHtml:
      "<p>Tesla hat im zweiten Quartal mehr Fahrzeuge ausgeliefert als erwartet. Der Elektroautobauer übergab weltweit 462.000 Fahrzeuge an Kunden, Analysten hatten im Schnitt mit 448.000 gerechnet.</p>" +
      "<ul><li>Auslieferungen: 462.000 Fahrzeuge, rund 4 Prozent über Konsens</li><li>Model Y bleibt meistverkauftes Modell</li><li>Energiespeichergeschäft wächst um 30 Prozent</li></ul>" +
      "<p>Die Tesla Aktie legte an der Nasdaq 5,3 Prozent auf 287,40 US-Dollar zu.</p>" +
      "<p>Die Aktie erholt sich damit weiter von ihrem schwachen Jahresstart, seit dem Tief im April hat sie rund ein Viertel an Wert gewonnen.</p>",
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
    textHtml:
      "<p>Die Deutsche Bank hat im Quartal mehr verdient als erwartet. Der Vorsteuergewinn stieg auf 2,4 Milliarden Euro, getragen von einem starken Anleihehandel und sinkenden Kosten.</p>" +
      "<ul><li>Erträge im Investmentbanking plus 12 Prozent</li><li>Kostenquote sinkt auf 68 Prozent</li><li>Renditeziel von 10 Prozent bestätigt</li></ul>" +
      "<p>Die Deutsche Bank Aktie notierte auf XETRA 2,2 Prozent fester bei 21,88 Euro.</p>",
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
    textHtml:
      "<p>RWE baut einen weiteren Offshore-Windpark in der deutschen Nordsee. Der Essener Energiekonzern gab die finale Investitionsentscheidung für das Projekt mit einer Leistung von 1,6 Gigawatt bekannt.</p>" +
      "<ul><li>Leistung: 1,6 Gigawatt, Strom für über eine Million Haushalte</li><li>Investitionsvolumen rund vier Milliarden Euro</li><li>Inbetriebnahme ab 2029 geplant</li></ul>" +
      "<p>Die RWE Aktie zeigte sich auf XETRA 0,8 Prozent fester bei 38,65 Euro.</p>" +
      "<p>Der Konzern bekräftigte zugleich sein Investitionsprogramm für erneuerbare Energien, bis 2030 sollen weltweit mehr als 50 Milliarden Euro fließen.</p>",
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
    textHtml:
      "<p>Novo Nordisk hat positive Studiendaten für seine neue Abnehmtablette vorgelegt. In einer späten Studienphase verloren Teilnehmer im Schnitt 15,2 Prozent ihres Körpergewichts. [Studienergebnis verifizieren: Primärquelle verlinken]</p>" +
      "<ul><li>Gewichtsverlust von 15,2 Prozent nach 68 Wochen</li><li>Zulassungsantrag noch in diesem Jahr geplant</li><li>Tablette könnte die Spritze künftig ergänzen</li></ul>" +
      "<p>Die Novo Nordisk Aktie legte in Kopenhagen 6,1 Prozent zu.</p>" +
      "<p>Für den dänischen Pharmakonzern könnte das Medikament zum nächsten großen Wachstumstreiber werden, der Markt für Abnehmmittel wächst weiter zweistellig.</p>",
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
    textHtml:
      "<p>Microsoft hat den Umsatz seiner Cloudsparte Azure erneut kräftig gesteigert. Das Wachstum lag bei 31 Prozent und damit über den Erwartungen, vor allem KI-Dienste sorgten für zusätzliche Nachfrage.</p>" +
      "<ul><li>Azure-Wachstum: 31 Prozent, davon 13 Punkte aus KI-Diensten</li><li>Konzernumsatz steigt auf 76,4 Milliarden US-Dollar</li><li>Investitionen in Rechenzentren erneut erhöht</li></ul>" +
      "<p>Die Microsoft Aktie gewann nachbörslich 3,4 Prozent auf 512,30 US-Dollar.</p>" +
      "<p>Der Konzern baut seine Kapazitäten weiter aus, im laufenden Quartal sollen die Investitionen erstmals über 25 Milliarden US-Dollar liegen.</p>",
    online: true,
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
    textHtml:
      "<p>BASF kommt bei seinem Sparprogramm schneller voran als geplant. Der Ludwigshafener Chemiekonzern hat die angepeilten Einsparungen von 1,1 Milliarden Euro bereits zu drei Vierteln erreicht.</p>" +
      "<ul><li>Einsparziel zu 75 Prozent umgesetzt</li><li>Fixkosten sinken zum sechsten Quartal in Folge</li><li>Ausblick für das Gesamtjahr bestätigt</li></ul>" +
      "<p>Die BASF Aktie notierte auf XETRA 1,1 Prozent im Plus bei 46,78 Euro.</p>" +
      "<p>Trotz weiter schwacher Nachfrage aus der Industrie zeigt sich der Vorstand zuversichtlich, die Talsohle im Chemiegeschäft sieht er durchschritten.</p>",
    online: true,
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
    textHtml: vorlage.textHtml ?? "",
    online: vorlage.online ?? false,
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

// Abhaken-Registry fuer USE_MOCK=1: Online-Overrides je RunID, gleiches
// globalThis-Muster wie die Lauf-Registry (HMR-sicher). Wirkt auf statische
// und registrierte Items.
const ONLINE_SCHLUESSEL = "__eiStudioMockOnline";

function holeOnlineOverrides(): Map<string, boolean> {
  const ablage = globalThis as typeof globalThis & {
    [ONLINE_SCHLUESSEL]?: Map<string, boolean>;
  };
  ablage[ONLINE_SCHLUESSEL] ??= new Map();
  return ablage[ONLINE_SCHLUESSEL];
}

// Der Mock-Zweig von POST /api/online. false = RunID unbekannt, wie ein
// fehlgeschlagener RunID-Match beim echten Sheet-Update.
export function setzeMockOnline(runId: string, online: boolean): boolean {
  const bekannt = mockFeed.some((item) => item.runId === runId) || holeRegistry().has(runId);
  if (!bekannt) return false;
  holeOnlineOverrides().set(runId, online);
  return true;
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

// GroundStyle-Artikel fuer registrierte Mock-Laeufe: Absatz aus dem Thema, eine
// Bullet-Liste, Kurs-Satz mit Platzhalter wenn kein Redakteurskurs vorliegt
function baueMockArtikelHtml(briefing: BriefingDaten, mitKurs: boolean): string {
  const thema = briefing.thema.trim().replace(/\s+/g, " ");
  const themaSatz = /[.!?…]$/.test(thema) ? thema : `${thema}.`;
  const kursSatz = mitKurs
    ? `Die ${briefing.hauptName} Aktie notierte zuletzt bei ${briefing.redakteurskurs.trim()}.`
    : `Die ${briefing.hauptName} Aktie notierte zuletzt bei [Kurs einsetzen: Wert, Währung, Börsenplatz, Datum/Uhrzeit].`;
  return (
    `<p>${themaSatz}</p>` +
    `<ul><li>Schwerpunkt: ${grossAmAnfang(briefing.schwerpunkt.trim())}</li>` +
    `<li>Einordnung und Hintergrund folgen im Artikel.</li></ul>` +
    `<p>${kursSatz}</p>` +
    `<p>Der Beitrag wurde automatisch recherchiert und geschrieben, die Redaktion prüft vor der Freigabe.</p>`
  );
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
    textHtml: baueMockArtikelHtml(briefing, mitKurs),
    online: false,
  };

  holeRegistry().set(runId, { fertigAb, item });
}

// Statische Beispiele plus fertige Laeufe aus der Registry. Flache Kopien je Item,
// damit sort() und Mutationen beim Aufrufer nichts an den Quellen aendern; dabei
// die Online-Overrides aus der Abhaken-Registry anwenden.
export function holeMockFeed(): FeedItem[] {
  const jetzt = Date.now();
  const fertigeLaeufe: FeedItem[] = [];
  for (const lauf of holeRegistry().values()) {
    if (lauf.fertigAb <= jetzt) {
      fertigeLaeufe.push(lauf.item);
    }
  }
  const overrides = holeOnlineOverrides();
  return [...mockFeed, ...fertigeLaeufe].map((item) => ({
    ...item,
    online: overrides.get(item.runId) ?? item.online,
  }));
}
