import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DRAFT_ORDER } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import {
  updateLiveState,
  clearGuesses,
  resetDraft,
  clearRoastsForPick,
  clearRoastVotesForPick,
} from "../lib/storage";
import { getSession } from "../lib/session";

import DraftRow from "../components/draft/DraftRow";
import type { RowState } from "../components/draft/DraftRow";
import TimerBar from "../components/ui/TimerBar";
import CommissionerDashboard from "../components/commissioner/CommissionerDashboard";
import PlayerSelectionPanel from "../components/draft/PlayerSelectionPanel";
import ScoreboardModal from "../components/leaderboard/ScoreboardModal";
import BearsMode from "../components/bears/BearsMode";
import Confetti from "../components/bears/Confetti";
import BlockbusterTradeOverlay from "../components/bears/BlockbusterTradeOverlay";
import BracketShareModal from "../components/draft/BracketShareModal";
import RoomWelcome from "../components/draft/RoomWelcome";
import RoomInterstitial from "../components/draft/RoomInterstitial";
import PickReactionScreen from "../components/reactions/PickReactionScreen";
import QuiplashPanel from "../components/reactions/QuiplashPanel";
import RunningChaosMeter from "../components/chaos/RunningChaosMeter";
import RoomPulse from "../components/draft/RoomPulse";
import RecapOverlay from "../components/leaderboard/RecapOverlay";
import BracketProgressStrip from "../components/draft/BracketProgressStrip";
import PickRecapCard from "../components/draft/PickRecapCard";
import DraftTakeover from "../components/draft/DraftTakeover";
import ReassignTeamModal from "../components/commissioner/ReassignTeamModal";
import CommissionerQuickStart from "../components/commissioner/CommissionerQuickStart";
import ConnectionIndicator from "../components/ui/ConnectionIndicator";
import { useVisibility } from "../hooks/useVisibility";
import { useBracketPhase } from "../hooks/useBracketPhase";
import { useRoomData } from "../hooks/useRoomData";
import { useLivePickCycle } from "../hooks/useLivePickCycle";
import { useRecap } from "../hooks/useRecap";
import { useQuiplash } from "../hooks/useQuiplash";

type RoomStatus = "bracket" | "live" | "done";

