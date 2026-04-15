import {
  BRACKET_EXACT_MATCH,
  BRACKET_PLAYER_ONLY,
  LIVE_CORRECT,
  LIVE_CORRECT_BEARS_DOUBLE,
} from "../data/scoring";
import type { ConfirmedPick, UserBracket } from "../types";

/**
 * Calculate bracket score for a user based on all confirmed picks.
 * Correct player + correct slot = 10, correct player + wrong slot = 4.
 */
export function calcBracketScore(
  bracket: UserBracket | null,
  confirmedPicks: ConfirmedPick[]
): number {
  if (!bracket?.picks) return 0;

  let score = 0;
  for (const confirmed of confirmedPicks) {
    // Check exact match (player in correct slot)
    const exactMatch = bracket.picks.find(
      (bp) =>
        bp.playerName === confirmed.playerName && bp.slot === confirmed.pick
    );
    if (exactMatch) {
      score += BRACKET_EXACT_MATCH;
      continue;
    }

    // Check player in any slot
    const playerMatch = bracket.picks.find(
      (bp) => bp.playerName === confirmed.playerName
    );
    if (playerMatch) {
      score += BRACKET_PLAYER_ONLY;
    }
  }

  return score;
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
 */
export function calcLiveScore(
  userName: string,
  confirmedPicks: ConfirmedPick[],
  allGuesses: Record<string, Record<string, string>>,
  bearsDoublePicks: Set<number>
): number {
  let score = 0;

  for (const pick of confirmedPicks) {
    const pickGuesses = allGuesses[`pick${pick.pick}`];
    if (!pickGuesses) continue;

    const guess = pickGuesses[userName];
    if (guess === pick.playerName) {
      score += bearsDoublePicks.has(pick.pick)
        ? LIVE_CORRECT_BEARS_DOUBLE
        : LIVE_CORRECT;
    }
  }

  return score;
}
