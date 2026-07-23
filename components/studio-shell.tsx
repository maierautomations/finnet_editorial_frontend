"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefingFormular } from "@/components/briefing/briefing-formular";
import { FeedAnsicht } from "@/components/feed/feed-ansicht";

// Beide Tab-Panels bleiben dauerhaft gemountet (forceMount), damit Formular-
// und spaeter Lauf-Modus-State einen Tab-Wechsel ueberleben. Radix blendet
// forceMounted Content nicht selbst aus, daher data-[state=inactive]:hidden.
export function StudioShell() {
  const [tab, setTab] = useState("briefing");

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-screen gap-0">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="text-lg font-semibold tracking-tight">
            <span className="text-primary">Finnet</span> Editorial AI
          </p>
          <TabsList>
            <TabsTrigger value="briefing" className="px-3">
              Neues Briefing
            </TabsTrigger>
            <TabsTrigger value="feed" className="px-3">
              Feed
            </TabsTrigger>
          </TabsList>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {/* Der Fade spielt nur beim data-state-Flip (Tab-Wechsel), Feed-Polls
            re-rendern nur Kinder und starten die CSS-Animation nicht neu. */}
        <TabsContent
          value="briefing"
          forceMount
          className="data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200"
        >
          <BriefingFormular onZumFeed={() => setTab("feed")} feedTabAktiv={tab === "feed"} />
        </TabsContent>
        <TabsContent
          value="feed"
          forceMount
          className="data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200"
        >
          <FeedAnsicht />
        </TabsContent>
      </main>
    </Tabs>
  );
}
