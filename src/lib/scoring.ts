import {
  BRACKET_EXACT_MATCH,
  BRACKET_PLAYER_ONLY,
  LIVE_CORRECT,
  LIVE_CORRECT_BEARS_DOUBLE,
} from "../data/scoring";
import type { ConfirmedPick, UserBracket, Wager } from "../types";

/**
 * Calculate bracket score for a user based on all confirmed picks.
 * Correct player + correct slot = 10, correct player + wrong slot = 4.
 */
export function calcBracketScore(
  bracket: UserBracket | null,
  confirmedPicks: ConfirmedPick[]
): { score: number; exact: number; partial: number } {
  if (!bracket?.picks) return { score: 0, exact: 0, partial: 0 };

  let score = 0;
  let exact = 0;
  let partial = 0;
  for (const confirmed of confirmedPicks) {
    // Check exact match (player in correct slot)
    const exactMatch = bracket.picks.find(
      (bp) =>
        bp.playerName === confirmed.playerName && bp.slot === confirmed.pick
    );
    if (exactMatch) {
      score += BRACKET_EXACT_MATCH;
      exact++;
      continue;
    }

    // Check player in any slot
    const playerMatch = bracket.picks.find(
      (bp) => bp.playerName === confirmed.playerName
    );
    if (playerMatch) {
      score += BRACKET_PLAYER_ONLY;
      partial++;
    }
  }

  return { score, exact, partial };
}

/**
 * Get bracket hits for a single pick across all users.
 * Returns array of { name, points } for users who got it right.
 */
export function getBracketHitsForPick(
  pick: ConfirmedPick,
  allBrackets: Record<string, UserBracket>
): { name: string; points: number }[] {
  const hits: { name: string; points: number }[] = [];

  for (const [userName, bracket] of Object.entries(allBrackets)) {
    if (!bracket?.picks) continue;

    const exactMatch = bracket.picks.find(
      (bp) =>
        bp.playerName === pick.playerName && bp.slot === pick.pick
    );
    if (exactMatch) {
      hits.push({ name: userName, points: BRACKET_EXACT_MATCH });
      continue;
    }

    const playerMatch = bracket.picks.find(
      (bp) => bp.playerName === pick.playerName
    );
    if (playerMatch) {
      hits.push({ name: userName, points: BRACKET_PLAYER_ONLY });
    }
  }

  return hits;
}

/**
 * Calculate live score for a user based on all confirmed picks and their guesses.
 * Optionally includes wager bonuses/penalties.
 */
export function calcLiveScore(
  userName: string,
  confirmedPicks: ConfirmedPick[],
  allGuesses: Record<string, Record<string, string>>,
  bearsDoublePicks: Set<number>,
  allWagers?: Record<string, Record<string, Wager>>
): { score: number; hits: number } {
  let score = 0;
  let hits = 0;

  for (const pick of confirmedPicks) {
    const pickKey = `pick${pick.pick}`;
    const pickGuesses = allGuesses[pickKey];
    if (!pickGuesses) continue;

    const guess = pickGuesses[userName];
    const correct = guess === pick.playerName;

    if (correct) {
      hits++;
      score += bearsDoublePicks.has(pick.pick)
        ? LIVE_CORRECT_BEARS_DOUBLE
        : LIVE_CORRECT;
    }

    // Wager bonus/penalty
    const wager = allWagers?.[pickKey]?.[userName];
    if (wager && wager.amount > 0) {
      score += correct ? wager.amount : -wager.amount;
    }
  }

  return { score: Math.max(0, score), hits };
}
