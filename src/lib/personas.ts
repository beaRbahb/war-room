import { calcChaosScore } from "./chaos";
import { getPickProb } from "../data/prospectOdds";
import type { ConfirmedPick, UserBracket, UserScores } from "../types";

export type PersonaType =
  | "THE_ORACLE"
  | "THE_GAMBLER"
  | "THE_ANALYST"
  | "THE_CONTRARIAN"
  | "THE_STREAK";

export interface PersonaInfo {
  type: PersonaType;
  label: string;
  description: string;
}

export const PERSONA_META: Record<PersonaType, Omit<PersonaInfo, "type">> = {
  THE_ORACLE: { label: "The Oracle", description: "Highest overall accuracy" },
  THE_GAMBLER: { label: "The Gambler", description: "Predicted the most upsets" },
  THE_ANALYST: { label: "The Analyst", description: "Most consistent scorer" },
  THE_CONTRARIAN: { label: "The Contrarian", description: "Went against the grain" },
  THE_STREAK: { label: "The Streak", description: "Longest correct run" },
};

export const PERSONA_COLORS: Record<PersonaType, string> = {
  THE_ORACLE: "text-amber bg-amber/10 border-amber/30",
  THE_GAMBLER: "text-red bg-red/10 border-red/30",
  THE_ANALYST: "text-green bg-green/10 border-green/30",
  THE_CONTRARIAN: "text-muted bg-surface-elevated border-border",
  THE_STREAK: "text-amber bg-amber/10 border-amber/30",
};

/**
 * Assign one persona per user, one user per persona.
 * Priority: Oracle > Gambler > Analyst > Contrarian > Streak.
 */
export function assignPersonas(
  confirmedPicks: ConfirmedPick[],
  allGuesses: Record<string, Record<string, string>>,
  _allBrackets: Record<string, UserBracket>,
  scores: Record<string, UserScores>,
): Record<string, PersonaType> {
  const userNames = Object.keys(scores);
  if (userNames.length === 0) return {};

  const assigned: Record<string, PersonaType> = {};
  const taken = new Set<string>();

  function assign(persona: PersonaType, winner: string | null) {
    if (!winner || taken.has(winner)) return;
    assigned[winner] = persona;
    taken.add(winner);
  }

  // THE ORACLE — highest total score
  assign("THE_ORACLE", findOracle(userNames, scores, taken));

  // THE GAMBLER — most correct guesses on high-chaos picks
  assign("THE_GAMBLER", findGambler(userNames, confirmedPicks, allGuesses, taken));

  // THE ANALYST — most consistent (smallest bracket-live gap relative to total)
  assign("THE_ANALYST", findAnalyst(userNames, scores, taken));

  // THE CONTRARIAN — most picks against ESPN consensus
  assign("THE_CONTRARIAN", findContrarian(userNames, confirmedPicks, allGuesses, taken));

  // THE STREAK — longest consecutive correct live guesses
  assign("THE_STREAK", findStreak(userNames, confirmedPicks, allGuesses, taken));

  return assigned;
}

function findOracle(
  users: string[], scores: Record<string, UserScores>, taken: Set<string>
): string | null {
  let best: string | null = null;
  let bestScore = -1;
  for (const name of users) {
    if (taken.has(name)) continue;
    const total = (scores[name]?.bracketScore || 0) + (scores[name]?.liveScore || 0);
    if (total > bestScore) { bestScore = total; best = name; }
  }
  return best;
}

function findGambler(
  users: string[], picks: ConfirmedPick[],
  guesses: Record<string, Record<string, string>>, taken: Set<string>
): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const name of users) {
    if (taken.has(name)) continue;
    let count = 0;
    for (const pick of picks) {
      const g = guesses[`pick${pick.pick}`]?.[name];
      if (g === pick.playerName) {
        const chaos = calcChaosScore(pick.pick, pick.playerName);
        if (chaos.score > 60) count++;
      }
    }
    if (count > bestCount) { bestCount = count; best = name; }
  }
  return bestCount > 0 ? best : null;
}

function findAnalyst(
  users: string[], scores: Record<string, UserScores>, taken: Set<string>
): string | null {
  let best: string | null = null;
  let bestRatio = Infinity;
  for (const name of users) {
    if (taken.has(name)) continue;
    const s = scores[name];
    if (!s) continue;
    const total = s.bracketScore + s.liveScore;
    if (total === 0) continue;
    const ratio = Math.abs(s.bracketScore - s.liveScore) / total;
    if (ratio < bestRatio) { bestRatio = ratio; best = name; }
  }
  return best;
}

function findContrarian(
  users: string[], picks: ConfirmedPick[],
  guesses: Record<string, Record<string, string>>, taken: Set<string>
): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const name of users) {
    if (taken.has(name)) continue;
    let count = 0;
    for (const pick of picks) {
      const g = guesses[`pick${pick.pick}`]?.[name];
      if (!g) continue;
      // Find the ESPN favorite for this slot
      const prob = getPickProb(pick.pick, g);
      // If user picked someone with < 10% probability, that's contrarian
      if (prob < 10) count++;
    }
    if (count > bestCount) { bestCount = count; best = name; }
  }
  return bestCount > 0 ? best : null;
}

function findStreak(
  users: string[], picks: ConfirmedPick[],
  guesses: Record<string, Record<string, string>>, taken: Set<string>
): string | null {
  const sorted = [...picks].sort((a, b) => a.pick - b.pick);

  let best: string | null = null;
  let bestStreak = 0;
  for (const name of users) {
    if (taken.has(name)) continue;
    let streak = 0;
    let maxStreak = 0;
    for (const pick of sorted) {
      const g = guesses[`pick${pick.pick}`]?.[name];
      if (g === pick.playerName) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
    }
    if (maxStreak > bestStreak) { bestStreak = maxStreak; best = name; }
  }
  return bestStreak > 0 ? best : null;
}
