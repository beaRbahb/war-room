import { getPickProb } from "../data/prospectOdds";

export type ChaosLevel = "CHALK" | "MILD" | "SPICY" | "CHAOS";

export interface ChaosResult {
  score: number; // 0-99
  level: ChaosLevel;
}

/**
 * Calculate how surprising a pick was based on ESPN probabilities.
 * Higher score = more surprising.
 */
export function calcChaosScore(slot: number, playerName: string): ChaosResult {
  const prob = getPickProb(slot, playerName);
  const score = prob === 0 ? 99 : Math.round(100 - prob);

  let level: ChaosLevel;
  if (score <= 30) level = "CHALK";
  else if (score <= 60) level = "MILD";
  else if (score <= 80) level = "SPICY";
  else level = "CHAOS";

  return { score, level };
}
