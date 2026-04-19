import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PROSPECTS } from "../data/prospects";
import { GUESS_WINDOW_SECONDS } from "../data/scoring";
import {
  updateScores,
  updateLiveState,
  onGuesses,
  submitGuess,
  getGuessesForPick,
} from "../lib/storage";
import { calcBracketScore, calcLiveScore } from "../lib/scoring";
import {
  isBlockbusterTrade,
  type BlockbusterTradePlayer,
} from "../data/blockbusterTrades";
import { playDraftChime } from "../lib/sounds";
import type {
  LiveState,
  ConfirmedPick,
  UserBracket,
  RoomUser,
  UserSession,
} from "../types";

// ── All-guesses type alias ──
type AllGuesses = Record<string, Record<string, string>>;

// ── Chaos flash data shape ──
export interface ChaosFlashData {
  slot: number;
  playerName: string;
  teamAbbrev: string;
  isBearsPick: boolean;
  priorPicks: { position: string }[];
}

// ── Animation state machine ──
export type AnimationState =
  | null // idle
  | { type: "bears"; flashData: ChaosFlashData }
  | { type: "blockbuster"; trade: BlockbusterTradePlayer; flashData: ChaosFlashData }
  | { type: "confetti"; team: string; flashData: ChaosFlashData }
  | { type: "reaction"; flashData: ChaosFlashData };

interface UseLivePickCycleParams {
  roomCode: string | undefined;
  session: UserSession | null;
  isLive: boolean;
  liveState: LiveState | null;
  confirmedPicks: ConfirmedPick[];
  users: Record<string, RoomUser>;
  brackets: Record<string, UserBracket>;
}

/**
 * Manages the live pick cycle: guess window, animations, scoring, Room Pulse, and recap.
 * These concerns share the same timeline — window opens → guesses flow → window closes →
 * Room Pulse shows → pick confirmed → animations fire → scoring runs → next pick.
 */
