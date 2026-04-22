import { getTierScoring } from "../data/scoring";
import type { ConfirmedPick, UserBracket } from "../types";

/**
 * Calculate bracket score for a user based on all confirmed picks.
 * Points scale by pick tier — later picks are worth more.
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
    const tier = getTierScoring(confirmed.pick);

    // Check exact match (player in correct slot)
    const exactMatch = bracket.picks.find(
      (bp) =>
        bp.playerName === confirmed.playerName && bp.slot === confirmed.pick
    );
    if (exactMatch) {
      score += tier.bracketExact;
      exact++;
      continue;
    }

    // Check player in any slot
    const playerMatch = bracket.picks.find(
      (bp) => bp.playerName === confirmed.playerName
    );
    if (playerMatch) {
      score += tier.bracketPartial;
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
  const tier = getTierScoring(pick.pick);

  for (const [userName, bracket] of Object.entries(allBrackets)) {
    if (!bracket?.picks) continue;

    const exactMatch = bracket.picks.find(
      (bp) =>
        bp.playerName === pick.playerName && bp.slot === pick.pick
    );
    if (exactMatch) {
      hits.push({ name: userName, points: tier.bracketExact });
      continue;
    }

    const playerMatch = bracket.picks.find(
      (bp) => bp.playerName === pick.playerName
    );
    if (playerMatch) {
      hits.push({ name: userName, points: tier.bracketPartial });
    }
  }

  return hits;
}

/**
 * Calculate live score for a user based on all confirmed picks and their guesses.
 * Points scale by pick tier. Bears picks = 2x the tiered value (derived from pick data).
 */
export function calcLiveScore(
  userName: string,
  confirmedPicks: ConfirmedPick[],
  allGuesses: Record<string, Record<string, string>>,
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
      const tier = getTierScoring(pick.pick);
      score += pick.isBearsPick
        ? tier.liveCorrect * 2
        : tier.liveCorrect;
    }
  }

  return { score: Math.max(0, score), hits };
}
