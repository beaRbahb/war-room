import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DRAFT_ORDER, getEffectiveDraftOrder } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import { BRACKET_LOCK_TIME, GUESS_WINDOW_SECONDS } from "../data/scoring";
import { getTeamLogo, TEAMS } from "../data/teams";
import {
  saveBracket,
  getBracket,
  onRoomConfig,
  updateRoomStatus,
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
  removeUser,
  setBackupCommissioner,
} from "../lib/storage";
import { getSession, clearSession } from "../lib/session";
import { calcBracketScore, calcLiveScore } from "../lib/scoring";
import { assignPersonas, type PersonaType } from "../lib/personas";
import { calcUserRecap, calcRoomRecap, type UserRecapStats, type RoomRecapStats } from "../lib/recap";
import { REVEAL_PAUSE_MS } from "../data/scoring";

import DraftRow from "../components/draft/DraftRow";
import type { RowState } from "../components/draft/DraftRow";
import TimerBar from "../components/ui/TimerBar";
import CommissionerControls from "../components/leaderboard/CommissionerControls";
import PlayerSelectionPanel from "../components/draft/PlayerSelectionPanel";
import Leaderboard from "../components/leaderboard/Leaderboard";
import BearsMode from "../components/bears/BearsMode";
import Confetti from "../components/bears/Confetti";
import BearsBustOverlay from "../components/bears/BearsBustOverlay";
import BearsIcedOverlay from "../components/bears/BearsIcedOverlay";
import BlockbusterTradeOverlay from "../components/bears/BlockbusterTradeOverlay";
import { isBlockbusterTrade, type BlockbusterTradePlayer } from "../data/blockbusterTrades";
import { getRandomBearsMoment, type BearsMoment } from "../data/bearsBusts";
import BracketShareModal from "../components/draft/BracketShareModal";
import RoomWelcome from "../components/draft/RoomWelcome";
import PickReactionScreen from "../components/reactions/PickReactionScreen";
import RunningChaosMeter from "../components/chaos/RunningChaosMeter";
import RecapCard from "../components/leaderboard/RecapCard";
import RoomRecap from "../components/leaderboard/RoomRecap";
import BracketProgressStrip from "../components/draft/BracketProgressStrip";
import DraftTakeover from "../components/draft/DraftTakeover";

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
  const [backupCommissionerId, setBackupCommissionerId] = useState<string | null>(null);

  // ── Bracket phase state ──
  const [picks, setPicks] = useState<(BracketPick | null)[]>(Array(32).fill(null));
  const [bracketLocked, setBracketLocked] = useState(false);
  const [bracketSubmitted, setBracketSubmitted] = useState(false);
  const [countdown, setCountdown] = useState("");

  const [showShareModal, setShowShareModal] = useState(false);
  const welcomeKey = roomCode ? `warroom-welcomed-${roomCode}` : "";
  const [showWelcome, setShowWelcome] = useState(() => {
    if (justCreated) return true;
    if (!welcomeKey) return false;
    return !localStorage.getItem(welcomeKey);
  });
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

  // ── Team reassignment (commissioner admin tab) ──
  const [reassignPick, setReassignPick] = useState<number | null>(null);
  const [reassignSearch, setReassignSearch] = useState("");

  // ── Overlays ──
  const [showBearsMode, setShowBearsMode] = useState(false);
  const [bearsMoment, setBearsMoment] = useState<BearsMoment | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [blockbusterTrade, setBlockbusterTrade] = useState<BlockbusterTradePlayer | null>(null);
  const [blockbusterConfetti, setBlockbusterConfetti] = useState(false);
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

  // Refs for draft start callback — keeps identity stable
  const picksRef = useRef(picks);
  picksRef.current = picks;
  const bracketSubmittedRef = useRef(bracketSubmitted);
  bracketSubmittedRef.current = bracketSubmitted;

  const isLive = roomStatus === "live" || roomStatus === "done";

  /** Draft order with live overrides applied (bracket phase uses static DRAFT_ORDER) */
  const effectiveOrder = useMemo(
    () => isLive ? getEffectiveDraftOrder(liveState?.overrides ?? {}) : DRAFT_ORDER,
    [isLive, liveState?.overrides]
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
      setBackupCommissionerId(config.backupCommissionerId ?? null);
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

  // ── Subscribe to users in all phases (for kick detection) ──
  useEffect(() => {
    if (!roomCode) return;
    return onUsers(roomCode, setUsers);
  }, [roomCode]);

  // ── Kick detection: redirect if current user removed ──
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

  // ── Reset guess state when commissioner reassigns team (guessResetAt signal) ──
  const prevGuessResetRef = useRef<string | null>(null);
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
        // If no guess selected, don't mark as submitted — just let the window close
      }
    }, 200);
    return () => clearInterval(interval);
  }, [roomCode, session, liveState?.windowOpen, liveState?.windowOpenedAt, liveState?.currentPick, currentGuess, guessSubmitted]);

  // ── Auto-close window on timer expiry (all clients, not just commissioner) ──
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

    // Late joiner: if this is our first processing pass and there are already multiple
    // confirmed picks, pre-seed processedPicks to skip stale animations.
    const isLateJoin = processedPicks.current.size === 0 && confirmedPicks.length > 1;
    if (isLateJoin) {
      confirmedPicks.forEach((p) => processedPicks.current.add(p.pick));
      // Still run scoring for all picks (below) but skip animations
    } else {
      processedPicks.current.add(latest.pick);
    }

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

    // Skip animations for late joiners — only trigger for live picks
    const bt = isBlockbusterTrade(latest.playerName);
    if (!isLateJoin) {
      if (latest.isBearsPick && bt) {
        // Blockbuster trade — special overlay replaces normal BearsMode
        setBlockbusterTrade(bt);
        setBlockbusterConfetti(true);
        setTimeout(() => setBlockbusterConfetti(false), 10000);
      } else if (latest.isBearsPick) {
        setShowBearsMode(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
      }
    }

    const isBlockbuster = !!bt;
    const pickGuessKey = `pick${latest.pick}`;
    let confettiFired = false;
    const userName = session.name;
    const unsub = onGuesses(roomCode, latest.pick, (guesses) => {
      setAllGuesses((prev) => ({ ...prev, [pickGuessKey]: guesses }));

      // Skip confetti/chaos for late joiners
      if (!isLateJoin) {
        const isBears = latest.isBearsPick && !isBlockbuster;

        // Blockbuster trades get their own heavy confetti — skip normal confetti
        // Bears picks already have confetti fired from BearsMode trigger
        if (!isBlockbuster && !isBears && guesses[userName] === latest.playerName) {
          confettiFired = true;
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            setChaosFlash(flashData);
          }, 5500);
        }

        // Show reaction screen: delay for overlays, immediate otherwise
        if (isBlockbuster) {
          setTimeout(() => setChaosFlash(flashData), 8000);
        } else if (isBears) {
          // Wait for BearsMode to finish (3.3s) + brief pause
          setTimeout(() => setChaosFlash(flashData), 3800);
        } else if (!confettiFired) {
          setChaosFlash(flashData);
        }
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

  /** Index of the first unfilled bracket slot (for pulsing hint) */
  const firstEmptyIndex = useMemo(
    () => (!isLive && !bracketLocked ? picks.findIndex((p) => !p) : -1),
    [picks, isLive, bracketLocked]
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
    setShowShareModal(true);
  }

  // ── Draft countdown expired ──
  const handleStartDraft = useCallback(async () => {
    if (!roomCode || !session) return;

    // Auto-submit bracket if not already submitted (read from ref for stable callback identity)
    if (!bracketSubmittedRef.current) {
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
    }

    // Commissioner transitions to live
    if (session.isCommissioner) {
      await updateRoomStatus(roomCode, "live");
    }

    // Show takeover
    setShowTakeover(true);
  }, [roomCode, session]);

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

  async function handleReassignTeam(pickNum: number, newAbbrev: string) {
    if (!roomCode || !liveState) return;
    const originalAbbrev = DRAFT_ORDER[pickNum - 1]?.abbrev;
    const currentOverrides = { ...(liveState.overrides ?? {}) };

    if (newAbbrev === originalAbbrev) {
      // Revert to original — remove override
      delete currentOverrides[String(pickNum)];
    } else {
      currentOverrides[String(pickNum)] = newAbbrev;
    }

    const isCurrentPick = pickNum === liveState.currentPick;

    // Clear guesses and reset window if reassigning the current pick
    if (isCurrentPick) {
      await clearGuesses(roomCode, pickNum);
      setCurrentGuess(null);
      setGuessSubmitted(false);
    }

    await updateLiveState(roomCode, {
      overrides: currentOverrides,
      ...(isCurrentPick && liveState.windowOpen
        ? { windowOpenedAt: new Date().toISOString() }
        : {}),
      // Signal all clients to reset their guess state for this pick
      ...(isCurrentPick ? { guessResetAt: new Date().toISOString() } : {}),
    });

    setReassignPick(null);
    setReassignSearch("");
  }

  const handleBearsModeComplete = useCallback(() => setShowBearsMode(false), []);

  if (!session || !roomCode) return null;

  const isPrimaryCommissioner = session.isCommissioner;
  const isCommissioner = isPrimaryCommissioner || session.id === backupCommissionerId;
  const showCommissionerTabs = isCommissioner && isLive;

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-hidden">
      {/* Overlays */}
      {showBearsMode && <BearsMode onComplete={handleBearsModeComplete} />}
      {bearsMoment?.type === "bust" && (
        <BearsBustOverlay bust={bearsMoment.data} onComplete={() => setBearsMoment(null)} />
      )}
      {bearsMoment?.type === "legend" && (
        <BearsIcedOverlay legend={bearsMoment.data} onComplete={() => setBearsMoment(null)} />
      )}
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
      {blockbusterConfetti && <Confetti heavy />}
      {blockbusterTrade && (
        <BlockbusterTradeOverlay
          trade={blockbusterTrade}
          onComplete={() => setBlockbusterTrade(null)}
        />
      )}

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
          {isLive && isCommissioner && (
            <button
              onClick={async () => {
                if (!confirm("Reset draft? Clears all picks, guesses, scores.")) return;
                await resetDraft(roomCode);
                setResults({});
                setScores({});
                setAllGuesses({});
                setAllReactions({});
                setLiveStateLocal(null);
                setGuessCount(0);
                setCurrentGuess(null);
                setGuessSubmitted(false);
                setExpandedPick(null);
                setChaosFlash(null);
                setShowConfetti(false);
                setShowRecap(false);
                setRecapData(null);
                setReassignPick(null);
                setReassignSearch("");
                processedPicks.current = new Set();
                bearsDoublePicks.current = new Set();
              }}
              className="bg-red/20 border border-red text-red font-condensed font-bold uppercase text-xs px-3 py-1.5 rounded hover:bg-red/30 transition-all"
            >
              RESET
            </button>
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
          <span className="font-condensed text-sm sm:text-base uppercase">
            {bracketLocked ? <span className="text-white/70">Brackets locked</span> : <><span className="font-mono text-white/70">Brackets lock in </span><span className="font-mono text-white font-bold">{countdown}</span></>}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await handleStartDraft();
              }}
              className="bg-green text-bg font-condensed font-bold uppercase text-xs px-4 py-1.5 rounded hover:brightness-110 transition-all"
            >
              START DRAFT
            </button>
            <button
              onClick={async () => {
                if (!confirm("Reset draft? Clears all picks, guesses, scores.")) return;
                await resetDraft(roomCode);
                setResults({});
                setScores({});
                setAllGuesses({});
                bearsDoublePicks.current = new Set();
              }}
              className="bg-red/20 border border-red text-red font-condensed font-bold uppercase text-xs px-4 py-1.5 rounded hover:bg-red/30 transition-all"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {/* Non-commissioner: bracket lock countdown (bracket phase) */}
      {!isLive && !isCommissioner && (
        <div className="shrink-0 bg-surface border-b border-border px-4 py-2 text-center">
          <span className="font-condensed text-sm sm:text-base uppercase">
            {bracketLocked ? <span className="text-white/70">Brackets locked</span> : <><span className="font-mono text-white/70">Brackets lock in </span><span className="font-mono text-white font-bold">{countdown}</span></>}
          </span>
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
              {effectiveOrder.map((slot, i) => {
                const pickNum = i + 1;
                const confirmed = results[`pick${pickNum}`] ?? null;
                const isCurrent = pickNum === liveState.currentPick;
                const isPast = pickNum < liveState.currentPick;
                const canReassign = !isPast; // current or future picks

                return (
                  <div key={slot.pick} className={isCurrent ? "relative" : ""}>
                    <div
                      className={`flex items-center gap-1.5 sm:gap-3 pl-1 pr-2 sm:px-3 h-14 sm:h-12 rounded border transition-colors ${
                        isCurrent
                          ? "bg-amber/5 border-amber"
                          : isPast
                            ? "bg-surface border-border"
                            : "bg-surface border-border opacity-40"
                      }`}
                    >
                      <span className={`font-mono text-xs sm:text-sm w-4 sm:w-8 text-right shrink-0 ${isCurrent ? "text-amber font-bold" : "text-muted"}`}>
                        {pickNum}
                      </span>

                      {/* Tappable team logo+abbrev for reassignment */}
                      <button
                        onClick={() => canReassign ? setReassignPick(pickNum) : undefined}
                        disabled={!canReassign}
                        className={`flex items-center gap-1.5 shrink-0 ${canReassign ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                      >
                        <img
                          src={getTeamLogo(slot.abbrev)}
                          alt={slot.abbrev}
                          className="w-8 h-8 object-contain shrink-0"
                        />
                        <div>
                          <span className="font-condensed text-base text-white uppercase block">
                            {slot.abbrev}
                          </span>
                          {slot.fromTeam && (
                            <span className="font-mono text-[10px] text-muted block leading-tight">
                              via {DRAFT_ORDER[pickNum - 1]?.abbrev}
                            </span>
                          )}
                        </div>
                      </button>

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
                          pendingFinalize={pendingFinalize}
                          onFinalizeSeen={() => setPendingFinalize(false)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* ── User list with kick ── */}
              <div className="mt-6 border border-border rounded p-3">
                <p className="font-condensed text-sm text-muted uppercase tracking-wide mb-2">
                  USERS ({Object.keys(users).length})
                </p>
                <div className="space-y-1">
                  {Object.values(users).map((u) => {
                    const isBackup = u.id === backupCommissionerId;
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded bg-bg"
                      >
                        <span className="font-mono text-sm text-white">
                          {u.name}
                          {u.isCommissioner && (
                            <span className="ml-1.5 text-amber text-xs font-condensed uppercase">
                              COMM
                            </span>
                          )}
                          {isBackup && (
                            <span className="ml-1.5 text-green text-xs font-condensed uppercase">
                              BACKUP
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Backup toggle — primary commissioner only, not self */}
                          {isPrimaryCommissioner && !u.isCommissioner && (
                            <button
                              onClick={() => setBackupCommissioner(roomCode, isBackup ? null : u.id)}
                              className={`font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded border transition-colors ${
                                isBackup
                                  ? "bg-green/20 text-green border-green/40 hover:bg-green/30"
                                  : "bg-surface-elevated text-muted border-border hover:text-white hover:border-amber"
                              }`}
                            >
                              {isBackup ? "REMOVE BACKUP" : "BACKUP"}
                            </button>
                          )}
                          {/* Kick — primary commissioner only, not self */}
                          {isPrimaryCommissioner && !u.isCommissioner && (
                            <button
                              onClick={() => removeUser(roomCode, u.id)}
                              className="font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded bg-red/20 text-red border border-red/40 hover:bg-red/30 transition-colors"
                            >
                              KICK
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset draft — testing only, primary commissioner only */}
              {isPrimaryCommissioner && (
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
                    // Clear reassign state
                    setReassignPick(null);
                    setReassignSearch("");
                    // Clear refs so chaos/confetti triggers work on replay
                    processedPicks.current = new Set();
                    bearsDoublePicks.current = new Set();
                  }}
                  className="mt-4 w-full bg-red/20 border border-red text-red font-condensed font-bold uppercase py-2 rounded text-sm hover:bg-red/30 transition-all"
                >
                  RESET DRAFT (TESTING)
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Bracket progress strip + explainer (bracket phase only) */}
              {!isLive && (
                <>
                  <BracketProgressStrip filled={picks.filter(Boolean).length} total={32} />
                  <p className="px-3 font-condensed text-sm text-white/60 mb-2">
                    Predict all 32 Round 1 picks. Tap a row to select a player.
                  </p>
                </>
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
                        isPulsing={i === firstEmptyIndex && !userPick}
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

          {/* Bracket submit button + share invite */}
          {!isLive && !bracketLocked && (
            <div className="mt-4 space-y-2">
              <button
                onClick={handleBracketSubmit}
                className={`w-full font-condensed font-bold uppercase tracking-wide py-3 rounded transition-all ${
                  bracketSubmitted
                    ? "bg-green/20 border border-green text-green hover:bg-green/30"
                    : "bg-amber text-bg hover:brightness-110"
                }`}
              >
                {bracketSubmitted
                  ? "\u2713 BRACKET SUBMITTED — TAP TO UPDATE"
                  : "SUBMIT BRACKET"}
              </button>
              {bracketSubmitted && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full bg-surface-elevated border border-border text-white font-condensed font-bold uppercase tracking-wide py-2.5 rounded hover:border-amber transition-all text-sm"
                >
                  SHARE INVITE
                </button>
              )}
            </div>
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
                  {PROSPECTS.map((p) => {
                    const selected = selectedPlayers.has(p.name);
                    return (
                      <div key={p.rank}>
                        <div
                          className={`flex items-baseline gap-2 text-xs font-mono py-0.5 ${
                            selected
                              ? "text-muted line-through opacity-50"
                              : p.rank > 32
                                ? "text-white/40"
                                : "text-white"
                          }`}
                        >
                          <span className="w-6 text-right text-muted">
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

      {/* Commissioner: Bears Draft History floating button (live phase) */}
      {isCommissioner && isLive && liveState && commissionerTab === "admin" && (
        <button
          onClick={() => setBearsMoment(getRandomBearsMoment())}
          disabled={liveState.windowOpen || !!bearsMoment}
          className="fixed bottom-24 right-4 z-40 lg:bottom-4 bg-bears-navy border border-bears-orange text-bears-orange font-condensed font-bold uppercase px-3 py-2 rounded text-xs shadow-lg hover:brightness-125 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          BEARS DRAFT HISTORY
        </button>
      )}

      {/* Team reassignment picker modal */}
      {reassignPick !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80" onClick={() => { setReassignPick(null); setReassignSearch(""); }}>
          <div className="bg-surface border border-white/30 rounded-t-xl sm:rounded-xl p-4 w-full sm:max-w-sm max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-display text-lg text-white">
                  REASSIGN PICK #{reassignPick}
                </p>
                <p className="font-mono text-xs text-muted">
                  Current: {effectiveOrder[reassignPick - 1]?.abbrev}
                </p>
              </div>
              <button
                onClick={() => { setReassignPick(null); setReassignSearch(""); }}
                className="text-muted hover:text-white text-xl leading-none px-2"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={reassignSearch}
              onChange={(e) => setReassignSearch(e.target.value)}
              placeholder="Search teams..."
              autoFocus
              className="w-full bg-bg border border-border rounded px-2 py-1.5 text-white font-mono text-xs focus:border-amber focus:outline-none mb-2"
            />
            <div className="flex-1 overflow-auto min-h-0">
              {Object.entries(TEAMS)
                .filter(([abbrev, info]) => {
                  if (!reassignSearch.trim()) return true;
                  const q = reassignSearch.toLowerCase();
                  return abbrev.toLowerCase().includes(q) || info.name.toLowerCase().includes(q);
                })
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([abbrev, info]) => (
                  <button
                    key={abbrev}
                    onClick={() => handleReassignTeam(reassignPick, abbrev)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-elevated transition-colors ${
                      effectiveOrder[reassignPick - 1]?.abbrev === abbrev ? "bg-amber/10 text-amber" : "text-white"
                    }`}
                  >
                    <img src={info.logo} alt={abbrev} className="w-6 h-6 object-contain shrink-0" />
                    <span className="font-condensed text-sm uppercase w-10 shrink-0">{abbrev}</span>
                    <span className="font-mono text-xs text-muted truncate">{info.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}


      {/* Draft takeover overlay */}
      {showTakeover && (
        <DraftTakeover onComplete={() => setShowTakeover(false)} />
      )}

      {/* Room welcome onboarding (first visit) */}
      {showWelcome && roomCode && session && (
        <RoomWelcome
          roomCode={roomCode}
          isCommissioner={session.isCommissioner}
          onDismiss={() => {
            if (welcomeKey) localStorage.setItem(welcomeKey, "1");
            setShowWelcome(false);
          }}
        />
      )}

      {/* Bracket share modal (post-submit) */}
      {showShareModal && roomCode && (
        <BracketShareModal roomCode={roomCode} onClose={() => setShowShareModal(false)} />
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