export function useLivePickCycle({
  roomCode,
  session,
  isLive,
  liveState,
  confirmedPicks,
  users,
  brackets,
}: UseLivePickCycleParams) {
  // ── Internal state: allGuesses (owned here — sole writer + primary reader) ──
  const [allGuesses, setAllGuesses] = useState<AllGuesses>({});

  // ── Closure-escape refs (local to this hook) ──
  const usersRef = useRef(users);
  usersRef.current = users;
  const bracketsRef = useRef(brackets);
  bracketsRef.current = brackets;
  const allGuessesRef = useRef(allGuesses);
  allGuessesRef.current = allGuesses;

  /** Update guesses for a specific pick */
  const updateGuessesForPick = useCallback(
    (pickKey: string, guesses: Record<string, string>) => {
      setAllGuesses((prev) => ({ ...prev, [pickKey]: guesses }));
    },
    []
  );
  // ═══════════════════════════════════════
  // GUESS TRACKING
  // ═══════════════════════════════════════

  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [guessCount, setGuessCount] = useState(0);

  const prevPickRef = useRef<number>(1);
  const prevGuessResetRef = useRef<string | null>(null);

  // ── Track guess count (real-time listener) ──
  useEffect(() => {
    if (!roomCode || !liveState?.windowOpen) {
      setGuessCount(0);
      return;
    }
    return onGuesses(roomCode, liveState.currentPick, (guesses) => {
      setGuessCount(Object.keys(guesses).length);
      updateGuessesForPick(`pick${liveState.currentPick}`, guesses);
    });
  }, [roomCode, liveState?.windowOpen, liveState?.currentPick, updateGuessesForPick]);

  // ── Reset guess state when pick advances ──
  useEffect(() => {
    if (!liveState) return;
    if (liveState.currentPick !== prevPickRef.current) {
      setCurrentGuess(null);
      setGuessSubmitted(false);
      prevPickRef.current = liveState.currentPick;
    }
  }, [liveState?.currentPick]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally only react to pick changes

  // ── Reset guess state when commissioner reassigns team (guessResetAt signal) ──
  useEffect(() => {
    if (!liveState?.guessResetAt) return;
    if (prevGuessResetRef.current !== liveState.guessResetAt) {
      // Skip the initial mount — only react to changes
      if (prevGuessResetRef.current !== null) {
        setCurrentGuess(null);
        setGuessSubmitted(false);
        setGuessCount(0);
      }
      prevGuessResetRef.current = liveState.guessResetAt;
    }
  }, [liveState?.guessResetAt]);

  // ── Auto-submit on timer expiry ──
  useEffect(() => {
    if (!roomCode || !session || !liveState?.windowOpen || !liveState.windowOpenedAt) return;
    if (guessSubmitted) return;

    const openedMs = new Date(liveState.windowOpenedAt).getTime();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - openedMs) / 1000;
      if (elapsed >= GUESS_WINDOW_SECONDS && !guessSubmitted) {
        if (currentGuess) {
          submitGuess(roomCode, liveState.currentPick, session.name, currentGuess);
          setGuessSubmitted(true);
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [roomCode, session, liveState?.windowOpen, liveState?.windowOpenedAt, liveState?.currentPick, currentGuess, guessSubmitted]);

  // ── Auto-close window on timer expiry (all clients) ──
  useEffect(() => {
    if (!roomCode || !liveState?.windowOpen || !liveState.windowOpenedAt) return;

    const openedMs = new Date(liveState.windowOpenedAt).getTime();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - openedMs) / 1000;
      if (elapsed >= GUESS_WINDOW_SECONDS) {
        updateLiveState(roomCode, { windowOpen: false });
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [roomCode, liveState?.windowOpen, liveState?.windowOpenedAt]);

  // ── Guess handlers (no UI state like activeSlot — orchestrator wraps) ──

  /** Select a player (doesn't submit yet) */
  function handleLiveSelect(playerName: string) {
    if (!roomCode || !session || !liveState) return;
    if (!liveState.windowOpen) return;
    setCurrentGuess(playerName);
  }

  /** Lock in the current guess to Firebase */
  async function handleLiveSubmit() {
    if (!roomCode || !session || !liveState || !currentGuess) return;
    if (!liveState.windowOpen) return;
    await submitGuess(roomCode, liveState.currentPick, session.name, currentGuess);
    setGuessSubmitted(true);
  }

  /** Reset guess state (called by orchestrator on reassign/reset) */
  const resetGuessState = useCallback(() => {
    setCurrentGuess(null);
    setGuessSubmitted(false);
    setGuessCount(0);
  }, []);

  // ═══════════════════════════════════════
  // PICK PROCESSING + ANIMATIONS
  // ═══════════════════════════════════════

  const [animation, setAnimation] = useState<AnimationState>(null);

  const processedPicks = useRef<Set<number>>(new Set());
  const bearsDoublePicks = useRef<Set<number>>(new Set());

  /** Advance from overlay phase (bears/blockbuster/confetti) to reaction screen */
  const advanceToReaction = useCallback(() => {
    setAnimation((prev) => (prev ? { type: "reaction", flashData: prev.flashData } : null));
  }, []);

  /** Dismiss animation entirely */
  const dismissAnimation = useCallback(() => {
    setAnimation(null);
  }, []);

  /** Determine which animation to show based on pick context */
  function triggerAnimation(
    latest: ConfirmedPick,
    flashData: ChaosFlashData,
    guesses: Record<string, string>,
    userName: string,
  ) {
    playDraftChime();
    const bt = isBlockbusterTrade(latest.playerName);
    if (latest.isBearsPick && bt) {
      setAnimation({ type: "blockbuster", trade: bt, flashData });
    } else if (latest.isBearsPick) {
      setAnimation({ type: "bears", flashData });
    } else if (guesses[userName] === latest.playerName) {
      setAnimation({ type: "confetti", team: latest.teamAbbrev, flashData });
    } else {
      setAnimation({ type: "reaction", flashData });
    }
  }

  /** Calculate and write scores for all users (uses refs for latest state) */
  function computeScores(
    code: string,
    picks: ConfirmedPick[],
    pickGuessKey: string,
    guesses: Record<string, string>,
  ) {
    const allUsers = Object.values(usersRef.current);
    allUsers.forEach((user: RoomUser) => {
      const bracketResult = calcBracketScore(bracketsRef.current[user.name] || null, picks);
      const live = calcLiveScore(
        user.name,
        picks,
        { ...allGuessesRef.current, [pickGuessKey]: guesses },
        bearsDoublePicks.current,
      );
      updateScores(code, user.name, {
        bracketScore: bracketResult.score,
        liveScore: live.score,
        liveHits: live.hits,
        bracketExact: bracketResult.exact,
        bracketPartial: bracketResult.partial,
      });
    });
  }

  // ── Watch for new picks: animation + scoring ──
  useEffect(() => {
    if (!roomCode || !session || !isLive) return;
    if (confirmedPicks.length === 0) return;

    const latest = confirmedPicks[confirmedPicks.length - 1];
    if (processedPicks.current.has(latest.pick)) return;

    // Late joiner / refresh: pre-seed processedPicks to skip stale animations
    const isLateJoin = processedPicks.current.size === 0 && confirmedPicks.length >= 1;
    if (isLateJoin) {
      confirmedPicks.forEach((p) => processedPicks.current.add(p.pick));
    } else {
      processedPicks.current.add(latest.pick);
    }

    if (liveState?.bearsDoubleActive) {
      bearsDoublePicks.current.add(latest.pick);
    }

    const priorPicks = confirmedPicks
      .filter((p) => p.pick < latest.pick)
      .map((p) => ({
        position: PROSPECTS.find((pr) => pr.name === p.playerName)?.position ?? "",
      }));
    const flashData: ChaosFlashData = {
      slot: latest.pick,
      playerName: latest.playerName,
      teamAbbrev: latest.teamAbbrev,
      isBearsPick: latest.isBearsPick,
      priorPicks,
    };

    const pickGuessKey = `pick${latest.pick}`;
    const userName = session.name;

    (async () => {
      const guesses = await getGuessesForPick(roomCode, latest.pick);
      updateGuessesForPick(pickGuessKey, guesses);
      if (!isLateJoin) triggerAnimation(latest, flashData, guesses, userName);
      computeScores(roomCode, confirmedPicks, pickGuessKey, guesses);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs + stable callbacks used intentionally
  }, [confirmedPicks, roomCode, session?.name, isLive]);

  // ═══════════════════════════════════════
  // ROOM PULSE (derived from existing state)
  // ═══════════════════════════════════════

  /** Room Pulse data — shows when window is closed and guesses exist for current pick */
  const roomPulseData = useMemo(() => {
    if (!isLive || !liveState || liveState.windowOpen || !liveState.windowOpenedAt) return null;
    const guesses = allGuesses[`pick${liveState.currentPick}`];
    return guesses && Object.keys(guesses).length > 0
      ? { guesses, pickNumber: liveState.currentPick }
      : null;
  }, [isLive, liveState, allGuesses]);

  // ═══════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════

  /** Get user's guess for a specific pick */
  const getUserGuess = useCallback(
    (pickNum: number): string | null => {
      if (!session) return null;
      return allGuesses[`pick${pickNum}`]?.[session.name] ?? null;
    },
    [session, allGuesses]
  );

  /** Full cycle reset — called by orchestrator's handleReset */
  const resetCycleState = useCallback(() => {
    setCurrentGuess(null);
    setGuessSubmitted(false);
    setGuessCount(0);
    setAllGuesses({});
    setAnimation(null);
    processedPicks.current = new Set();
    bearsDoublePicks.current = new Set();
  }, []);

  return {
    // Guess
    currentGuess,
    guessSubmitted,
    guessCount,
    handleLiveSelect,
    handleLiveSubmit,
    resetGuessState,
    resetCycleState,
    getUserGuess,
    // Animation (state machine)
    animation,
    advanceToReaction,
    dismissAnimation,
    bearsDoublePicks,
    // Room Pulse
    roomPulseData,
  };
}
