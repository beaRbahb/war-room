import { useMemo } from "react";
import { calcChaosScore, type ChaosLevel } from "../lib/chaos";
import { PROSPECTS } from "../data/prospects";
import type { ConfirmedPick } from "../types";

interface RunningChaosMeterProps {
  confirmedPicks: ConfirmedPick[];
}

const FILL_COLORS: Record<ChaosLevel, string> = {
  CHALK: "bg-muted",
  MILD: "bg-amber",
  SPICY: "bg-bears-orange",
  CHAOS: "bg-red",
};

const TEXT_COLORS: Record<ChaosLevel, string> = {
  CHALK: "text-muted",
  MILD: "text-amber",
  SPICY: "text-bears-orange",
  CHAOS: "text-red",
};

/** Plain-language draft vibe based on avg chaos score */
function getDraftPhrase(score: number): string {
  if (score <= 25) return "GOING TO SCRIPT";
  if (score <= 45) return "MOSTLY CHALK";
  if (score <= 65) return "SOME SURPRISES";
  if (score <= 80) return "GETTING WILD";
  return "OFF THE RAILS";
}

/** Minimum picks before showing the vibe meter */
const MIN_PICKS = 3;

/** Running draft chaos meter — shows after 3+ confirmed picks. */
export default function RunningChaosMeter({ confirmedPicks }: RunningChaosMeterProps) {
  const { rmsScore, rmsLevel } = useMemo(() => {
    if (confirmedPicks.length < MIN_PICKS) return { rmsScore: 0, rmsLevel: "CHALK" as ChaosLevel };

    const sorted = [...confirmedPicks].sort((a, b) => a.pick - b.pick);
    let sumSquares = 0;

    for (let i = 0; i < sorted.length; i++) {
      const pick = sorted[i];
      const priorPicks = sorted.slice(0, i).map((p) => ({
        position: PROSPECTS.find((pr) => pr.name === p.playerName)?.position ?? "",
      }));
      const { score } = calcChaosScore(pick.pick, pick.playerName, pick.teamAbbrev, priorPicks);
      sumSquares += score * score;
    }

    const rms = Math.round(Math.sqrt(sumSquares / sorted.length));
    const level: ChaosLevel =
      rms <= 30 ? "CHALK" : rms <= 60 ? "MILD" : rms <= 80 ? "SPICY" : "CHAOS";

    return { rmsScore: rms, rmsLevel: level };
  }, [confirmedPicks]);

  if (confirmedPicks.length < MIN_PICKS) return null;

  const fillPct = Math.round((rmsScore / 99) * 100);
  const phrase = getDraftPhrase(rmsScore);

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-surface-elevated/50">
      <span className="font-condensed text-[10px] text-muted uppercase tracking-wider shrink-0">
        DRAFT VIBE
      </span>
      <div className="w-24 h-1.5 bg-bg rounded-full overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-700 ${FILL_COLORS[rmsLevel]}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <span className={`font-condensed text-xs font-bold uppercase ${TEXT_COLORS[rmsLevel]}`}>
        {phrase}
      </span>
      <span className="font-mono text-[10px] text-muted ml-auto shrink-0">
        {confirmedPicks.length}/32
      </span>
    </div>
  );
}
