import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BRACKET_LOCK_TIME } from "../data/scoring";
import { saveBracket, getBracket } from "../lib/storage";
import type { BracketPick, UserBracket, UserSession } from "../types";

interface UseBracketPhaseParams {
  roomCode: string | undefined;
  session: UserSession | null;
  isLive: boolean;
}

/**
 * Manages bracket phase: picks array, lock countdown, submit/auto-submit,
 * and derived values (selectedPlayers, firstEmptyIndex).
 *
 * Handlers do NOT close the panel — the orchestrator wraps them with setActiveSlot(null).
 */
export function useBracketPhase({ roomCode, session, isLive }: UseBracketPhaseParams) {
  const [picks, setPicks] = useState<(BracketPick | null)[]>(Array(32).fill(null));
  const [bracketLocked, setBracketLocked] = useState(false);
  const [bracketSubmitted, setBracketSubmitted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [autoSubmitToast, setAutoSubmitToast] = useState<string | null>(null);

  // Refs for stable callback identity (autoSubmitBracket reads latest without re-creating)
  const picksRef = useRef(picks);
  picksRef.current = picks;
  const bracketSubmittedRef = useRef(bracketSubmitted);
  bracketSubmittedRef.current = bracketSubmitted;

  // ── Load existing bracket from Firebase on mount ──
  useEffect(() => {
    if (!roomCode || !session) return;
    // Reset state before loading — prevents stale picks from a previous room
    setPicks(Array(32).fill(null));
    setBracketSubmitted(false);
    getBracket(roomCode, session.name).then((bracket) => {
      if (bracket?.picks) {
        const loaded: (BracketPick | null)[] = Array(32).fill(null);
        bracket.picks.forEach((p) => {
          if (p && p.slot >= 1 && p.slot <= 32) {
            loaded[p.slot - 1] = p;
          }
        });
        setPicks(loaded);
        if (bracket.submittedAt) setBracketSubmitted(true);
      }
    });
  }, [roomCode, session?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown timer (runs while not live) ──
  useEffect(() => {
    if (isLive) return;
    function tick() {
      const diff = BRACKET_LOCK_TIME.getTime() - Date.now();
      if (diff <= 0) {
        setBracketLocked(true);
        setCountdown("LOCKED");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // ── Handlers ──

  function handleBracketSelect(slotIndex: number, playerName: string) {
    if (bracketLocked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[slotIndex] = { slot: slotIndex + 1, playerName };
      return next;
    });
  }

  function handleBracketClear(slotIndex: number) {
    if (bracketLocked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }

  async function handleBracketSubmit() {
    if (!roomCode || !session || bracketLocked) return;
    const bracket: UserBracket = {
      userName: session.name,
      picks: picks.filter(Boolean) as BracketPick[],
      submittedAt: new Date().toISOString(),
    };
    await saveBracket(roomCode, session.name, bracket);
    setBracketSubmitted(true);
    setShowShareModal(true);
  }

  /** Called by handleStartDraft in orchestrator to auto-submit if not already submitted */
  const autoSubmitBracket = useCallback(async () => {
    if (!roomCode || !session) return;
    if (bracketSubmittedRef.current) return;
    const currentPicks = picksRef.current;
    const filledCount = currentPicks.filter(Boolean).length;
    const bracket: UserBracket = {
      userName: session.name,
      picks: currentPicks.filter(Boolean) as BracketPick[],
      submittedAt: new Date().toISOString(),
    };
    await saveBracket(roomCode, session.name, bracket);
    setBracketSubmitted(true);
    setAutoSubmitToast(`Bracket auto-submitted (${filledCount}/32 filled)`);
    setTimeout(() => setAutoSubmitToast(null), 4000);
  }, [roomCode, session]);

  // ── Derived values ──

  /** Set of player names in the bracket (for sidebar strikethrough) */
  const selectedPlayers = useMemo(
    () => new Set(picks.filter(Boolean).map((p) => p!.playerName)),
    [picks]
  );

  /** Next unfilled slot index (for pulsing hint), -1 if none */
  const firstEmptyIndex = useMemo(
    () => (!isLive && !bracketLocked ? picks.findIndex((p) => !p) : -1),
    [picks, isLive, bracketLocked]
  );

  return {
    picks,
    bracketLocked,
    bracketSubmitted,
    countdown,
    showShareModal,
    setShowShareModal,
    autoSubmitToast,
    selectedPlayers,
    firstEmptyIndex,
    handleBracketSelect,
    handleBracketClear,
    handleBracketSubmit,
    autoSubmitBracket,
  };
}
