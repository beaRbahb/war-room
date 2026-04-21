import { calcChaosScore } from "./chaos";
import { BEARS_PICK } from "../data/draftOrder";
import type { ConfirmedPick, UserBracket, UserScores } from "../types";

export interface UserRecapStats {
  name: string;
  rank: number;
  totalScore: number;
  bracketScore: number;
  liveScore: number;
  bracketPlayersCorrect: number;
  bracketExactSlots: number;
  liveCorrect: number;
  liveTotal: number;
  longestStreak: number;
  bestCall: { pick: ConfirmedPick; chaosScore: number } | null;
  bestBracketCall: { pick: ConfirmedPick; chaosScore: number } | null;
  bearsPrediction: {
    bracketPick: string | null;
    livePick: string | null;
    actual: string;
  } | null;
}

export interface RoomRecapStats {
  winner: { name: string; score: number };
  totalPicks: number;
  mostChaosPick: { pick: ConfirmedPick; chaosScore: number } | null;
  mostChalkPick: { pick: ConfirmedPick; chaosScore: number } | null;
  roomAccuracy: number;
  avgChaos: number;
  surprisePicks: number;
}

export function calcUserRecap(
  userName: string,
  bracket: UserBracket | null,
  confirmedPicks: ConfirmedPick[],
  allGuesses: Record<string, Record<string, string>>,
  scores: UserScores,
  rank: number
): UserRecapStats {
  let bracketPlayersCorrect = 0;
  let bracketExactSlots = 0;
  let liveCorrect = 0;
  let bestCall: { pick: ConfirmedPick; chaosScore: number } | null = null;
  let bestBracketCall: { pick: ConfirmedPick; chaosScore: number } | null = null;

  for (const pick of confirmedPicks) {
    // Bracket checks
    if (bracket?.picks) {
      const exact = bracket.picks.find(
        (bp) => bp.playerName === pick.playerName && bp.slot === pick.pick
      );
      if (exact) {
        bracketPlayersCorrect++;
        bracketExactSlots++;
        // Track best bracket call (exact slot hit with highest chaos)
        const chaos = calcChaosScore(pick.pick, pick.playerName);
        if (!bestBracketCall || chaos.score > bestBracketCall.chaosScore) {
          bestBracketCall = { pick, chaosScore: chaos.score };
        }
      } else {
        const playerMatch = bracket.picks.find(
          (bp) => bp.playerName === pick.playerName
        );
        if (playerMatch) bracketPlayersCorrect++;
      }
    }

    // Live checks
    const guess = allGuesses[`pick${pick.pick}`]?.[userName];
    if (guess === pick.playerName) {
      liveCorrect++;
      const chaos = calcChaosScore(pick.pick, pick.playerName);
      if (!bestCall || chaos.score > bestCall.chaosScore) {
        bestCall = { pick, chaosScore: chaos.score };
      }
    }
  }

  // Longest streak of consecutive correct live guesses
  const sorted = [...confirmedPicks].sort((a, b) => a.pick - b.pick);
  let streak = 0;
  let longestStreak = 0;
  for (const pick of sorted) {
    const guess = allGuesses[`pick${pick.pick}`]?.[userName];
    if (guess === pick.playerName) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Bears prediction
  let bearsPrediction: UserRecapStats["bearsPrediction"] = null;
  const bearsPick = confirmedPicks.find((p) => p.pick === BEARS_PICK);
  if (bearsPick) {
    const bracketBears = bracket?.picks?.find((bp) => bp.slot === BEARS_PICK);
    const liveBears = allGuesses[`pick${BEARS_PICK}`]?.[userName];
    bearsPrediction = {
      bracketPick: bracketBears?.playerName || null,
      livePick: liveBears || null,
      actual: bearsPick.playerName,
    };
  }

  return {
    name: userName,
    rank,
    totalScore: scores.bracketScore + scores.liveScore,
    bracketScore: scores.bracketScore,
    liveScore: scores.liveScore,
    bracketPlayersCorrect,
    bracketExactSlots,
    liveCorrect,
    liveTotal: confirmedPicks.length,
    longestStreak,
    bestCall,
    bestBracketCall,
    bearsPrediction,
  };
}

export function calcRoomRecap(
  confirmedPicks: ConfirmedPick[],
  allGuesses: Record<string, Record<string, string>>,
  scores: Record<string, UserScores>
): RoomRecapStats {
  // Winner
  let winnerName = "";
  let winnerScore = -1;
  for (const [name, s] of Object.entries(scores)) {
    const total = s.bracketScore + s.liveScore;
    if (total > winnerScore) {
      winnerScore = total;
      winnerName = name;
    }
  }

  // Chaos stats
  let mostChaosPick: RoomRecapStats["mostChaosPick"] = null;
  let mostChalkPick: RoomRecapStats["mostChalkPick"] = null;
  let totalChaos = 0;
  let surprisePicks = 0;

  for (const pick of confirmedPicks) {
    const chaos = calcChaosScore(pick.pick, pick.playerName);
    totalChaos += chaos.score;
    if (chaos.score > 60) surprisePicks++;
    if (!mostChaosPick || chaos.score > mostChaosPick.chaosScore) {
      mostChaosPick = { pick, chaosScore: chaos.score };
    }
    if (!mostChalkPick || chaos.score < mostChalkPick.chaosScore) {
      mostChalkPick = { pick, chaosScore: chaos.score };
    }
  }

  // Room accuracy
  let totalGuesses = 0;
  let correctGuesses = 0;
  for (const pick of confirmedPicks) {
    const pickGuesses = allGuesses[`pick${pick.pick}`];
    if (!pickGuesses) continue;
    for (const guess of Object.values(pickGuesses)) {
      totalGuesses++;
      if (guess === pick.playerName) correctGuesses++;
    }
  }

  return {
    winner: { name: winnerName, score: winnerScore },
    totalPicks: confirmedPicks.length,
    mostChaosPick,
    mostChalkPick,
    roomAccuracy: totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0,
    avgChaos: confirmedPicks.length > 0 ? Math.round(totalChaos / confirmedPicks.length) : 0,
    surprisePicks,
  };
}
