import { useState } from "react";
import type { UserScores } from "../../types";

interface ScoreboardModalProps {
  scores: Record<string, UserScores>;
  totalPicks: number;
  onClose: () => void;
}

type ScoreboardTab = "live" | "bracket";

export default function ScoreboardModal({ scores, totalPicks, onClose }: ScoreboardModalProps) {
  const [tab, setTab] = useState<ScoreboardTab>("live");

  const entries = Object.entries(scores)
    .map(([name, s]) => ({
      name,
      liveScore: s.liveScore,
      bracketScore: s.bracketScore,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-white/30 rounded-t-xl sm:rounded-xl p-4 w-full sm:max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-lg text-amber tracking-wide">SCOREBOARD</p>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(["live", "bracket"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 font-condensed font-bold uppercase text-sm py-1.5 rounded transition-colors ${
                tab === t
                  ? "bg-amber text-bg"
                  : "bg-surface-elevated text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-auto min-h-0 space-y-1">
          {entries.length === 0 ? (
            <p className="font-mono text-xs text-muted text-center py-4">
              Scores appear after picks begin.
            </p>
          ) : (
            entries.map((entry, i) => {
              const score = tab === "live" ? entry.liveScore : entry.bracketScore;
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
                      {i + 1}.
                    </span>
                    <div>
                      <span className={`font-mono text-sm font-bold ${
                        i === 0 ? "text-amber" : "text-white"
                      }`}>
                        {entry.name}
                      </span>
                      <p className="font-mono text-xs text-muted">
                        {tab === "live"
                          ? `${entry.liveHits}/${totalPicks} correct`
                          : `${entry.bracketExact} exact · ${entry.bracketPartial} partial`}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-lg text-amber font-bold">
                    {score}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
