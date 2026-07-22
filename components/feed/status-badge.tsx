import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedStatus } from "@/lib/schema";

// Geteilte Statusanzeige fuer Liste, Drawer und spaeter den Lauf-Modus (Phase 5).
// Anzeige exakt nach Vorgabe: der Wert REVIEW_NOETIG erscheint als "REVIEW NÖTIG".
const ANZEIGE: Record<FeedStatus, string> = {
  BEREIT: "BEREIT",
  REVIEW_NOETIG: "REVIEW NÖTIG",
  FEHLER: "FEHLER",
};

const STIL: Record<FeedStatus, string> = {
  BEREIT: "bg-status-bereit/10 text-status-bereit",
  REVIEW_NOETIG: "bg-status-review/10 text-status-review",
  FEHLER: "bg-status-fehler/10 text-status-fehler",
};

export function StatusBadge({
  status,
  className,
}: {
  status: FeedStatus;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn(STIL[status], className)}>
      {ANZEIGE[status]}
    </Badge>
  );
}
