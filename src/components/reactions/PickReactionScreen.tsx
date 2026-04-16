import { useEffect, useState } from "react";
import { calcChaosScore, type ChaosLevel } from "../../lib/chaos";
import { PROSPECTS } from "../../data/prospects";
import { TEAM_NEEDS } from "../../data/teamNeeds";
import { getPickProb, PICK_PROBS } from "../../data/prospectOdds";
import { getTeamLogo } from "../../data/teams";
import { getHeadshot } from "../../lib/headshots";
import { submitReaction, onReactions } from "../../lib/storage";
import type { UserReaction, ReactionType } from "../../types";
import {
  POLES_LABELS,
  POLES_COLORS,
  GRADE_LABELS,
  GRADE_COLORS,
  type PolesReaction,
  type GradeType,
} from "../../types";

interface PickReactionScreenProps {
  slot: number;
  playerName: string;
  teamAbbrev: string;
  isBearsPick: boolean;
  priorPicks: { position: string }[];
  roomCode: string;
  userName: string;
  onComplete: () => void;
}

const LEVEL_COLORS: Record<ChaosLevel, { text: string; bg: string; border: string }> = {
  CHALK: { text: "text-muted", bg: "bg-muted/15", border: "border-muted/30" },
  MILD: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/30" },
  SPICY: { text: "text-bears-orange", bg: "bg-bears-orange/15", border: "border-bears-orange/30" },
  CHAOS: { text: "text-red", bg: "bg-red/15", border: "border-red/30" },
};

const POLES_OPTIONS: PolesReaction[] = ["king", "meh", "bad"];
const GRADE_OPTIONS: GradeType[] = ["a-plus", "a", "b", "c", "d", "f"];

/** Maps prospect positions → readable need match description */
function getNeedDescription(position: string | undefined, teamAbbrev: string): string {
  if (!position) return "Unknown position";
  const needs = TEAM_NEEDS[teamAbbrev] ?? [];
  if (needs.length === 0) return "No need data";

  // Use same mapping logic as chaos.ts
  const POSITION_NEED_MAP: Record<string, string[]> = {
    QB: ["QB"], RB: ["RB"], WR: ["WR"], TE: ["TE"],
    OT: ["OL", "OT"], IOL: ["OL", "OG", "C"],
    DL: ["DL", "DT"], EDGE: ["EDGE"],
    "EDGE/LB": ["EDGE", "LB"], LB: ["LB"], CB: ["CB"], S: ["S"],
  };
  const satisfies = POSITION_NEED_MAP[position] ?? [position];
  for (let i = 0; i < needs.length; i++) {
    if (satisfies.includes(needs[i])) {
      return `#${i + 1} need (${needs.join(", ")})`;
    }
  }
  return `Not a need (${needs.join(", ")})`;
}

/**
 * Full-screen pick reaction takeover.
 * Shows chaos breakdown with full context, requires user to react before dismissing.
 */
