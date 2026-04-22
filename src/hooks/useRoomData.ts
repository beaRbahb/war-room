import { useState, useEffect, useMemo, useCallback } from "react";
import { DRAFT_ORDER, getEffectiveDraftOrder } from "../data/draftOrder";
import {
  onRoomConfig,
  updateRoomStatus,
  onLiveState,
  onResults,
  onScores,
  onBrackets,
  onUsers,
  onAllReactions,
  setLiveState as setLiveStateFirebase,
} from "../lib/storage";
import { clearSession } from "../lib/session";
import type {
  UserBracket,
  LiveState,
  ConfirmedPick,
  UserScores,
  RoomUser,
  UserReaction,
  UserSession,
} from "../types";

type RoomStatus = "bracket" | "live" | "done";

interface UseRoomDataParams {
  roomCode: string | undefined;
  navigate: (path: string, opts?: { state?: Record<string, unknown> }) => void;
  session: UserSession | null;
  initialStatus?: RoomStatus;
}

/**
 * All Firebase subscriptions for the room + derived state (isLive, effectiveOrder,
 * confirmedPicks, totalUsers).
 */
export function useRoomData({
  roomCode,
  navigate,
  session,
  initialStatus,
}: UseRoomDataParams) {
  // ── State ──
  const [roomStatus, setRoomStatus] = useState<RoomStatus>(initialStatus ?? "bracket");
  const [backupCommissionerId, setBackupCommissionerId] = useState<string | null>(null);
  const [liveState, setLiveStateLocal] = useState<LiveState | null>(null);
  const [results, setResults] = useState<Record<string, ConfirmedPick>>({});
  const [scores, setScores] = useState<Record<string, UserScores>>({});
  const [brackets, setBrackets] = useState<Record<string, UserBracket>>({});
  const [users, setUsers] = useState<Record<string, RoomUser>>({});
  const [allReactions, setAllReactions] = useState<Record<string, Record<string, UserReaction>>>({});

  // ── Derived values ──
  const isLive = roomStatus === "live" || roomStatus === "done";

  const effectiveOrder = useMemo(
    () => (isLive ? getEffectiveDraftOrder(liveState?.overrides ?? {}) : DRAFT_ORDER),
    [isLive, liveState?.overrides]
  );

  const confirmedPicks = useMemo(
    () => Object.values(results).sort((a, b) => a.pick - b.pick),
    [results]
  );

  const totalUsers = Object.keys(users).length;

  // ── Subscribe to room config ──
  useEffect(() => {
    if (!roomCode) return;
    return onRoomConfig(roomCode, (config) => {
      if (!config) {
        navigate("/");
        return;
      }
      setRoomStatus(config.status);
      setBackupCommissionerId(config.backupCommissionerId ?? null);
    });
  }, [roomCode, navigate]);

  // ── Subscribe to users in all phases (for kick detection) ──
  useEffect(() => {
    if (!roomCode) return;
    return onUsers(roomCode, setUsers);
  }, [roomCode]);

  // ── Kick detection: redirect if current user removed ─���
  useEffect(() => {
    if (!session) return;
    const userIds = Object.keys(users);
    if (userIds.length > 0 && !users[session.id]) {
      clearSession();
      navigate("/", { state: { kicked: true } });
    }
  }, [users, session, navigate]);

  // ── Live phase: Firebase subscriptions ──
  useEffect(() => {
    if (!roomCode || !isLive) return;
    const unsubs = [
      onLiveState(roomCode, setLiveStateLocal),
      onResults(roomCode, setResults),
      onScores(roomCode, setScores),
      onBrackets(roomCode, setBrackets),
      onAllReactions(roomCode, setAllReactions),
    ];
    return () => unsubs.forEach((u) => u());
  }, [roomCode, isLive]);

  // ── Initialize live state (called by orchestrator's handleStartDraft) ──
  // Replaces the shouldInitLive ref + effect anti-pattern with a direct function.
  const initLiveState = useCallback(async () => {
    if (!roomCode) return;
    await setLiveStateFirebase(roomCode, {
      currentPick: 1,
      windowOpen: false,
      windowOpenedAt: null,
      teamOnClock: DRAFT_ORDER[0]?.abbrev || "??",
      tradeMode: false,
    });
    await updateRoomStatus(roomCode, "live");
  }, [roomCode]);

  /** Bulk reset (called by orchestrator's handleReset) */
  const resetRoomData = useCallback(() => {
    setResults({});
    setScores({});
    setAllReactions({});
    setLiveStateLocal(null);
  }, []);

  return {
    roomStatus,
    backupCommissionerId,
    liveState,
    results,
    scores,
    brackets,
    users,
    allReactions,
    isLive,
    effectiveOrder,
    confirmedPicks,
    totalUsers,
    initLiveState,
    resetRoomData,
  };
}
