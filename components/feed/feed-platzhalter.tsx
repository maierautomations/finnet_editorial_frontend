import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FeedPlatzhalter() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Inbox className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-base font-medium">Noch keine Artikel im Feed</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Der Feed wird in einer späteren Phase angebunden und zeigt dann Status,
          Stats und Details zu jedem Lauf.
        </p>
      </CardContent>
    </Card>
  );
}
