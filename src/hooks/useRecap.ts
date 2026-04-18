import { useState, useEffect, useCallback } from "react";
import { getAllGuesses, getAllReactions } from "../lib/storage";
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
  } | null>(null);

  useEffect(() => {
    if (!roomCode || confirmedPicks.length < 32) return;
    async function compute() {
      const [guesses, reactions] = await Promise.all([
        getAllGuesses(roomCode!),
        getAllReactions(roomCode!),
      ]);
      const personaResult = assignPersonas(confirmedPicks, guesses, brackets, scores, reactions);
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
      setRecapData({ users: userRecaps, room: roomRecap, entries: sortedEntries });
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
