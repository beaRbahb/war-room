import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DRAFT_ORDER, getEffectiveDraftOrder } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import { BRACKET_LOCK_TIME, GUESS_WINDOW_SECONDS, DRAFT_COUNTDOWN_SECONDS } from "../data/scoring";
import { getTeamLogo } from "../data/teams";
import {
  saveBracket,
  getBracket,
  onRoomConfig,
  updateRoomStatus,
  setDraftCountdown,
  onLiveState,
  onResults,
  onScores,
  onBrackets,
  onUsers,
  updateScores,
  getGuessCount,
  setLiveState,
  updateLiveState,
  onGuesses,
  submitGuess,
  getAllGuesses,
  getAllReactions,
  onAllReactions,
  clearGuesses,
  resetDraft,
} from "../lib/storage";
import { getSession } from "../lib/session";
import { calcBracketScore, calcLiveScore } from "../lib/scoring";
import { assignPersonas, type PersonaType } from "../lib/personas";
import { calcUserRecap, calcRoomRecap, type UserRecapStats, type RoomRecapStats } from "../lib/recap";
import { REVEAL_PAUSE_MS } from "../data/scoring";

import DraftRow from "../components/DraftRow";
import type { RowState } from "../components/DraftRow";
import TimerBar from "../components/TimerBar";
import CommissionerControls from "../components/CommissionerControls";
import PlayerSelectionPanel from "../components/PlayerSelectionPanel";
import Leaderboard from "../components/Leaderboard";
import BearsMode from "../components/BearsMode";
import Confetti from "../components/Confetti";
import BearsBustOverlay from "../components/BearsBustOverlay";
import BracketShareModal from "../components/BracketShareModal";
import PickReactionScreen from "../components/PickReactionScreen";
import RunningChaosMeter from "../components/RunningChaosMeter";
import RecapCard from "../components/RecapCard";
import RoomRecap from "../components/RoomRecap";
import BracketProgressStrip from "../components/BracketProgressStrip";
import DraftCountdownBanner from "../components/DraftCountdownBanner";
import DraftTakeover from "../components/DraftTakeover";

import type {
  BracketPick,
  UserBracket,
  LiveState,
  ConfirmedPick,
  UserScores,
  RoomUser,
  LeaderboardEntry,
  UserReaction,
} from "../types";

type RoomStatus = "bracket" | "live" | "done";

