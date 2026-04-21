import { useState, useEffect, useCallback } from "react";
import { getAllGuesses } from "../lib/storage";
import { assignPersonas, type PersonaType } from "../lib/personas";
import {
  calcUserRecap,
  calcRoomRecap,
  type UserRecapStats,
  type RoomRecapStats,
} from "../lib/recap";
import type {
  ConfirmedPick,
  UserScores,
  UserBracket,
  LeaderboardEntry,
} from "../types";

interface UseRecapParams {
  roomCode: string | undefined;
  confirmedPicks: ConfirmedPick[];
  brackets: Record<string, UserBracket>;
  scores: Record<string, UserScores>;
}

/**
 * Recap + personas computation. Triggers when all 32 picks are confirmed.
 * Zero interaction with the pick cycle — pure post-draft summary.
 */
export function useRecap({
  roomCode,
  confirmedPicks,
  brackets,
  scores,
}: UseRecapParams) {
  const [personas, setPersonas] = useState<Record<string, PersonaType>>({});
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<{
    users: UserRecapStats[];
    room: RoomRecapStats;
    entries: LeaderboardEntry[];
    bracketWinner: UserRecapStats | null;
    liveWinner: UserRecapStats | null;
  } | null>(null);

  useEffect(() => {
    if (!roomCode || confirmedPicks.length < 32) return;
    async function compute() {
      const guesses = await getAllGuesses(roomCode!);
      const personaResult = assignPersonas(confirmedPicks, guesses, brackets, scores);
      setPersonas(personaResult);

      const sortedEntries: LeaderboardEntry[] = Object.entries(scores)
        .map(([name, s]) => ({
          name,
          bracketScore: s.bracketScore,
          liveScore: s.liveScore,
          totalScore: s.bracketScore + s.liveScore,
          liveHits: s.liveHits || 0,
          bracketExact: s.bracketExact || 0,
          bracketPartial: s.bracketPartial || 0,
        }))
        .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

      const userRecaps = sortedEntries.map((entry, i) =>
        calcUserRecap(entry.name, brackets[entry.name] || null, confirmedPicks, guesses, scores[entry.name], i + 1)
      );
      const roomRecap = calcRoomRecap(confirmedPicks, guesses, scores);

      // Derive bracket + live winners (only from users who have bracket/live scores)
      const bracketWinner = userRecaps.length > 0
        ? userRecaps.reduce((best, u) => u.bracketScore > best.bracketScore ? u : best)
        : null;
      const liveWinner = userRecaps.length > 0
        ? userRecaps.reduce((best, u) => u.liveScore > best.liveScore ? u : best)
        : null;

      setRecapData({ users: userRecaps, room: roomRecap, entries: sortedEntries, bracketWinner, liveWinner });
    }
    compute();
  }, [roomCode, confirmedPicks, brackets, scores]);

  const resetRecapState = useCallback(() => {
    setShowRecap(false);
    setRecapData(null);
    setPersonas({});
  }, []);

  return {
    personas,
    showRecap,
    setShowRecap,
    recapData,
    resetRecapState,
  };
}
