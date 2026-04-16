import { useState, useEffect, useRef } from "react";
import type { UserScores, LeaderboardEntry } from "../types";
import PersonaBadge from "./PersonaBadge";
import type { PersonaType } from "../lib/personas";

interface LeaderboardProps {
  scores: Record<string, UserScores>;
  roomCode: string;
  /** Number of confirmed picks so far */
  totalPicks: number;
  /** Persona assignments (post-draft only) */
  personas?: Record<string, PersonaType>;
}

type LeaderboardTab = "live" | "bracket";

export default function Leaderboard({ scores, roomCode, totalPicks, personas }: LeaderboardProps) {
  const [tab, setTab] = useState<LeaderboardTab>("live");
  const [expanded, setExpanded] = useState(false);
  const [flippingScores, setFlippingScores] = useState<Set<string>>(new Set());
  const prevScoresRef = useRef<Record<string, number>>({});

  // Build sorted leaderboard
  const entries: LeaderboardEntry[] = Object.entries(scores)
    .map(([name, s]) => ({
      name,
      bracketScore: s.bracketScore,
      liveScore: s.liveScore,
      totalScore: s.bracketScore + s.liveScore,
      liveHits: s.liveHits || 0,
      bracketExact: s.bracketExact || 0,
      bracketPartial: s.bracketPartial || 0,
    }))
    .sort((a, b) => {
      const scoreA = tab === "live" ? a.liveScore : a.bracketScore;
      const scoreB = tab === "live" ? b.liveScore : b.bracketScore;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });

  // Detect score changes for flip animation
  useEffect(() => {
    const newFlipping = new Set<string>();
    entries.forEach((entry) => {
      const score = tab === "live" ? entry.liveScore : entry.bracketScore;
      const prevScore = prevScoresRef.current[entry.name] ?? score;
      if (score !== prevScore) {
        newFlipping.add(entry.name);
      }
      prevScoresRef.current[entry.name] = score;
    });
    if (newFlipping.size > 0) {
      setFlippingScores(newFlipping);
      setTimeout(() => setFlippingScores(new Set()), 400);
    }
  }, [entries, tab]);

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
            const rankStyle = i === 0
              ? "border-amber bg-amber/10"
              : i === 1
                ? "border-border-bright bg-surface-elevated/50"
                : i === 2
                  ? "border-amber-dim bg-amber-dim/10"
                  : "border-border";
            return (
              <div
                key={entry.name}
                className={`flex items-center justify-between bg-bg border rounded px-3 py-2 ${rankStyle}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm w-5 text-right ${
                    i === 0 ? "text-amber font-bold" : i <= 2 ? "text-white" : "text-muted"
                  }`}>
                    {i === 0 ? "\u{1F451}" : `${i + 1}.`}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-sm text-white font-bold">
                        {entry.name}
                      </span>
                      {personas?.[entry.name] && (
                        <PersonaBadge persona={personas[entry.name]} />
                      )}
                    </div>
                    <p className="font-mono text-xs text-muted">
                      {tab === "live" ? (
                        `${entry.liveHits}/${totalPicks} correct`
                      ) : (
                        `${entry.bracketExact} exact · ${entry.bracketPartial} partial`
                      )}
                    </p>
                  </div>
                </div>
                <span className={`font-mono text-lg text-amber font-bold ${
                  flippingScores.has(entry.name) ? "animate-score-flip" : ""
                }`}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Export — only after draft complete */}
      {totalPicks >= 32 && (
        <button
          onClick={exportCsv}
          className="w-full mt-3 bg-surface-elevated border border-border text-muted font-condensed text-xs uppercase py-2 rounded hover:text-white hover:border-amber transition-all"
        >
          EXPORT CSV
        </button>
      )}
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
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 ${expanded ? "z-50" : "z-30"}`}>
        {/* Expanded content — sits directly above collapsed bar */}
        {expanded && (
          <div className="bg-surface border-t border-border p-4 max-h-[60vh] overflow-auto">
            {content}
          </div>
        )}

        {/* Collapsed bar */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="bg-surface border-t border-border px-4 py-2.5 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-display text-sm text-amber tracking-wide">
              LEADERBOARD
            </span>
            <span className="font-mono text-xs text-muted">
              {expanded ? "\u25BC" : "\u25B2"}
            </span>
          </div>
          <div className="space-y-0.5">
            {entries.slice(0, 3).map((entry, i) => {
              const score = tab === "live" ? entry.liveScore : entry.bracketScore;
              return (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm w-4 text-right ${i === 0 ? "text-amber font-bold" : "text-muted"}`}>
                      {i + 1}.
                    </span>
                    <span className={`font-mono text-sm ${i === 0 ? "text-amber font-bold" : "text-white"}`}>
                      {entry.name}
                    </span>
                  </div>
                  <span className={`font-mono text-sm font-bold ${flippingScores.has(entry.name) ? "animate-score-flip" : ""} ${i === 0 ? "text-amber" : "text-amber/70"}`}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
