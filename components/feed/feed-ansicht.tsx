"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Inbox, TriangleAlert } from "lucide-react";

import type { FeedItem } from "@/lib/schema";
import { feedFetcher } from "@/lib/feed-fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatKarten } from "@/components/feed/stat-karten";
import { FeedListe } from "@/components/feed/feed-liste";
import { FeedDrawer } from "@/components/feed/feed-drawer";

function LadeAnsicht() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <p className="sr-only">Feed wird geladen</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
      <Card className="rounded-2xl py-0">
        <ul className="divide-y divide-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="h-14 animate-pulse" />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function FehlerAnsicht({ meldung, onRetry }: { meldung: string; onRetry: () => void }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <TriangleAlert className="size-8 text-status-fehler" aria-hidden />
        <p className="text-base font-medium">Der Feed konnte nicht geladen werden</p>
        <p className="max-w-sm text-sm text-muted-foreground">{meldung}</p>
        <Button variant="outline" onClick={onRetry}>
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  );
}

function LeereAnsicht() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Inbox className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-base font-medium">Noch keine Artikel im Feed</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Das erste Briefing im Tab Neues Briefing anlegen, fertige Artikel erscheinen hier
          automatisch.
        </p>
      </CardContent>
    </Card>
  );
}

export function FeedAnsicht() {
  const { data, error, mutate } = useSWR<FeedItem[], Error>("/api/feed", feedFetcher, {
    refreshInterval: 30_000,
  });
  const [drawerItem, setDrawerItem] = useState<FeedItem | null>(null);
  const [drawerOffen, setDrawerOffen] = useState(false);

  if (error && !data) {
    return <FehlerAnsicht meldung={error.message} onRetry={() => mutate()} />;
  }
  if (!data) {
    return <LadeAnsicht />;
  }
  if (data.length === 0) {
    return <LeereAnsicht />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      <StatKarten items={data} />

      {error && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="size-3.5 text-status-review" aria-hidden />
          Aktualisierung fehlgeschlagen, es werden die zuletzt geladenen Daten angezeigt
        </p>
      )}

      <FeedListe
        items={data}
        onAuswahl={(item) => {
          setDrawerItem(item);
          setDrawerOffen(true);
        }}
      />

      <FeedDrawer item={drawerItem} offen={drawerOffen} onOpenChange={setDrawerOffen} />
    </motion.div>
  );
}
