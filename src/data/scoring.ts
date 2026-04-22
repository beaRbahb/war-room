/**
 * Tiered difficulty scoring — later picks are worth more because they're harder to predict.
 * Chalk (1-8): consensus picks, lowest value.
 * Crystal Ball (25-32): near-impossible, highest value.
 * Bears double = 2x the tiered live value.
 */
export interface TierScoring {
  bracketExact: number;
  bracketPartial: number;
  liveCorrect: number;
}

const TIERS: { maxPick: number; scoring: TierScoring }[] = [
  { maxPick: 8, scoring: { bracketExact: 5, bracketPartial: 3, liveCorrect: 3 } },
  { maxPick: 16, scoring: { bracketExact: 10, bracketPartial: 3, liveCorrect: 5 } },
  { maxPick: 24, scoring: { bracketExact: 15, bracketPartial: 3, liveCorrect: 7 } },
  { maxPick: 32, scoring: { bracketExact: 20, bracketPartial: 3, liveCorrect: 10 } },
];

/** Get scoring values for a pick based on its tier */
export function getTierScoring(pickNumber: number): TierScoring {
  for (const tier of TIERS) {
    if (pickNumber <= tier.maxPick) return tier.scoring;
  }
  return TIERS[TIERS.length - 1].scoring;
}

/** Maximum players per room */
export const MAX_ROOM_PLAYERS = 20;

/** Live guess window duration in seconds */
export const GUESS_WINDOW_SECONDS = 90;

/** Seconds remaining when flash-red warning triggers */
export const FLASH_WARNING_SECONDS = 10;

/** Dramatic pause duration in ms after pick reveal */
export const REVEAL_PAUSE_MS = 1500;

/** Bracket lock time: April 24, 2026 at 8:00pm ET */
export const BRACKET_LOCK_TIME = new Date("2026-04-24T20:00:00-04:00");

