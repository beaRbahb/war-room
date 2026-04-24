import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PROSPECTS } from "../data/prospects";
import { GUESS_WINDOW_SECONDS, getTierScoring } from "../data/scoring";
import {
  updateScores,
  updateLiveState,
  onGuesses,
  submitGuess,
  getGuessesForPick,
  getAllGuesses,
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
  scoreDelta: { bracket: number; live: number };
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
  resultsLoaded: boolean;
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
  resultsLoaded,
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
  // Only listen while window is open; count persists through finalize phase
  // and resets when the pick advances (see pick-advance effect below)
  useEffect(() => {
    if (!roomCode || !liveState?.windowOpen) return;
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
      setGuessCount(0);
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
  /** True once we've seen confirmedPicks empty — proves we're not a late joiner */
  const sawEmptyRef = useRef(false);

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

  /** Calculate and write scores for all users */
  function computeScores(
    code: string,
    picks: ConfirmedPick[],
    guessData: AllGuesses,
  ) {
    const allUsers = Object.values(usersRef.current);
    allUsers.forEach((user: RoomUser) => {
      const bracketResult = calcBracketScore(bracketsRef.current[user.name] || null, picks);
      const live = calcLiveScore(
        user.name,
        picks,
        guessData,
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
    if (!roomCode || !session || !isLive || !resultsLoaded) return;
    if (confirmedPicks.length === 0) {
      sawEmptyRef.current = true;
      return;
    }

    const latest = confirmedPicks[confirmedPicks.length - 1];
    if (processedPicks.current.has(latest.pick)) return;

    // Late joiner / refresh: pre-seed processedPicks to skip stale animations.
    // If we ever saw an empty confirmedPicks array, we were here from the start.
    const isLateJoin = !sawEmptyRef.current && processedPicks.current.size === 0;
    if (isLateJoin) {
      confirmedPicks.forEach((p) => processedPicks.current.add(p.pick));
    } else {
      processedPicks.current.add(latest.pick);
    }

    const priorPicks = confirmedPicks
      .filter((p) => p.pick < latest.pick)
      .map((p) => ({
        position: PROSPECTS.find((pr) => pr.name === p.playerName)?.position ?? "",
      }));

    const pickGuessKey = `pick${latest.pick}`;
    const userName = session.name;

    (async () => {
      let guesses: Record<string, string>;
      let fullGuessMap: AllGuesses;

      if (isLateJoin) {
        // Late join / refresh: fetch ALL guesses so scoring has complete data
        fullGuessMap = await getAllGuesses(roomCode);
        guesses = fullGuessMap[pickGuessKey] ?? {};
        // Hydrate React state for future renders (Room Pulse, getUserGuess, etc.)
        Object.entries(fullGuessMap).forEach(([key, val]) =>
          updateGuessesForPick(key, val)
        );
      } else {
        // Normal path: only fetch this pick's guesses, merge with existing ref
        guesses = await getGuessesForPick(roomCode, latest.pick);
        fullGuessMap = { ...allGuessesRef.current, [pickGuessKey]: guesses };
      }

      // Compute score delta for this pick (no refs needed — uses data in scope)
      const tier = getTierScoring(latest.pick);
      const userBracket = bracketsRef.current[userName];
      let bracketDelta = 0;
      if (userBracket) {
        const exact = userBracket.picks[latest.pick - 1]?.playerName === latest.playerName;
        bracketDelta = exact ? tier.bracketExact : 0;
      }
      let liveDelta = guesses[userName] === latest.playerName ? tier.liveCorrect : 0;
      if (liveDelta > 0 && latest.isBearsPick) liveDelta *= 2;

      const flashData: ChaosFlashData = {
        slot: latest.pick,
        playerName: latest.playerName,
        teamAbbrev: latest.teamAbbrev,
        isBearsPick: latest.isBearsPick,
        priorPicks,
        scoreDelta: { bracket: bracketDelta, live: liveDelta },
      };
      updateGuessesForPick(pickGuessKey, guesses);
      if (!isLateJoin) triggerAnimation(latest, flashData, guesses, userName);
      computeScores(roomCode, confirmedPicks, fullGuessMap);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs + stable callbacks used intentionally
  }, [confirmedPicks, roomCode, session?.name, isLive, resultsLoaded]);

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
    sawEmptyRef.current = false;
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
    // Room Pulse
    roomPulseData,
  };
}
