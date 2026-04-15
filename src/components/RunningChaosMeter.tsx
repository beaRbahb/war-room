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

/** Running draft chaos meter — shows above pick #1 in the draft list. */
export default function RunningChaosMeter({ confirmedPicks }: RunningChaosMeterProps) {
  const { avgScore, avgLevel } = useMemo(() => {
    if (confirmedPicks.length === 0) return { avgScore: 0, avgLevel: "CHALK" as ChaosLevel };

    const sorted = [...confirmedPicks].sort((a, b) => a.pick - b.pick);
    let total = 0;

    for (let i = 0; i < sorted.length; i++) {
      const pick = sorted[i];
      const priorPicks = sorted.slice(0, i).map((p) => ({
        position: PROSPECTS.find((pr) => pr.name === p.playerName)?.position ?? "",
      }));
      const { score } = calcChaosScore(pick.pick, pick.playerName, pick.teamAbbrev, priorPicks);
      total += score;
    }

    const avg = Math.round(total / sorted.length);
    const level: ChaosLevel =
      avg <= 30 ? "CHALK" : avg <= 60 ? "MILD" : avg <= 80 ? "SPICY" : "CHAOS";

    return { avgScore: avg, avgLevel: level };
  }, [confirmedPicks]);

  if (confirmedPicks.length === 0) return null;

  const fillPct = Math.round((avgScore / 99) * 100);
  const phrase = getDraftPhrase(avgScore);

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-surface-elevated/50">
      <span className="font-condensed text-[10px] text-muted uppercase tracking-wider shrink-0">
        DRAFT VIBE
      </span>
      <div className="w-24 h-1.5 bg-bg rounded-full overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-700 ${FILL_COLORS[avgLevel]}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <span className={`font-condensed text-xs font-bold uppercase ${TEXT_COLORS[avgLevel]}`}>
        {phrase}
      </span>
      <span className="font-mono text-[10px] text-muted ml-auto shrink-0">
        {confirmedPicks.length}/32
      </span>
    </div>
  );
}
