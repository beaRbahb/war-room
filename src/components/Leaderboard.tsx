import { useState } from "react";
import type { UserScores, LeaderboardEntry } from "../types";

interface LeaderboardProps {
  scores: Record<string, UserScores>;
  roomCode: string;
}

type LeaderboardTab = "live" | "bracket";

export default function Leaderboard({ scores, roomCode }: LeaderboardProps) {
  const [tab, setTab] = useState<LeaderboardTab>("live");
  const [expanded, setExpanded] = useState(false);

  // Build sorted leaderboard
  const entries: LeaderboardEntry[] = Object.entries(scores)
    .map(([name, s]) => ({
      name,
      bracketScore: s.bracketScore,
      liveScore: s.liveScore,
      totalScore: s.bracketScore + s.liveScore,
    }))
    .sort((a, b) => {
      const scoreA = tab === "live" ? a.liveScore : a.bracketScore;
      const scoreB = tab === "live" ? b.liveScore : b.bracketScore;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });

  function exportCsv() {
    const headers = "Name,Bracket Score,Live Score,Total Score\n";
    const rows = entries
      .map((e) => `${e.name},${e.bracketScore},${e.liveScore},${e.totalScore}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `war-room-results-${roomCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const content = (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab("live")}
          className={`flex-1 font-condensed font-bold uppercase text-sm py-1.5 rounded transition-colors ${
            tab === "live"
              ? "bg-amber text-bg"
              : "bg-surface-elevated text-muted hover:text-white"
          }`}
        >
          LIVE
        </button>
        <button
          onClick={() => setTab("bracket")}
          className={`flex-1 font-condensed font-bold uppercase text-sm py-1.5 rounded transition-colors ${
            tab === "bracket"
              ? "bg-amber text-bg"
              : "bg-surface-elevated text-muted hover:text-white"
          }`}
        >
          BRACKET
        </button>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="font-mono text-xs text-muted text-center py-4">
          Scores appear after picks begin.
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, i) => {
            const score =
              tab === "live" ? entry.liveScore : entry.bracketScore;
            return (
              <div
                key={entry.name}
                className="flex items-center justify-between bg-bg border border-border rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="font-condensed text-sm text-white font-bold">
                    {entry.name}
                  </span>
                </div>
                <span className="font-mono text-lg text-amber font-bold">
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Export */}
      <button
        onClick={exportCsv}
        className="w-full mt-3 bg-surface-elevated border border-border text-muted font-condensed text-xs uppercase py-2 rounded hover:text-white hover:border-amber transition-all"
      >
        EXPORT CSV
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block lg:w-72 lg:border-l lg:border-border p-4">
        <h2 className="font-display text-lg text-amber mb-3 tracking-wide">
          LEADERBOARD
        </h2>
        {content}
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-4 py-3 flex items-center justify-between"
        >
          <span className="font-display text-sm text-amber tracking-wide">
            LEADERBOARD
          </span>
          <span className="font-mono text-xs text-muted">
            {expanded ? "\u25BC" : "\u25B2"}
          </span>
        </button>

        {expanded && (
          <div className="fixed bottom-12 left-0 right-0 z-30 bg-surface border-t border-border p-4 max-h-[60vh] overflow-auto">
            {content}
          </div>
        )}
      </div>
    </>
  );
}