export default function PickReactionScreen({
  slot, playerName, teamAbbrev, isBearsPick, priorPicks,
  roomCode, userName, onComplete,
}: PickReactionScreenProps) {
  const [reactions, setReactions] = useState<Record<string, UserReaction>>({});
  const [submitted, setSubmitted] = useState(false);

  const prospect = PROSPECTS.find((p) => p.name === playerName);
  const { level, tags } = calcChaosScore(slot, playerName, teamAbbrev, priorPicks);
  const espnProb = getPickProb(slot, playerName);

  // Check if this player was the #1 most likely pick for this slot
  const slotProbs = PICK_PROBS[slot] ?? {};
  const topProb = Math.max(0, ...Object.values(slotProbs));
  const isTopExpected = espnProb > 0 && espnProb >= topProb;
  const headshot = getHeadshot(playerName);
  const teamLogo = getTeamLogo(teamAbbrev);
  const colors = LEVEL_COLORS[level];

  const rankDrift = prospect ? slot - prospect.rank : 0;
  const needDesc = getNeedDescription(prospect?.position, teamAbbrev);

  // Listen for reactions (to show counts)
  useEffect(() => {
    return onReactions(roomCode, slot, setReactions);
  }, [roomCode, slot]);

  const counts: Record<string, number> = {};
  for (const r of Object.values(reactions)) {
    counts[r.reaction] = (counts[r.reaction] ?? 0) + 1;
  }

  async function handleReact(reaction: ReactionType) {
    await submitReaction(roomCode, slot, userName, {
      reaction,
      bearsTierCompId: null,
    });
    setSubmitted(true);
    // Brief pause to show selection before dismissing
    setTimeout(onComplete, 600);
  }

  const reactionOptions = isBearsPick ? POLES_OPTIONS : GRADE_OPTIONS;
  const reactionLabels = isBearsPick ? POLES_LABELS : GRADE_LABELS;
  const reactionColors = isBearsPick ? POLES_COLORS : GRADE_COLORS;

  return (
    <div className="fixed inset-0 z-[70] bg-bg/95 flex flex-col items-center justify-center p-4 animate-fade-in-up">
      {/* Team + Pick header */}
      <div className="flex items-center gap-3 mb-4">
        <img src={teamLogo} alt={teamAbbrev} className="w-10 h-10 object-contain" />
        <div>
          <p className="font-display text-2xl text-white tracking-wide">
            PICK #{slot}
          </p>
          <p className="font-condensed text-sm text-muted uppercase">{teamAbbrev}</p>
        </div>
      </div>

      {/* Player */}
      <div className="flex flex-col items-center mb-6">
        {headshot && (
          <img
            src={headshot}
            alt={playerName}
            className="w-24 h-24 rounded-full object-cover border-2 border-border mb-3"
          />
        )}
        <p className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          {playerName}
        </p>
        {prospect && (
          <p className="font-condensed text-sm text-muted uppercase mt-1">
            {prospect.position} · {prospect.college}
          </p>
        )}
      </div>

      {/* Chaos description — skip if this was the top expected pick */}
      {!isTopExpected && (
        <div className="text-center mb-4">
          <p className={`font-display text-2xl sm:text-3xl tracking-wider ${colors.text}`}>
            {level === "MILD" ? "SLIGHT SURPRISE"
              : level === "SPICY" ? "BIG SURPRISE"
              : "NOBODY SAW THIS COMING"}
          </p>
          {tags.length > 0 && (
            <div className="flex gap-2 justify-center mt-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`font-condensed text-sm font-bold uppercase px-3 py-1 rounded border ${colors.text} ${colors.border}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full breakdown */}
      <div className={`rounded border ${colors.border} ${colors.bg} px-4 py-3 mb-6 w-full max-w-sm`}>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="font-condensed text-muted uppercase text-xs">Odds</span>
          <span className={`font-mono text-right ${espnProb === 0 ? "text-red" : espnProb >= 50 ? "text-green" : "text-white"}`}>
            {espnProb > 0 ? `${espnProb}%` : "0%"}
          </span>

          <span className="font-condensed text-muted uppercase text-xs">Consensus</span>
          <span className="font-mono text-right text-white">
            #{prospect?.rank ?? "?"}
            {prospect && (
              <span className={`ml-1 ${
                rankDrift > 3 ? "text-red" : rankDrift < -3 ? "text-green" : "text-muted"
              }`}>
                ({rankDrift > 0 ? `+${rankDrift}` : rankDrift < 0 ? `${rankDrift}` : "exact"})
              </span>
            )}
          </span>

          <span className="font-condensed text-muted uppercase text-xs">Need</span>
          <span className={`font-mono text-right text-xs ${
            needDesc.startsWith("Not") ? "text-red" : needDesc.startsWith("#1") ? "text-green" : "text-white"
          }`}>
            {needDesc}
          </span>
        </div>
      </div>

      {/* Reaction area — pinned bottom section */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-5 z-[71]">
        <p className="font-condensed text-xs text-muted uppercase tracking-wider text-center mb-3">
          {isBearsPick ? "RATE THIS PICK" : "GRADE THIS PICK"}
        </p>
        <div className={`flex gap-2 justify-center max-w-sm mx-auto ${isBearsPick ? "" : "flex-wrap"}`}>
          {reactionOptions.map((opt) => {
            const isSelected = submitted && reactions[userName]?.reaction === opt;
            const count = counts[opt as string] ?? 0;
            return (
              <button
                key={opt}
                onClick={() => !submitted && handleReact(opt)}
                disabled={submitted}
                className={`flex-1 font-condensed text-xl font-bold uppercase py-3 rounded border transition-all ${
                  isSelected
                    ? (reactionColors as Record<string, string>)[opt] + " border-current scale-105"
                    : submitted
                      ? "text-muted/30 bg-surface-elevated border-border/30 cursor-not-allowed"
                      : "text-white bg-surface-elevated border-border-bright hover:border-white active:scale-95"
                }`}
              >
                {(reactionLabels as Record<string, string>)[opt]}
                {count > 0 && (
                  <span className="font-mono text-xs ml-1.5 opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