export default function DraftScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const justCreated = (location.state as { justCreated?: boolean })?.justCreated ?? false;

  // ── Room status ──
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("bracket");

  // ── Bracket phase state ──
  const [picks, setPicks] = useState<(BracketPick | null)[]>(Array(32).fill(null));
  const [bracketLocked, setBracketLocked] = useState(false);
  const [bracketSubmitted, setBracketSubmitted] = useState(false);
  const [countdown, setCountdown] = useState("");

  const [showShareModal, setShowShareModal] = useState(justCreated);
  const [shareIsCreation, setShareIsCreation] = useState(justCreated);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [draftStartsAt, setDraftStartsAt] = useState<string | null>(null);
  const [showTakeover, setShowTakeover] = useState(false);
  const [autoSubmitToast, setAutoSubmitToast] = useState<string | null>(null);

  // ── Live phase state ──
  const [liveState, setLiveStateLocal] = useState<LiveState | null>(null);
  const [results, setResults] = useState<Record<string, ConfirmedPick>>({});
  const [scores, setScores] = useState<Record<string, UserScores>>({});
  const [brackets, setBrackets] = useState<Record<string, UserBracket>>({});
  const [users, setUsers] = useState<Record<string, RoomUser>>({});
  const [allGuesses, setAllGuesses] = useState<Record<string, Record<string, string>>>({});
  const [allReactions, setAllReactions] = useState<Record<string, Record<string, UserReaction>>>({});
  const [guessCount, setGuessCount] = useState(0);

  // ── Live guess state (per-pick) ──
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  // ── UI state ──
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [commissionerTab, setCommissionerTab] = useState<"picks" | "admin">("picks");
  const [expandedPick, setExpandedPick] = useState<number | null>(null);
  const [pendingFinalize, setPendingFinalize] = useState(false);
  const prevWindowOpenRef = useRef<boolean>(false);

  // ── Auto-finalize: detect window close regardless of active tab ──
  useEffect(() => {
    if (!liveState) return;
    if (prevWindowOpenRef.current && !liveState.windowOpen) {
      setPendingFinalize(true);
    }
    prevWindowOpenRef.current = liveState.windowOpen;
  }, [liveState?.windowOpen]);

  // ── Swap mode (commissioner admin tab) ──
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirst, setSwapFirst] = useState<number | null>(null);
  const [swapConfirm, setSwapConfirm] = useState<{ pickA: number; pickB: number } | null>(null);

  // ── Overlays ──
  const [showBearsMode, setShowBearsMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [chaosFlash, setChaosFlash] = useState<{
    slot: number;
    playerName: string;
    teamAbbrev: string;
    isBearsPick: boolean;
    priorPicks: { position: string }[];
  } | null>(null);
  const [, setRevealedPicks] = useState<Set<number>>(new Set());
  const [personas, setPersonas] = useState<Record<string, PersonaType>>({});
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<{
    users: UserRecapStats[];
    room: RoomRecapStats;
    entries: LeaderboardEntry[];
  } | null>(null);

  const processedPicks = useRef<Set<number>>(new Set());
  const bearsDoublePicks = useRef<Set<number>>(new Set());
  const prevPickRef = useRef<number>(1);

  // Refs for scoring context — avoids stale closures in pick-processing effect
  const usersRef = useRef(users);
  usersRef.current = users;
  const bracketsRef = useRef(brackets);
  bracketsRef.current = brackets;
  const allGuessesRef = useRef(allGuesses);
  allGuessesRef.current = allGuesses;

  const isLive = roomStatus === "live" || roomStatus === "done";

  /** Draft order with live swaps applied (bracket phase uses static DRAFT_ORDER) */
  const effectiveOrder = useMemo(
    () => isLive ? getEffectiveDraftOrder(liveState?.swaps ?? []) : DRAFT_ORDER,
    [isLive, liveState?.swaps]
  );

  // ── Redirect if no session ──
  useEffect(() => {
    if (!session || session.roomCode !== roomCode) {
      navigate("/");
    }
  }, [session, roomCode, navigate]);

  // ── Subscribe to room config ──
  useEffect(() => {
    if (!roomCode) return;
    return onRoomConfig(roomCode, (config) => {
      if (!config) {
        navigate("/");
        return;
      }
      setRoomStatus(config.status);
      setDraftStartsAt(config.draftStartsAt ?? null);
    });
  }, [roomCode, navigate]);

  // ── Bracket phase: load existing bracket ──
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
  }, [roomCode, session?.name]);

  // ── Bracket phase: countdown timer ──
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

  // ── Live phase: Firebase subscriptions ──
  useEffect(() => {
    if (!roomCode || !isLive) return;
    const unsubs = [
      onLiveState(roomCode, setLiveStateLocal),
      onResults(roomCode, setResults),
      onScores(roomCode, setScores),
      onBrackets(roomCode, setBrackets),
      onUsers(roomCode, setUsers),
      onAllReactions(roomCode, setAllReactions),
    ];
    return () => unsubs.forEach((u) => u());
  }, [roomCode, isLive]);

  // ── Live phase: initialize live state if commissioner ──
  useEffect(() => {
    if (!roomCode || !session?.isCommissioner || !isLive || liveState) return;
    setLiveState(roomCode, {
      currentPick: 1,
      windowOpen: false,
      windowOpenedAt: null,
      teamOnClock: DRAFT_ORDER[0]?.abbrev || "??",
      tradeMode: false,
      bearsDoubleActive: false,
    });
    updateRoomStatus(roomCode, "live");
  }, [roomCode, session?.isCommissioner, isLive, liveState]);

  // ── Trubisky safety reset ──
  useEffect(() => {
    if (!roomCode || !liveState?.trubiskyActive) return;
    const t = setTimeout(() => updateLiveState(roomCode, { trubiskyActive: false }), 10000);
    return () => clearTimeout(t);
  }, [roomCode, liveState?.trubiskyActive]);

  // ── Track guess count ──
  useEffect(() => {
    if (!roomCode || !liveState?.windowOpen) return;
    const interval = setInterval(async () => {
      const count = await getGuessCount(roomCode, liveState.currentPick);
      setGuessCount(count);
    }, 2000);
    return () => clearInterval(interval);
  }, [roomCode, liveState?.windowOpen, liveState?.currentPick]);

  // ── Reset guess state when pick advances ──
  useEffect(() => {
    if (!liveState) return;
    if (liveState.currentPick !== prevPickRef.current) {
      setCurrentGuess(null);
      setGuessSubmitted(false);
      setActiveSlot(null);
      prevPickRef.current = liveState.currentPick;
    }
  }, [liveState?.currentPick]);

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
        }
        setGuessSubmitted(true);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [roomCode, session, liveState?.windowOpen, liveState?.windowOpenedAt, liveState?.currentPick, currentGuess, guessSubmitted]);

  // ── Commissioner auto-close on timer expiry ──
  useEffect(() => {
    if (!roomCode || !session?.isCommissioner || !liveState?.windowOpen || !liveState.windowOpenedAt) return;

    const openedMs = new Date(liveState.windowOpenedAt).getTime();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - openedMs) / 1000;
      if (elapsed >= GUESS_WINDOW_SECONDS) {
        updateLiveState(roomCode, { windowOpen: false });
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [roomCode, session?.isCommissioner, liveState?.windowOpen, liveState?.windowOpenedAt]);

  // ── Confirmed picks ──
  const confirmedPicks = useMemo(
    () => Object.values(results).sort((a, b) => a.pick - b.pick),
    [results]
  );

  // ── Watch for new picks: scoring, animations ──
  useEffect(() => {
    if (!roomCode || !session || !isLive) return;
    if (confirmedPicks.length === 0) return;

    const latest = confirmedPicks[confirmedPicks.length - 1];
    if (processedPicks.current.has(latest.pick)) return;
    processedPicks.current.add(latest.pick);

    setTimeout(() => {
      setRevealedPicks((prev) => new Set([...prev, latest.pick]));
    }, REVEAL_PAUSE_MS);

    const priorPicks = confirmedPicks
      .filter((p) => p.pick < latest.pick)
      .map((p) => ({
        position: PROSPECTS.find((pr) => pr.name === p.playerName)?.position ?? "",
      }));
    const flashData = {
      slot: latest.pick,
      playerName: latest.playerName,
      teamAbbrev: latest.teamAbbrev,
      isBearsPick: latest.isBearsPick,
      priorPicks,
    };

    if (liveState?.bearsDoubleActive) {
      bearsDoublePicks.current.add(latest.pick);
    }

    if (latest.isBearsPick) {
      setShowBearsMode(true);
    }

    const pickGuessKey = `pick${latest.pick}`;
    let confettiFired = false;
    const userName = session.name;
    const unsub = onGuesses(roomCode, latest.pick, (guesses) => {
      setAllGuesses((prev) => ({ ...prev, [pickGuessKey]: guesses }));

      if (guesses[userName] === latest.playerName) {
        confettiFired = true;
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setChaosFlash(flashData);
        }, 5500);
      }

      // Show reaction screen immediately if no confetti
      if (!confettiFired) {
        setChaosFlash(flashData);
      }

      // Scoring — use refs for latest state to avoid stale closures
      const allUsers = Object.values(usersRef.current);
      allUsers.forEach((user) => {
        const bracket = calcBracketScore(bracketsRef.current[user.name] || null, confirmedPicks);
        const live = calcLiveScore(
          user.name,
          confirmedPicks,
          { ...allGuessesRef.current, [pickGuessKey]: guesses },
          bearsDoublePicks.current
        );
        updateScores(roomCode, user.name, {
          bracketScore: bracket.score,
          liveScore: live.score,
          liveHits: live.hits,
          bracketExact: bracket.exact,
          bracketPartial: bracket.partial,
        });
      });
      unsub();
    });
    // No cleanup — listener self-unsubscribes in callback via unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedPicks, roomCode, session?.name, isLive]);

  // ── Personas + recap (all 32 done) ──
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

  // ── Derived data ──
  const pickedPlayers = useMemo(
    () => confirmedPicks.map((p) => p.playerName),
    [confirmedPicks]
  );

  const selectedPlayers = useMemo(
    () => new Set(picks.filter(Boolean).map((p) => p!.playerName)),
    [picks]
  );

  const totalUsers = Object.keys(users).length;
  const currentSlot = effectiveOrder.find(
    (s) => s.pick === (liveState?.currentPick || 1)
  );

  // ── Row state helper ──
  function getRowState(slotIndex: number): RowState {
    if (!isLive) return bracketLocked ? "locked" : "editable";
    const pickNum = slotIndex + 1;
    const currentPick = liveState?.currentPick || 1;
    if (results[`pick${pickNum}`]) return "completed";
    if (pickNum === currentPick) return "active";
    return "locked";
  }

  // ── Get user's live guess for a pick ──
  function getUserGuess(pickNum: number): string | null {
    if (!session) return null;
    if (pickNum === liveState?.currentPick) return currentGuess;
    return allGuesses[`pick${pickNum}`]?.[session.name] ?? null;
  }

  // ── Bracket handlers ──
  function handleBracketSelect(slotIndex: number, playerName: string) {
    if (bracketLocked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[slotIndex] = { slot: slotIndex + 1, playerName };
      return next;
    });
    setActiveSlot(null);
  }

  function handleBracketClear(slotIndex: number) {
    if (bracketLocked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setActiveSlot(null);
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
    setShareIsCreation(false);
    setShowShareModal(true);
  }

  // ── Draft countdown expired ──
  const handleCountdownExpired = useCallback(async () => {
    if (!roomCode || !session) return;

    // Auto-submit bracket if not already submitted
    if (!bracketSubmitted) {
      const filledCount = picks.filter(Boolean).length;
      const bracket: UserBracket = {
        userName: session.name,
        picks: picks.filter(Boolean) as BracketPick[],
        submittedAt: new Date().toISOString(),
      };
      await saveBracket(roomCode, session.name, bracket);
      setBracketSubmitted(true);
      setAutoSubmitToast(`Bracket auto-submitted (${filledCount}/32 filled)`);
      setTimeout(() => setAutoSubmitToast(null), 4000);
    }

    // Commissioner transitions to live
    if (session.isCommissioner) {
      await updateRoomStatus(roomCode, "live");
    }

    // Show takeover
    setShowTakeover(true);
  }, [roomCode, session, bracketSubmitted, picks]);

  // ── Live handlers ──
  /** Select a player (doesn't submit yet — user must tap SUBMIT) */
  function handleLiveSelect(playerName: string) {
    if (!roomCode || !session || !liveState) return;
    if (!liveState.windowOpen) return;
    setCurrentGuess(playerName);
    setActiveSlot(null); // close panel
  }

  /** Lock in the current guess to Firebase */
  async function handleLiveSubmit() {
    if (!roomCode || !session || !liveState || !currentGuess) return;
    if (!liveState.windowOpen) return;
    await submitGuess(roomCode, liveState.currentPick, session.name, currentGuess);
    setGuessSubmitted(true);
  }

  function handleRowClick(slotIndex: number) {
    const state = getRowState(slotIndex);
    if (state === "editable") {
      setActiveSlot(slotIndex);
    } else if (state === "active" && liveState?.windowOpen && !guessSubmitted) {
      setActiveSlot(slotIndex);
    }
  }

  async function handleToggleSwapMode() {
    const entering = !swapMode;
    if (entering && liveState?.windowOpen && roomCode) {
      await updateLiveState(roomCode, { windowOpen: false });
    }
    setSwapMode(entering);
    setSwapFirst(null);
    setSwapConfirm(null);
  }

  function handleSwapRowClick(pickNum: number) {
    if (!swapMode || !liveState) return;
    // Only future picks can be swapped
    if (pickNum < liveState.currentPick) return;
    if (swapFirst === null) {
      setSwapFirst(pickNum);
    } else if (swapFirst === pickNum) {
      setSwapFirst(null); // deselect
    } else {
      setSwapConfirm({ pickA: swapFirst, pickB: pickNum });
    }
  }

  async function handleConfirmSwap() {
    if (!swapConfirm || !roomCode || !liveState) return;
    const currentPick = liveState.currentPick;
    const involvesCurrentPick =
      swapConfirm.pickA === currentPick || swapConfirm.pickB === currentPick;

    // Clear guesses if the current pick's team is changing
    if (involvesCurrentPick) {
      await clearGuesses(roomCode, currentPick);
      setCurrentGuess(null);
      setGuessSubmitted(false);
    }

    const currentSwaps = liveState.swaps ?? [];
    await updateLiveState(roomCode, {
      swaps: [...currentSwaps, swapConfirm],
      // Reset the window timer so users can re-guess for the new team
      ...(involvesCurrentPick && liveState.windowOpen
        ? { windowOpenedAt: new Date().toISOString() }
        : {}),
    });
    setSwapMode(false);
    setSwapFirst(null);
    setSwapConfirm(null);
  }

  const handleBearsModeComplete = useCallback(() => setShowBearsMode(false), []);

  if (!session || !roomCode) return null;

  const isCommissioner = session.isCommissioner;
  const showCommissionerTabs = isCommissioner && isLive;

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      {/* Overlays */}
      {showBearsMode && <BearsMode onComplete={handleBearsModeComplete} />}
      {liveState?.trubiskyActive && <BearsBustOverlay onComplete={() => {}} />}
      {chaosFlash && (
        <PickReactionScreen
          slot={chaosFlash.slot}
          playerName={chaosFlash.playerName}
          teamAbbrev={chaosFlash.teamAbbrev}
          isBearsPick={chaosFlash.isBearsPick}
          priorPicks={chaosFlash.priorPicks}
          roomCode={roomCode}
          userName={session.name}
          onComplete={() => setChaosFlash(null)}
        />
      )}
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-2 sm:py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-amber tracking-wide">
            {isLive ? "WAR ROOM" : "PRE-DRAFT BRACKET"}
          </h1>
          <p className="font-mono text-xs text-muted">
            {session.name} — Room {roomCode}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isLive && (
            <div className="text-right">
              <p className="font-mono text-sm text-amber">
                {bracketLocked ? "\u{1F512}" : "\u{1F513}"} {countdown}
              </p>
              {bracketSubmitted && (
                <p className="font-condensed text-xs text-green uppercase">
                  Submitted
                </p>
              )}
            </div>
          )}
          {isLive && confirmedPicks.length >= 32 && recapData && (
            <button
              onClick={() => setShowRecap(true)}
              className="bg-amber text-bg font-condensed font-bold uppercase text-xs px-3 py-1.5 rounded hover:brightness-110 transition-all"
            >
              VIEW RECAP
            </button>
          )}
        </div>
      </header>

      {/* Commissioner: Start Draft banner (bracket phase) */}
      {!isLive && isCommissioner && (
        <div className="shrink-0 bg-surface border-b border-border px-4 py-2 flex items-center justify-between gap-3">
          {draftStartsAt ? (
            <>
              <span className="font-condensed text-sm text-amber uppercase">
                Draft countdown started
              </span>
              <button
                onClick={async () => {
                  await setDraftCountdown(roomCode, null);
                }}
                className="bg-red/80 text-white font-condensed font-bold uppercase text-xs px-4 py-1.5 rounded hover:brightness-110 transition-all"
              >
                CANCEL COUNTDOWN
              </button>
            </>
          ) : (
            <>
              <span className="font-condensed text-xs sm:text-sm text-muted uppercase">
                Commissioner — start when ready
              </span>
              <button
                onClick={() => setShowStartConfirm(true)}
                className="bg-green text-bg font-condensed font-bold uppercase text-xs px-4 py-1.5 rounded hover:brightness-110 transition-all"
              >
                START DRAFT
              </button>
            </>
          )}
        </div>
      )}

      {/* Commissioner tabs */}
      {showCommissionerTabs && (
        <div className="bg-surface border-b border-border px-4 flex gap-1">
          {(["picks", "admin"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCommissionerTab(tab)}
              className={`font-condensed text-sm uppercase px-4 py-2 border-b-2 transition-colors ${
                commissionerTab === tab
                  ? "border-amber text-amber font-bold"
                  : "border-transparent text-muted hover:text-white"
              }`}
            >
              {tab === "picks" ? "MY PICKS" : "COMMISSIONER"}
            </button>
          ))}
        </div>
      )}

      {/* Timer bar (live phase) */}
      {isLive && liveState && (
        <TimerBar
          liveState={liveState}
          currentSlot={currentSlot}
          userGuess={currentGuess}
          submitted={guessSubmitted}
          onSubmit={handleLiveSubmit}
          guessCount={guessCount}
          totalUsers={totalUsers}
        />
      )}

      {/* Running chaos meter — pinned below timer bar */}
      {isLive && confirmedPicks.length > 0 && commissionerTab !== "admin" && (
        <RunningChaosMeter confirmedPicks={confirmedPicks} />
      )}

      {/* Recap overlay */}
      {showRecap && recapData && (
        <div className="fixed inset-0 z-[90] bg-bg/95 overflow-auto">
          <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-amber tracking-wide">DRAFT RECAP</h2>
            <button onClick={() => setShowRecap(false)} className="text-muted hover:text-white font-mono text-sm">
              CLOSE
            </button>
          </div>
          <div className="p-4 flex flex-wrap gap-4 justify-center">
            <RoomRecap stats={recapData.room} entries={recapData.entries} roomCode={roomCode} />
            {recapData.users.map((userStats) => (
              <RecapCard
                key={userStats.name}
                stats={userStats}
                persona={personas[userStats.name]}
                roomCode={roomCode}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Main grid */}
        <div className="flex-1 min-h-0 px-2 py-4 sm:p-4 pb-24 lg:pb-4 overflow-auto">
          {/* ── Commissioner Admin Tab ── */}
          {commissionerTab === "admin" && isLive && liveState ? (
            <div className="space-y-1">
              {swapMode && (
                <div className="bg-white/5 border border-white/20 rounded px-3 py-1.5 flex items-center justify-between mb-2">
                  <span className="font-condensed text-xs text-white uppercase">
                    {swapFirst
                      ? `Pick #${swapFirst} selected — tap another pick to trade`
                      : "Tap a pick to start trade"}
                  </span>
                  <button
                    onClick={() => { setSwapMode(false); setSwapFirst(null); }}
                    className="font-condensed text-xs text-muted uppercase hover:text-white"
                  >
                    CANCEL
                  </button>
                </div>
              )}
              {effectiveOrder.map((slot, i) => {
                const pickNum = i + 1;
                const confirmed = results[`pick${pickNum}`] ?? null;
                const isCurrent = pickNum === liveState.currentPick;
                const isPast = pickNum < liveState.currentPick;
                const isFuture = pickNum > liveState.currentPick;
                const isSwapTarget = swapMode && (isFuture || isCurrent);
                const isSwapSelected = swapFirst === pickNum;

                return (
                  <div key={slot.pick} className={isCurrent ? "relative" : ""}>
                    <div
                      onClick={() => isSwapTarget && handleSwapRowClick(pickNum)}
                      className={`flex items-center gap-1.5 sm:gap-3 pl-1 pr-2 sm:px-3 h-14 sm:h-12 rounded border transition-colors ${
                        isSwapSelected
                          ? "bg-white/10 border-white border-dashed"
                          : isSwapTarget
                            ? "bg-surface border-border border-dashed cursor-pointer hover:border-white/50 opacity-100"
                            : isCurrent
                              ? "bg-amber/5 border-amber"
                              : isPast
                                ? "bg-surface border-border"
                                : "bg-surface border-border opacity-40"
                      }`}
                    >
                      <span className={`font-mono text-xs sm:text-sm w-4 sm:w-8 text-right shrink-0 ${isCurrent ? "text-amber font-bold" : "text-muted"}`}>
                        {pickNum}
                      </span>
                      <img
                        src={getTeamLogo(slot.abbrev)}
                        alt={slot.abbrev}
                        className="w-8 h-8 object-contain shrink-0"
                      />
                      <span className="font-condensed text-base text-white uppercase w-12 shrink-0">
                        {slot.abbrev}
                      </span>
                      <span className="flex-1 font-mono text-sm text-white truncate">
                        {confirmed?.playerName ?? (isCurrent ? "" : "—")}
                      </span>

                      {/* Inline action buttons for current pick */}
                      {isCurrent && (
                        <CommissionerControls
                          roomCode={roomCode}
                          liveState={liveState}
                          pickedPlayers={pickedPlayers}
                          currentTeamAbbrev={slot.abbrev}
                          swapMode={swapMode}
                          onToggleSwap={handleToggleSwapMode}
                          pendingFinalize={pendingFinalize}
                          onFinalizeSeen={() => setPendingFinalize(false)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Reset draft — testing only */}
              <button
                onClick={async () => {
                  if (!confirm("Reset draft? This clears all picks, guesses, scores, and returns to bracket phase.")) return;
                  await resetDraft(roomCode);
                  // Clear all synced state
                  setResults({});
                  setScores({});
                  setAllGuesses({});
                  setAllReactions({});
                  setLiveStateLocal(null);
                  setGuessCount(0);
                  // Clear per-pick local state
                  setCurrentGuess(null);
                  setGuessSubmitted(false);
                  setExpandedPick(null);
                  setChaosFlash(null);
                  setShowConfetti(false);
                  setShowRecap(false);
                  setRecapData(null);
                  // Clear swap state
                  setSwapMode(false);
                  setSwapFirst(null);
                  setSwapConfirm(null);
                  // Clear refs so chaos/confetti triggers work on replay
                  processedPicks.current = new Set();
                  bearsDoublePicks.current = new Set();
                }}
                className="mt-4 w-full bg-red/20 border border-red text-red font-condensed font-bold uppercase py-2 rounded text-sm hover:bg-red/30 transition-all"
              >
                RESET DRAFT (TESTING)
              </button>
            </div>
          ) : (
            <>
              {/* Bracket progress strip (bracket phase only) */}
              {!isLive && (
                <BracketProgressStrip filled={picks.filter(Boolean).length} total={32} />
              )}

              {/* Draft countdown banner */}
              {!isLive && draftStartsAt && (
                <DraftCountdownBanner
                  draftStartsAt={draftStartsAt}
                  onExpired={handleCountdownExpired}
                />
              )}

              {/* Column headers */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 mb-1 border-b border-border">
                <span className="w-8 shrink-0" />
                <span className="w-24 shrink-0" />
                <span className="flex-1 font-condensed text-sm text-white/70 uppercase tracking-wide font-bold">Player</span>
                <span className="font-condensed text-sm text-white/70 uppercase w-12 text-right hidden md:block font-bold">Pos</span>
                <span className="font-condensed text-sm text-white/70 uppercase w-12 text-right hidden md:block font-bold">Rank</span>
                <span className="font-condensed text-sm text-white/70 uppercase w-12 text-right hidden md:block font-bold">Grade</span>
                <span className="w-5 shrink-0" />
              </div>

              {/* 32 rows */}
              <div className="space-y-2 sm:space-y-1">
                {effectiveOrder.map((slot, i) => {
                  const rowState = getRowState(i);
                  const pickNum = i + 1;

                  // Determine user pick for this row
                  let userPick: string | null = null;
                  if (isLive) {
                    userPick = getUserGuess(pickNum);
                  } else {
                    userPick = picks[i]?.playerName ?? null;
                  }

                  const confirmed = results[`pick${pickNum}`] ?? null;
                  const isCorrect =
                    confirmed && userPick
                      ? userPick === confirmed.playerName
                      : confirmed
                        ? false
                        : null;

                  const shouldScroll =
                    isLive && pickNum === liveState?.currentPick;

                  return (
                    <div key={slot.pick}>
                      <DraftRow
                        slot={slot}
                        index={i}
                        rowState={rowState}
                        userPick={userPick}
                        confirmedPick={confirmed}
                        isCorrect={isCorrect}
                        userGrade={allReactions[`pick${pickNum}`]?.[session.name]?.reaction ?? null}
                        onClick={() => handleRowClick(i)}
                        expanded={expandedPick === pickNum}
                        onToggleExpand={() =>
                          setExpandedPick(expandedPick === pickNum ? null : pickNum)
                        }
                        shouldScroll={shouldScroll}
                        onSubmit={rowState === "active" && isLive && currentGuess && !guessSubmitted ? handleLiveSubmit : undefined}
                        submitted={rowState === "active" && isLive ? guessSubmitted : undefined}
                        windowOpen={rowState === "active" && isLive ? liveState?.windowOpen : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bracket submit button */}
          {!isLive && !bracketLocked && (
            <button
              onClick={handleBracketSubmit}
              className={`mt-4 w-full font-condensed font-bold uppercase tracking-wide py-3 rounded transition-all ${
                bracketSubmitted
                  ? "bg-green/20 border border-green text-green hover:bg-green/30"
                  : "bg-amber text-bg hover:brightness-110"
              }`}
            >
              {bracketSubmitted
                ? "\u2713 BRACKET SUBMITTED — TAP TO UPDATE"
                : "SUBMIT BRACKET"}
            </button>
          )}
        </div>

        {/* Sidebar */}
        {isLive ? (
          // Leaderboard during live
          <Leaderboard
            scores={scores}
            roomCode={roomCode}
            totalPicks={confirmedPicks.length}
            personas={confirmedPicks.length >= 32 ? personas : undefined}
          />
        ) : (
          <div className="hidden lg:block lg:static lg:w-72 lg:border-l lg:border-border overflow-auto">
              <div className="p-4">
                <h2 className="font-display text-lg text-amber mb-3 tracking-wide">
                  CONSENSUS BOARD
                </h2>
                <div className="space-y-0.5">
                  {PROSPECTS.map((p, idx) => {
                    const showTierBreak =
                      idx === 5 || idx === 15 || idx === 32;
                    const selected = selectedPlayers.has(p.name);
                    return (
                      <div key={p.rank}>
                        {showTierBreak && (
                          <div className="border-t border-border-bright my-1.5 pt-1">
                            <span className="font-condensed text-xs text-amber-dim uppercase">
                              {idx === 5
                                ? "TIER 2"
                                : idx === 15
                                  ? "TIER 3"
                                  : "DAY 2"}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex items-baseline gap-2 text-xs font-mono py-0.5 ${
                            selected
                              ? "text-muted line-through opacity-50"
                              : p.rank <= 5
                                ? "text-white font-bold"
                                : p.rank <= 15
                                  ? "text-white"
                                  : "text-white/70"
                          }`}
                        >
                          <span
                            className={`w-6 text-right ${
                              selected
                                ? "text-muted"
                                : p.rank <= 5
                                  ? "text-amber"
                                  : "text-muted"
                            }`}
                          >
                            {p.rank}
                          </span>
                          <span className="flex-1">{p.name}</span>
                          <span className="text-muted">{p.position}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Player Selection Panel */}
      {activeSlot !== null && (
        <PlayerSelectionPanel
          slot={DRAFT_ORDER[activeSlot]}
          selectedPlayers={
            isLive ? new Set(pickedPlayers) : selectedPlayers
          }
          currentPick={
            isLive ? currentGuess : picks[activeSlot]?.playerName ?? null
          }
          onSelect={(name) => {
            if (isLive) {
              handleLiveSelect(name);
            } else {
              handleBracketSelect(activeSlot, name);
            }
          }}
          onClear={() => {
            if (!isLive) handleBracketClear(activeSlot);
          }}
          onClose={() => setActiveSlot(null)}
          liveSubmitted={isLive ? guessSubmitted : false}
        />
      )}

      {/* Commissioner: Bears Bust floating button (live phase) */}
      {isCommissioner && isLive && liveState && commissionerTab === "admin" && (
        <button
          onClick={async () => {
            await updateLiveState(roomCode, { trubiskyActive: true });
            setTimeout(() => {
              updateLiveState(roomCode, { trubiskyActive: false });
            }, 4000);
          }}
          disabled={liveState.windowOpen}
          className="fixed bottom-24 right-4 z-40 lg:bottom-4 bg-bears-navy border-2 border-bears-orange text-bears-orange font-condensed font-bold uppercase px-4 py-3 rounded-full shadow-lg hover:brightness-125 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
        >
          🐻 BUST
        </button>
      )}

      {/* Trade confirm dialog */}
      {swapConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-white/30 rounded-xl p-6 max-w-sm w-full">
            <p className="font-display text-xl text-white mb-3">
              CONFIRM TRADE
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-center">
                <img
                  src={getTeamLogo(effectiveOrder[swapConfirm.pickA - 1]?.abbrev)}
                  alt=""
                  className="w-10 h-10 object-contain mx-auto mb-1"
                />
                <p className="font-condensed text-sm text-white">
                  #{swapConfirm.pickA} {effectiveOrder[swapConfirm.pickA - 1]?.abbrev}
                </p>
              </div>
              <span className="font-mono text-xl text-amber">↔</span>
              <div className="text-center">
                <img
                  src={getTeamLogo(effectiveOrder[swapConfirm.pickB - 1]?.abbrev)}
                  alt=""
                  className="w-10 h-10 object-contain mx-auto mb-1"
                />
                <p className="font-condensed text-sm text-white">
                  #{swapConfirm.pickB} {effectiveOrder[swapConfirm.pickB - 1]?.abbrev}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmSwap}
                className="flex-1 bg-white text-bg font-condensed font-bold uppercase py-2.5 rounded"
              >
                TRADE
              </button>
              <button
                onClick={() => { setSwapConfirm(null); setSwapFirst(null); }}
                className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase py-2.5 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Draft confirm dialog */}
      {showStartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-green rounded-xl p-6 max-w-sm w-full">
            <p className="font-display text-xl text-green mb-2">
              START 2-MINUTE COUNTDOWN?
            </p>
            <p className="font-condensed text-white mb-4">
              All players will see a countdown. Brackets auto-submit when it
              hits zero, then the draft goes live.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const startsAt = new Date(
                    Date.now() + DRAFT_COUNTDOWN_SECONDS * 1000
                  ).toISOString();
                  await setDraftCountdown(roomCode, startsAt);
                  setShowStartConfirm(false);
                }}
                className="flex-1 bg-green text-bg font-condensed font-bold uppercase py-2.5 rounded"
              >
                START COUNTDOWN
              </button>
              <button
                onClick={() => setShowStartConfirm(false)}
                className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase py-2.5 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft takeover overlay */}
      {showTakeover && (
        <DraftTakeover onComplete={() => setShowTakeover(false)} />
      )}

      {/* Bracket share modal */}
      {showShareModal && roomCode && (
        <BracketShareModal roomCode={roomCode} onClose={() => setShowShareModal(false)} isRoomCreation={shareIsCreation} />
      )}

      {/* Auto-submit toast */}
      {autoSubmitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface border border-amber rounded-lg px-4 py-2 shadow-lg">
          <p className="font-condensed text-sm text-amber uppercase">
            {autoSubmitToast}
          </p>
        </div>
      )}
    </div>
  );
}
