// RunID-Format: JJJJMMTT-HHMMSS-ISIN, Zeitstempel in Europe/Berlin.
// Nur serverseitig verwenden (Route Handler), der Client bekommt die RunID von der API.
export function erzeugeRunId(isin: string, zeitpunkt: Date = new Date()): string {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    // h23 statt hour12: false, sonst kann Mitternacht als "24" erscheinen
    hourCycle: "h23",
  }).formatToParts(zeitpunkt);

  const t: Record<string, string> = {};
  for (const p of teile) {
    t[p.type] = p.value;
  }

  return `${t.year}${t.month}${t.day}-${t.hour}${t.minute}${t.second}-${isin}`;
}
