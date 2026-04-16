import { getPickProb } from "../data/prospectOdds";
import { PROSPECTS } from "../data/prospects";
import { TEAM_NEEDS } from "../data/teamNeeds";
import { isBlockbusterTrade } from "../data/blockbusterTrades";

export type ChaosLevel = "CHALK" | "MILD" | "SPICY" | "CHAOS";

export interface ChaosResult {
  score: number; // 0-99
  level: ChaosLevel;
  /** 1-3 human-readable context tags (e.g. "REACH +12", "OFF NEED") */
  tags: string[];
}

/** Maps prospect positions → team need positions they satisfy */
const POSITION_NEED_MAP: Record<string, string[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  OT: ["OL", "OT"],
  IOL: ["OL", "OG", "C"],
  DL: ["DL", "DT"],
  EDGE: ["EDGE"],
  "EDGE/LB": ["EDGE", "LB"],
  LB: ["LB"],
  CB: ["CB"],
  S: ["S"],
};

/**
 * Find where a player's position falls in a team's need list.
 * Returns index (0 = top need) or -1 if no match.
 */
function findNeedIndex(position: string | undefined, teamNeeds: string[]): number {
  if (!position) return -1;
  const satisfies = POSITION_NEED_MAP[position] ?? [position];
  for (let i = 0; i < teamNeeds.length; i++) {
    if (satisfies.includes(teamNeeds[i])) return i;
  }
  return -1;
}

/**
 * Check if two positions belong to the same group for run detection.
 */
function samePositionGroup(a: string, b: string): boolean {
  if (a === b) return true;
  const groups = [
    ["OT", "IOL"],     // offensive line
    ["DL", "EDGE"],    // defensive front
    ["EDGE", "EDGE/LB", "LB"], // edge/linebacker
  ];
  return groups.some((g) => g.includes(a) && g.includes(b));
}

/**
 * Calculate how surprising a pick was using multiple signals.
 * Higher score = more surprising.
 *
 * When called with just (slot, playerName), uses ESPN prob + rank drift (80% of weight).
 * With full context, adds need mismatch + position run signals.
 */
export function calcChaosScore(
  slot: number,
  playerName: string,
  teamAbbrev?: string,
  priorPicks?: { position: string }[],
): ChaosResult {
  const prospect = PROSPECTS.find((p) => p.name === playerName);
  const bt = isBlockbusterTrade(playerName);
  const playerPosition = prospect?.position ?? bt?.position;
  const tags: string[] = [];

  // ── ESPN probability signal (weight: 55%) ──
  const prob = getPickProb(slot, playerName);
  const espnRaw = prob === 0 ? 99 : Math.round(100 - prob);

  if (prob === 0) tags.push("0% ODDS");
  else if (prob >= 70) tags.push("CHALK PICK");

  // ── Rank drift signal (weight: 25%) ──
  let rankDriftRaw = 50; // neutral default
  if (prospect) {
    const drift = slot - prospect.rank; // positive = picked before rank (reach)
    const absDrift = Math.abs(drift);
    rankDriftRaw = Math.min(100, Math.round((absDrift / 15) * 100));

    if (drift > 0 && absDrift >= 5) {
      tags.push(`REACH +${absDrift}`);
    } else if (drift < 0 && absDrift >= 8) {
      tags.push(`STEAL`);
    } else if (drift < 0 && absDrift >= 5) {
      tags.push(`VALUE`);
    }
  }

  // ── Need mismatch signal (weight: 15%) ──
  let needRaw = 50; // neutral when no team context
  if (teamAbbrev) {
    const needs = TEAM_NEEDS[teamAbbrev] ?? [];
    const needIdx = findNeedIndex(playerPosition, needs);
    if (needIdx === -1) {
      needRaw = 100;
      tags.push("OFF NEED");
    } else if (needIdx === 0) {
      needRaw = 0;
      tags.push("TOP NEED");
    } else {
      needRaw = needIdx * 25; // #1=25, #2=50, #3=75
    }
  }

  // ── Position run signal (weight: 5%, dampener) ──
  let posRunRaw = 50; // neutral when no context
  if (priorPicks && playerPosition) {
    const recent = priorPicks.slice(-3);
    const sameCount = recent.filter((p) =>
      samePositionGroup(p.position, playerPosition),
    ).length;
    // More same-position picks recently → less individually surprising
    posRunRaw = sameCount === 0 ? 50 : sameCount === 1 ? 35 : 15;
    if (sameCount >= 2) {
      tags.push(`${playerPosition} RUN`);
    }
  }

  // ── Composite score ──
  const composite = Math.round(
    espnRaw * 0.55 +
    rankDriftRaw * 0.25 +
    needRaw * 0.15 +
    posRunRaw * 0.05,
  );
  const score = Math.max(0, Math.min(99, composite));

  let level: ChaosLevel;
  if (score <= 30) level = "CHALK";
  else if (score <= 60) level = "MILD";
  else if (score <= 80) level = "SPICY";
  else level = "CHAOS";

  // Ensure every pick has at least 1 tag
  if (tags.length === 0) {
    if (score <= 30) tags.push("BPA");
    else tags.push("SURPRISE");
  }

  return { score, level, tags: tags.slice(0, 3) };
}
