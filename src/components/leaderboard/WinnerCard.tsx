import type { RefObject } from "react";
import { PERSONA_META, PERSONA_COLORS, type PersonaType } from "../../lib/personas";
import type { UserRecapStats } from "../../lib/recap";
import ChaosMeter from "../chaos/ChaosMeter";

interface WinnerCardProps {
  stats: UserRecapStats;
  category: "bracket" | "live";
  persona?: PersonaType;
  roomCode: string;
  cardRef: RefObject<HTMLDivElement | null>;
}

/** Auto-scale name class based on character length. */
function nameClass(name: string): string {
  if (name.length <= 8) return "text-[56px] tracking-wide";
  if (name.length <= 14) return "text-[40px] tracking-normal";
  return "text-[32px] tracking-tight";
}

/** Draft Card — trading card style winner card for bracket or live category. */
export default function WinnerCard({
  stats,
  category,
  persona,
  roomCode,
  cardRef,
}: WinnerCardProps) {
  const isBracket = category === "bracket";
  const categoryLabel = isBracket ? "Pre-Draft Bracket" : "Live Picks";
  const rankLabel = isBracket ? "BRACKET WINNER" : "LIVE WINNER";
  const heroScore = isBracket ? stats.bracketScore : stats.liveScore;
  const heroLabel = isBracket ? "Bracket Points" : "Live Points";
  const bestCall = isBracket ? stats.bestBracketCall : stats.bestCall;
  const bestCallLabel = isBracket ? "Best Bracket Call" : "Best Live Call";
  const accuracy = isBracket
    ? Math.round((stats.bracketExactSlots / 32) * 100)
    : stats.liveTotal > 0
      ? Math.round((stats.liveCorrect / stats.liveTotal) * 100)
      : 0;

  const personaMeta = persona ? PERSONA_META[persona] : null;
  const personaColors = persona ? PERSONA_COLORS[persona] : null;
  const personaTextColor = personaColors?.split(" ")[0] ?? "";

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl border-2 border-amber overflow-hidden relative"
      style={{ background: "linear-gradient(165deg, #1a1400 0%, #0a0a0a 40%, #0a0a0a 70%, #1a0f00 100%)" }}
    >
      {/* Top glow overlay */}
      <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-amber/12 to-transparent pointer-events-none" />

      {/* Top section */}
      <div className="relative text-center px-5 pt-6 pb-4">
        <div className="inline-block font-display text-sm tracking-[4px] text-amber border border-amber/30 px-4 py-1 rounded mb-2">
          ON THE CLOCK 2026
        </div>
        <p className="font-condensed text-xs font-bold uppercase tracking-[3px] text-muted mb-1.5">
          {categoryLabel}
        </p>
        <p className={`font-display text-white leading-[0.95] text-shadow-lg max-w-[360px] mx-auto overflow-hidden text-ellipsis whitespace-nowrap ${nameClass(stats.name)}`}>
          {stats.name.toUpperCase()}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-amber text-bg font-display text-[22px] tracking-wide px-5 py-1 rounded-full mt-2">
          <span className="text-lg">🏆</span>
          {rankLabel}
        </div>
        {personaMeta && (
          <>
            <p className={`mt-2.5 font-condensed text-[13px] font-bold uppercase tracking-[2px] opacity-70 ${personaTextColor}`}>
              {personaMeta.label}
            </p>
            <p className="mt-0.5 font-condensed text-[11px] uppercase tracking-wider text-muted">
              {personaMeta.description}
            </p>
          </>
        )}
      </div>

      {/* Hero score */}
      <div className="mx-5 border-t border-b border-amber/20 py-4 text-center">
        <p className="font-display text-[56px] leading-none text-amber">{heroScore}</p>
        <p className="font-condensed text-[11px] uppercase tracking-[2px] text-muted mt-0.5">{heroLabel}</p>
      </div>

      {/* Stats rows */}
      <div className="px-5 py-4">
        {isBracket ? (
          <>
            <StatRow label="Exact Slot Hits" value={`${stats.bracketExactSlots}/32`} color="text-green" />
            <StatRow label="Players in Round 1" value={`${stats.bracketPlayersCorrect}/${stats.liveTotal}`} color="text-white" />
            <StatRow label="Accuracy" value={`${accuracy}%`} color="text-amber" />
          </>
        ) : (
          <>
            <StatRow label="Correct Picks" value={`${stats.liveCorrect}/${stats.liveTotal}`} color="text-white" />
            <StatRow label="Longest Streak" value={`${stats.longestStreak} in a row`} color="text-green" />
            <StatRow label="Accuracy" value={`${accuracy}%`} color="text-amber" />
          </>
        )}
      </div>

      {/* Best call */}
      {bestCall && (
        <div className="mx-5 mb-4 bg-green/[0.04] border border-green/15 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
          <div>
            <p className="font-condensed text-[10px] uppercase tracking-wider text-green mb-0.5">{bestCallLabel}</p>
            <p className="font-mono text-[13px] font-bold text-green">
              #{bestCall.pick.pick} {bestCall.pick.playerName} → {bestCall.pick.teamAbbrev}
            </p>
          </div>
          <ChaosMeter slot={bestCall.pick.pick} playerName={bestCall.pick.playerName} />
        </div>
      )}

      {/* Bears prediction */}
      {stats.bearsPrediction && (
        <div className="mx-5 mb-4 bg-bears-navy/30 border border-bears-orange/30 rounded-lg px-3.5 py-2.5">
          <p className="font-condensed text-[10px] uppercase tracking-wider text-bears-orange mb-1">
            Bears Pick #25 — {isBracket ? "Bracket" : "Live"}
          </p>
          <p className="font-mono text-xs text-white">
            Predicted: {isBracket ? stats.bearsPrediction.bracketPick : stats.bearsPrediction.livePick}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-amber/10">
        <span className="font-mono text-[11px] text-amber/40 tracking-[2px]">Room: {roomCode}</span>
        <span className="font-display text-xs text-muted tracking-widest">ON THE CLOCK</span>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-b-0">
      <span className="font-condensed text-[13px] uppercase tracking-wider text-muted">{label}</span>
      <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
