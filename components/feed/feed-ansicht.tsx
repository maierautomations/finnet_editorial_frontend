"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Inbox, SearchX, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import type { FeedItem, OnlineAntwort } from "@/lib/schema";
import { anzeigeStatus } from "@/lib/feed-berechnungen";
import { feedFetcher } from "@/lib/feed-fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatKarten } from "@/components/feed/stat-karten";
import { FeedFilter, type StatusFilter } from "@/components/feed/feed-filter";
import { FeedListe } from "@/components/feed/feed-liste";
import { FeedDrawer } from "@/components/feed/feed-drawer";

function LadeAnsicht() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <p className="sr-only">Feed wird geladen</p>
      <div className="grid gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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

function KeineTreffer({ onZuruecksetzen }: { onZuruecksetzen: () => void }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <SearchX className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-base font-medium">Keine Artikel passen zu den Filtern</p>
        <Button variant="outline" size="sm" onClick={onZuruecksetzen}>
          Filter zurücksetzen
        </Button>
      </CardContent>
    </Card>
  );
}

export function FeedAnsicht() {
  const { data, error, mutate } = useSWR<FeedItem[], Error>("/api/feed", feedFetcher, {
    refreshInterval: 30_000,
  });
  // Der Drawer haelt nur die RunID, das Item kommt live aus dem SWR-Cache: so
  // wirken optimistische Updates (Online-Toggle) sofort in Drawer, Liste und Stats.
  const [ausgewaehlteRunId, setAusgewaehlteRunId] = useState<string | null>(null);
  const [drawerOffen, setDrawerOffen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALLE");
  const [suche, setSuche] = useState("");
  const [nurNichtOnline, setNurNichtOnline] = useState(false);

  // Optimistisches Update ohne Sofort-Revalidate: das Review-Sheet schreibt
  // asynchron, ein direkter Refetch koennte den alten Wert zurueckliefern und
  // den Haken flackern lassen. Der regulaere 30-Sekunden-Poll konvergiert.
  const onlineUmschalten = async (item: FeedItem) => {
    const neu = !item.online;
    const patch = (liste: FeedItem[] | undefined) =>
      (liste ?? []).map((eintrag) =>
        eintrag.runId === item.runId ? { ...eintrag, online: neu } : eintrag
      );
    let fehlerMeldung = "Der Online-Status konnte nicht gespeichert werden, bitte erneut versuchen";
    try {
      await mutate(
        async (aktuell) => {
          const res = await fetch("/api/online", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId: item.runId, online: neu }),
          });
          const antwort = (await res.json().catch(() => null)) as OnlineAntwort | null;
          if (!res.ok || antwort?.ok !== true) {
            if (antwort && antwort.ok === false && antwort.fehler) {
              fehlerMeldung = antwort.fehler;
            }
            throw new Error(fehlerMeldung);
          }
          return patch(aktuell);
        },
        { optimisticData: patch, rollbackOnError: true, populateCache: true, revalidate: false }
      );
    } catch {
      toast.error(fehlerMeldung);
    }
  };

  if (error && !data) {
    return <FehlerAnsicht meldung={error.message} onRetry={() => mutate()} />;
  }
  if (!data) {
    return <LadeAnsicht />;
  }
  if (data.length === 0) {
    return <LeereAnsicht />;
  }

  const drawerItem = data.find((eintrag) => eintrag.runId === ausgewaehlteRunId) ?? null;

  const suchbegriff = suche.trim().toLowerCase();
  const gefiltert = data.filter((item) => {
    if (statusFilter !== "ALLE" && anzeigeStatus(item) !== statusFilter) return false;
    if (nurNichtOnline && item.online) return false;
    if (
      suchbegriff !== "" &&
      !item.hauptaktie.toLowerCase().includes(suchbegriff) &&
      !item.title.toLowerCase().includes(suchbegriff)
    ) {
      return false;
    }
    return true;
  });

  const filterZuruecksetzen = () => {
    setStatusFilter("ALLE");
    setSuche("");
    setNurNichtOnline(false);
  };

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

      <FeedFilter
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        suche={suche}
        onSuche={setSuche}
        nurNichtOnline={nurNichtOnline}
        onNurNichtOnline={setNurNichtOnline}
      />

      {gefiltert.length > 0 ? (
        <FeedListe
          items={gefiltert}
          onAuswahl={(item) => {
            setAusgewaehlteRunId(item.runId);
            setDrawerOffen(true);
          }}
        />
      ) : (
        <KeineTreffer onZuruecksetzen={filterZuruecksetzen} />
      )}

      <FeedDrawer
        item={drawerItem}
        offen={drawerOffen}
        onOpenChange={setDrawerOffen}
        onOnlineUmschalten={onlineUmschalten}
      />
    </motion.div>
  );
}