export default function DraftScreen({ initialStatus }: { initialStatus?: RoomStatus }) {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const justCreated = (location.state as { justCreated?: boolean })?.justCreated ?? false;
  const justJoined = (location.state as { justJoined?: boolean })?.justJoined ?? false;

  // Clear location state so refresh doesn't replay interstitial/welcome
  useEffect(() => {
    if (justCreated || justJoined) {
      window.history.replaceState({}, "");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only: clear location state once

  const welcomeKey = roomCode ? `warroom-welcomed-${roomCode}` : "";
  const [showInterstitial, setShowInterstitial] = useState(justCreated || justJoined);
  const [interstitialFading, setInterstitialFading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (justCreated || justJoined) return true; // will show after interstitial
    if (!welcomeKey) return false;
    return !localStorage.getItem(welcomeKey);
  });
  const [showTakeover, setShowTakeover] = useState(false);

  // ── Commissioner Quick Start ──
  const quickStartKey = roomCode ? `warroom-quickstart-${roomCode}` : "";
  const [showQuickStart, setShowQuickStart] = useState(false);

  // ── UI state ──
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [commissionerTab, setCommissionerTab] = useState<"picks" | "admin">("picks");
  const [expandedPick, setExpandedPick] = useState<number | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const startingDraft = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tripleTapRef = useRef<number[]>([]);
  const [showStartButton, setShowStartButton] = useState(false);
  const handleStartDraftRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // ── Team reassignment (commissioner admin tab) ──
  const [reassignPick, setReassignPick] = useState<number | null>(null);

  // ── Room data hook (Firebase subs + derived state) ──
  const isPrimaryCommissioner = session?.isCommissioner ?? false;
  const roomData = useRoomData({ roomCode, navigate, session, initialStatus });
  const {
    backupCommissionerId, liveState, results, scores, brackets, users,
    allReactions, isLive, effectiveOrder, confirmedPicks, totalUsers,
  } = roomData;

  // Derived early so the auto-show effect can include backup commissioners
  const isCommissioner = isPrimaryCommissioner || session?.id === backupCommissionerId;

  // ── Bracket phase hook ──
  const onLockout = useCallback(() => {
    handleStartDraftRef.current();
  }, []);
  const bracket = useBracketPhase({ roomCode, session, isLive, onLockout });

  // ── Live pick cycle hook (guesses, animations, scoring, Room Pulse, recap) ──
  const cycle = useLivePickCycle({
    roomCode,
    session,
    isLive,
    liveState,
    confirmedPicks,
    users,
    brackets,
  });

  // ── Recap hook (triggers at pick 32) ──
  const recap = useRecap({ roomCode, confirmedPicks, brackets, scores });

  // ── Quiplash hook (write/vote during finalize dead time) ──
  const quiplash = useQuiplash({
    roomCode,
    userName: session?.name,
    liveState,
    totalUsers,
  });

  // ── Per-pick score delta + rank for PickRecapCard ──
  // Stores the flashData.scoreDelta from the last animation (per-pick earnings, not cumulative)
  const lastPickDeltaRef = useRef<{ bracket: number; live: number } | null>(null);

  const userRank = useMemo(() => {
    if (!isLive || confirmedPicks.length === 0 || !session) return undefined;
    const sorted = Object.entries(scores)
      .map(([name, s]) => ({ name, total: s.bracketScore + s.liveScore }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    if (sorted.length === 0) return undefined;
    const idx = sorted.findIndex((e) => e.name === session.name);
    return idx >= 0 ? idx + 1 : undefined;
  }, [isLive, confirmedPicks.length, session?.name, scores]);

  // ── Capture per-pick score delta when grade overlay dismisses ──
  const prevAnimationRef = useRef(cycle.animation);
  useEffect(() => {
    const prev = prevAnimationRef.current;
    prevAnimationRef.current = cycle.animation;

    // Detect transition: reaction → null (grade overlay dismissed)
    if (prev?.type === "reaction" && !cycle.animation) {
      lastPickDeltaRef.current = prev.flashData.scoreDelta;
    }
  }, [cycle.animation]);

  // ── Commissioner defaults to admin tab when joining live ──
  // Includes backup commissioners so they see the quick start guide when promoted mid-draft
  useEffect(() => {
    if (isCommissioner && isLive) {
      setCommissionerTab("admin");
      // Show quick start guide on first visit to admin tab during live
      if (quickStartKey && !localStorage.getItem(quickStartKey)) {
        setShowQuickStart(true);
      }
    }
  }, [isLive, isCommissioner]); // eslint-disable-line react-hooks/exhaustive-deps -- trigger on live transition or commissioner promotion

  // ── Visibility tracking (tab backgrounding) ──
  const { toast: visibilityToast, dismissToast } = useVisibility(
    liveState?.currentPick ?? null
  );

  // ── Reset activeSlot when pick advances (needs to stay in orchestrator) ──
  useEffect(() => {
    if (!liveState) return;
    // When the hook detects pick advance, also clear activeSlot in the orchestrator
    setActiveSlot(null);
  }, [liveState?.currentPick]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to pick changes

  // ── Derived data ──
  const pickedPlayers = confirmedPicks.map((p) => p.playerName);
  const latestPick = confirmedPicks.length > 0
    ? confirmedPicks[confirmedPicks.length - 1].pick
    : null;

  const currentSlot = effectiveOrder.find(
    (s) => s.pick === (liveState?.currentPick || 1)
  );

  // ── Row state helper ──
  const getRowState = useCallback((slotIndex: number): RowState => {
    if (!isLive) return bracket.bracketLocked ? "locked" : "editable";
    const pickNum = slotIndex + 1;
    const currentPick = liveState?.currentPick || 1;
    if (results[`pick${pickNum}`]) return "completed";
    if (pickNum === currentPick) return "active";
    return "locked";
  }, [isLive, bracket.bracketLocked, liveState?.currentPick, results]);

  // ── Get user's live guess for a pick ──
  function getUserGuess(pickNum: number): string | null {
    if (!session) return null;
    if (pickNum === liveState?.currentPick) return cycle.currentGuess;
    return cycle.getUserGuess(pickNum);
  }

  // ── Draft start (auto-triggered by countdown or manual triple-tap) ──
  const handleStartDraft = useCallback(async () => {
    if (!roomCode || !session || startingDraft.current) return;
    startingDraft.current = true;

    try {
      // Auto-submit bracket if not already submitted
      await bracket.autoSubmitBracket();

      // Any client can write initial live state — idempotent (all write same data)
      await roomData.initLiveState();

      // Commissioner starts on admin tab
      if (isCommissioner) {
        setCommissionerTab("admin");
      }

      // Dismiss welcome screen and persist
      setShowWelcome(false);
      if (welcomeKey) localStorage.setItem(welcomeKey, "1");

      // Show takeover
      setShowTakeover(true);
    } catch (err) {
      console.error("[StartDraft] failed:", err);
      startingDraft.current = false;
    }
  }, [roomCode, session, isCommissioner, bracket.autoSubmitBracket, roomData.initLiveState]); // eslint-disable-line react-hooks/exhaustive-deps -- welcomeKey, setters are stable

  // Keep ref in sync so the stable onLockout callback can call the latest version
  useEffect(() => { handleStartDraftRef.current = handleStartDraft; }, [handleStartDraft]);

  /** Wraps cycle.handleLiveSelect + closes panel */
  function handleLiveSelect(playerName: string) {
    cycle.handleLiveSelect(playerName);
    setActiveSlot(null);
  }

  /** Wraps cycle.handleLiveSubmit + switches commissioner to admin tab */
  const handleLiveSubmit = useCallback(async () => {
    await cycle.handleLiveSubmit();
    if (session?.isCommissioner) {
      setCommissionerTab("admin");
      scrollContainerRef.current?.scrollTo({ top: 0 });
    }
  }, [cycle, session?.isCommissioner]);

  const handleRowClick = useCallback((slotIndex: number) => {
    const state = getRowState(slotIndex);
    if (state === "editable") {
      setActiveSlot(slotIndex);
    } else if (state === "active" && liveState?.windowOpen && !cycle.guessSubmitted) {
      setActiveSlot(slotIndex);
    }
  }, [getRowState, liveState?.windowOpen, cycle.guessSubmitted]);

  const handleToggleExpand = useCallback((pickNum: number) => {
    setExpandedPick((prev) => (prev === pickNum ? null : pickNum));
  }, []);

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

    // Clear guesses, roasts, and votes if reassigning the current pick
    if (isCurrentPick) {
      await Promise.all([
        clearGuesses(roomCode, pickNum),
        clearRoastsForPick(roomCode, pickNum),
        clearRoastVotesForPick(roomCode, pickNum),
      ]);
      cycle.resetGuessState();
      quiplash.resetQuiplashState();
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
  }

  /** Consolidated reset handler — used by header button + CommissionerDashboard */
  const handleReset = useCallback(async () => {
    if (!roomCode) return;
    if (!confirm("Reset draft? Clears all picks, guesses, scores.")) return;
    await resetDraft(roomCode);
    roomData.resetRoomData();
    cycle.resetCycleState();
    recap.resetRecapState();
    quiplash.resetQuiplashState();
    setExpandedPick(null);
    setReassignPick(null);
    lastPickDeltaRef.current = null;
    // Reset quick start so guide re-shows on next live session
    if (quickStartKey) localStorage.removeItem(quickStartKey);
  }, [roomCode, roomData, cycle, recap, quiplash, quickStartKey]);

  if (!session || !roomCode) return null;

  const showCommissionerTabs = isCommissioner && isLive;

  // windowFinalizing: derived locally for DraftRow "Finalizing pick..." text
  const windowFinalizing = isLive && !!liveState && !liveState.windowOpen && !!liveState.windowOpenedAt;

  // Room Pulse element — reused in both commissioner admin and picks tab
  const roomPulseElement = cycle.roomPulseData ? (
    <div className="mb-3">
      <RoomPulse
        pickGuesses={cycle.roomPulseData.guesses}
        userName={session.name}
        pickNumber={cycle.roomPulseData.pickNumber}
        totalUsers={totalUsers}
      />
    </div>
  ) : null;

  return (
    <div className="h-dvh bg-bg flex flex-col overflow-clip">
      {/* Animation state machine overlays */}
      {cycle.animation?.type === "bears" && (
        <>
          <BearsMode onComplete={cycle.advanceToReaction} />
          <Confetti />
        </>
      )}
      {cycle.animation?.type === "blockbuster" && (
        <>
          <BlockbusterTradeOverlay trade={cycle.animation.trade} onComplete={cycle.advanceToReaction} />
          <Confetti heavy />
        </>
      )}
      {cycle.animation?.type === "confetti" && (
        <Confetti teamAbbrev={cycle.animation.team} onComplete={cycle.advanceToReaction} />
      )}
      {cycle.animation?.type === "reaction" && (
        <PickReactionScreen
          slot={cycle.animation.flashData.slot}
          playerName={cycle.animation.flashData.playerName}
          teamAbbrev={cycle.animation.flashData.teamAbbrev}
          priorPicks={cycle.animation.flashData.priorPicks}
          roomCode={roomCode}
          userName={session.name}
          onComplete={cycle.dismissAnimation}
        />
      )}

      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="font-display text-2xl text-amber tracking-wide">
              {isLive ? "WAR ROOM" : "PRE-DRAFT BRACKET"}
            </h1>
            <p className="font-mono text-xs text-muted">
              {session.name} — Room {roomCode}
            </p>
          </div>
          {isCommissioner && isLive && (
            <span className="flex items-center gap-1.5 ml-2 font-condensed text-xs text-amber uppercase tracking-wide border border-amber/30 bg-amber/5 px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse-glow" />
              COMMISSIONER
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <button
              onClick={() => setShowScoreboard(true)}
              className="bg-surface-elevated border border-border text-muted font-condensed font-bold uppercase text-xs px-3 py-1.5 rounded hover:text-white hover:border-amber transition-all"
            >
              LEADERBOARD
            </button>
          )}
          {isLive && confirmedPicks.length >= 32 && recap.recapData && !recap.showRecap && (
            <button
              onClick={() => recap.setShowRecap(true)}
              className="bg-surface-elevated border border-border text-muted font-condensed font-bold uppercase text-xs px-3 py-1.5 rounded hover:text-white hover:border-amber transition-all"
            >
              RESULTS
            </button>
          )}
        </div>
      </header>

      {/* Connection status */}
      <ConnectionIndicator />

      {/* Commissioner: Start Draft banner (bracket phase) — triple-tap countdown to reveal button */}
      {!isLive && isCommissioner && (
        <div className="shrink-0 bg-surface border-b border-border px-4 py-2 flex items-center justify-between gap-3">
          <button
            type="button"
            className="font-condensed text-sm sm:text-base uppercase select-none cursor-default bg-transparent border-none p-0 text-left"
            onClick={() => {
              const now = Date.now();
              const recent = tripleTapRef.current.filter((t) => now - t < 500);
              recent.push(now);
              tripleTapRef.current = recent;
              if (recent.length >= 3) {
                setShowStartButton((v) => !v);
                tripleTapRef.current = [];
              }
            }}
          >
            {bracket.bracketLocked ? <span className="text-white/70">Brackets locked</span> : <><span className="font-mono text-white/70">Brackets lock in </span><span className="font-mono text-white font-bold">{bracket.countdown}</span></>}
          </button>
          {showStartButton && (
            <button
              onClick={async () => {
                await handleStartDraft();
              }}
              className="bg-green text-bg font-condensed font-bold uppercase text-xs px-4 py-1.5 rounded hover:brightness-110 transition-all"
            >
              START DRAFT
            </button>
          )}
        </div>
      )}

      {/* Non-commissioner: bracket lock countdown (bracket phase) */}
      {!isLive && !isCommissioner && (
        <div className="shrink-0 bg-surface border-b border-border px-4 py-2">
          <span className="font-condensed text-sm sm:text-base uppercase">
            {bracket.bracketLocked ? <span className="text-white/70">Brackets locked</span> : <><span className="font-mono text-white/70">Brackets lock in </span><span className="font-mono text-white font-bold">{bracket.countdown}</span></>}
          </span>
        </div>
      )}

      {/* Commissioner tabs */}
      {showCommissionerTabs && (
        <div className="bg-surface border-b border-border grid grid-cols-2">
          {(["picks", "admin"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCommissionerTab(tab)}
              className={`font-condensed text-base uppercase py-3.5 text-center border-b-[3px] transition-colors ${
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

      {/* Timer bar (live phase) — hidden on commissioner admin tab (hero card has its own) */}
      {isLive && liveState && commissionerTab !== "admin" && (
        <TimerBar
          liveState={liveState}
          currentSlot={currentSlot}
          userGuess={cycle.currentGuess}
          submitted={cycle.guessSubmitted}
          onSubmit={handleLiveSubmit}
          guessCount={cycle.guessCount}
          totalUsers={totalUsers}
        />
      )}

      {/* Running chaos meter — pinned below timer bar */}
      {isLive && confirmedPicks.length > 0 && commissionerTab !== "admin" && (
        <RunningChaosMeter confirmedPicks={confirmedPicks} />
      )}


      {/* Recap overlay */}
      {recap.showRecap && recap.recapData && (
        <RecapOverlay
          recapData={recap.recapData}
          personas={recap.personas}
          roomCode={roomCode}
          confirmedPicks={confirmedPicks}
          onClose={() => recap.setShowRecap(false)}
        />
      )}

      {/* Scoreboard modal */}
      {showScoreboard && (
        <ScoreboardModal
          scores={scores}
          totalPicks={confirmedPicks.length}
          onClose={() => setShowScoreboard(false)}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Main grid */}
        <div ref={scrollContainerRef} className="flex-1 min-h-0 px-2 py-4 sm:p-4 pb-20 sm:pb-4 overflow-auto">
          {/* ── Commissioner Admin Tab ── */}
          {commissionerTab === "admin" && isLive && liveState ? (
            <CommissionerDashboard
              roomCode={roomCode}
              liveState={liveState}
              effectiveOrder={effectiveOrder}
              results={results}
              pickedPlayers={pickedPlayers}
              users={users}
              backupCommissionerId={backupCommissionerId}
              isPrimaryCommissioner={isPrimaryCommissioner}
              guessCount={cycle.guessCount}
              totalUsers={totalUsers}
              aboveBoardSlot={roomPulseElement}
              onShowQuickStart={() => setShowQuickStart(true)}
            />
          ) : (
            <>
              {/* Bracket progress strip + explainer (bracket phase only) */}
              {!isLive && (
                <>
                  <BracketProgressStrip filled={bracket.picks.filter(Boolean).length} total={32} />
                  <p className="px-3 font-condensed text-sm text-white/60 mb-2">
                    Predict all 32 Round 1 picks. Tap a row to select a player.
                  </p>
                </>
              )}

              {/* Room Pulse — picks tab */}
              {roomPulseElement}

              {/* Quiplash — picks tab only, during finalize dead time */}
              {quiplash.phase && quiplash.prompt && (
                <QuiplashPanel
                  phase={quiplash.phase}
                  prompt={quiplash.prompt}
                  answers={quiplash.answers}
                  votes={quiplash.votes}
                  draftText={quiplash.draftText}
                  setDraftText={quiplash.setDraftText}
                  answerCount={quiplash.answerCount}
                  totalUsers={quiplash.totalUsers}
                  userName={session.name}
                  onSubmitAnswer={quiplash.submitAnswer}
                  onSubmitVote={quiplash.submitVote}
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
                    userPick = bracket.picks[i]?.playerName ?? null;
                  }

                  const confirmed = results[`pick${pickNum}`] ?? null;
                  const isCorrect =
                    confirmed && userPick
                      ? userPick === confirmed.playerName
                      : confirmed
                        ? false
                        : null;

                  const shouldScroll = isLive && (
                    liveState?.windowOpen
                      ? pickNum === liveState.currentPick
                      : pickNum === latestPick
                  );

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
                        onClick={handleRowClick}
                        expanded={expandedPick === pickNum}
                        onToggleExpand={handleToggleExpand}
                        isPulsing={i === bracket.firstEmptyIndex && !userPick}
                        shouldScroll={shouldScroll}
                        scrollContainerRef={scrollContainerRef}
                        onSubmit={rowState === "active" && isLive && cycle.currentGuess && !cycle.guessSubmitted ? handleLiveSubmit : undefined}
                        submitted={rowState === "active" && isLive ? cycle.guessSubmitted : undefined}
                        windowOpen={rowState === "active" && isLive ? liveState?.windowOpen : undefined}
                        windowFinalizing={rowState === "active" && windowFinalizing}
                      />
                      {pickNum === latestPick && !cycle.animation && (
                        <PickRecapCard
                          roomCode={roomCode}
                          pickNum={pickNum}
                          reactions={allReactions[`pick${pickNum}`] ?? {}}
                          userRank={userRank}
                          scoreDelta={lastPickDeltaRef.current ?? undefined}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bracket submit button + share invite */}
          {!isLive && !bracket.bracketLocked && (
            <div className="mt-4 space-y-2">
              <button
                onClick={bracket.handleBracketSubmit}
                className={`w-full font-condensed font-bold uppercase tracking-wide py-3 rounded transition-all ${
                  !bracket.bracketSubmitted
                    ? "bg-amber text-bg hover:brightness-110"
                    : bracket.bracketDirty
                      ? "bg-amber text-bg hover:brightness-110"
                      : "bg-green/20 border border-green text-green"
                }`}
              >
                {!bracket.bracketSubmitted
                  ? "SUBMIT BRACKET"
                  : bracket.bracketDirty
                    ? "UPDATE BRACKET"
                    : "BRACKET SUBMITTED"}
              </button>
              {bracket.bracketSubmitted && (
                <button
                  onClick={() => bracket.setShowShareModal(true)}
                  className="w-full bg-surface-elevated border border-border text-white font-condensed font-bold uppercase tracking-wide py-2.5 rounded hover:border-amber transition-all text-sm"
                >
                  SHARE INVITE
                </button>
              )}
            </div>
          )}

          {/* Post-submit confirmation card (visible when locked) */}
          {!isLive && bracket.bracketLocked && bracket.bracketSubmitted && (
            <div className="mt-4 bg-surface-elevated border border-green/30 rounded-lg p-4 text-center space-y-3">
              <div className="text-green font-condensed font-bold uppercase text-lg tracking-wide">
                ✓ BRACKET LOCKED IN
              </div>
              <div className="font-mono text-sm text-white/70">
                {bracket.picks.filter(Boolean).length}/32 picks submitted
              </div>
              <div className="border-t border-border pt-3">
                <span className="font-condensed text-xs uppercase text-muted tracking-wide">
                  Waiting for commissioner to start the draft
                </span>
                <div className="mt-1.5 flex justify-center">
                  <span className="w-2 h-2 rounded-full bg-amber animate-pulse-glow" />
                </div>
              </div>
            </div>
          )}

          {/* Support link */}
          <div className="mt-8 flex justify-center">
            <a
              href="https://buymeacoffee.com/beardown5"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-elevated border border-border text-muted font-condensed font-bold uppercase text-xs px-3 py-1.5 rounded hover:text-white hover:border-amber transition-all"
            >
              SUPPORT
            </a>
          </div>
        </div>

        {/* Sidebar — consensus board (bracket phase only) */}
        {!isLive && (
          <div className="hidden lg:block lg:static lg:w-72 lg:border-l lg:border-border overflow-auto">
            <div className="p-4">
              <h2 className="font-display text-lg text-amber mb-3 tracking-wide">
                CONSENSUS BOARD
              </h2>
              <div className="space-y-0.5">
                {PROSPECTS.map((p) => {
                  const selected = bracket.selectedPlayers.has(p.name);
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
            isLive ? new Set(pickedPlayers) : bracket.selectedPlayers
          }
          currentPick={
            isLive ? cycle.currentGuess : bracket.picks[activeSlot]?.playerName ?? null
          }
          onSelect={(name) => {
            if (isLive) {
              handleLiveSelect(name);
            } else {
              bracket.handleBracketSelect(activeSlot, name);
              setActiveSlot(null);
            }
          }}
          onClear={() => {
            if (!isLive) {
              bracket.handleBracketClear(activeSlot);
              setActiveSlot(null);
            }
          }}
          onClose={() => setActiveSlot(null)}
          liveSubmitted={isLive ? cycle.guessSubmitted : false}
        />
      )}

      {/* Commissioner: floating buttons (admin tab, live phase) */}
      {isCommissioner && isLive && liveState && commissionerTab === "admin" && (
        <div className="fixed bottom-24 right-4 z-40 lg:bottom-4 flex flex-col gap-2 items-end">
          <button
            onClick={handleReset}
            className="bg-red/20 border border-red text-red font-condensed font-bold uppercase text-xs px-3 py-2 rounded shadow-lg hover:bg-red/30 transition-all"
          >
            RESET DRAFT
          </button>
        </div>
      )}

      {/* Team reassignment picker modal */}
      {reassignPick !== null && (
        <ReassignTeamModal
          pickNumber={reassignPick}
          currentTeamAbbrev={effectiveOrder[reassignPick - 1]?.abbrev ?? "??"}
          onReassign={handleReassignTeam}
          onClose={() => setReassignPick(null)}
        />
      )}


      {/* Commissioner quick start guide */}
      {showQuickStart && (
        <CommissionerQuickStart
          onDismiss={() => {
            if (quickStartKey) localStorage.setItem(quickStartKey, "1");
            setShowQuickStart(false);
          }}
        />
      )}

      {/* Draft takeover overlay */}
      {showTakeover && (
        <DraftTakeover onComplete={() => setShowTakeover(false)} />
      )}

      {/* Room interstitial (creating/joining animation — bracket phase only) */}
      {showInterstitial && !isLive && (
        <RoomInterstitial
          mode={justCreated ? "creating" : "joining"}
          onFadeStart={() => setInterstitialFading(true)}
          onComplete={() => setShowInterstitial(false)}
        />
      )}

      {/* Room welcome onboarding (shows behind interstitial during fade, then fully visible — bracket phase only) */}
      {showWelcome && !isLive && (!showInterstitial || interstitialFading) && roomCode && session && (
        <RoomWelcome
          roomCode={roomCode}
          isCommissioner={session.isCommissioner}
          playerCount={Object.keys(users).length}
          onDismiss={() => {
            if (welcomeKey) localStorage.setItem(welcomeKey, "1");
            setShowWelcome(false);
          }}
        />
      )}

      {/* Bracket share modal (post-submit) */}
      {bracket.showShareModal && roomCode && (
        <BracketShareModal roomCode={roomCode} onClose={() => bracket.setShowShareModal(false)} />
      )}

      {/* Auto-submit toast */}
      {bracket.autoSubmitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface border border-amber rounded-lg px-4 py-2 shadow-lg">
          <p className="font-condensed text-sm text-amber uppercase">
            {bracket.autoSubmitToast}
          </p>
        </div>
      )}

      {/* Welcome back toast (tab visibility) */}
      {visibilityToast && (
        <button
          onClick={dismissToast}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-surface border border-green rounded-lg px-4 py-2 shadow-lg cursor-pointer hover:bg-surface/90 transition-all animate-bounce-once"
        >
          <p className="font-condensed text-sm text-green uppercase">
            Welcome back! {visibilityToast.missedPicks} pick{visibilityToast.missedPicks !== 1 ? "s" : ""} happened — now on pick #{visibilityToast.currentPick}
          </p>
        </button>
      )}
    </div>
  );
}
