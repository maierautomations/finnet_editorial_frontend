import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnzeigeStatus } from "@/lib/schema";

// Geteilte Statusanzeige fuer Liste, Drawer und Lauf-Modus. Anzeige exakt nach
// Vorgabe: der Wert REVIEW_NOETIG erscheint als "REVIEW NÖTIG", abgehakte
// Beitraege als ONLINE (abgeleiteter Anzeige-Status, siehe anzeigeStatus()).
// Exportiert, damit auch Toasts und Filter-Chips exakt dieselben Strings nutzen.
export const STATUS_ANZEIGE: Record<AnzeigeStatus, string> = {
  BEREIT: "BEREIT",
  REVIEW_NOETIG: "REVIEW NÖTIG",
  FEHLER: "FEHLER",
  ONLINE: "ONLINE",
};

const STIL: Record<AnzeigeStatus, string> = {
  BEREIT: "bg-status-bereit/10 text-status-bereit",
  REVIEW_NOETIG: "bg-status-review/10 text-status-review",
  FEHLER: "bg-status-fehler/10 text-status-fehler",
  ONLINE: "bg-primary/10 text-primary",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnzeigeStatus;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn(STIL[status], className)}>
      {STATUS_ANZEIGE[status]}
    </Badge>
  );
}
