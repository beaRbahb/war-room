import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../lib/session";
import {
  onLiveState,
  onResults,
  onScores,
  onBrackets,
  onUsers,
  updateScores,
  getGuessCount,
  setLiveState,
  updateRoomStatus,
  updateLiveState,
  onGuesses,
} from "../lib/storage";
import { DRAFT_ORDER } from "../data/draftOrder";
import { REVEAL_PAUSE_MS } from "../data/scoring";
import { calcBracketScore, getBracketHitsForPick, calcLiveScore } from "../lib/scoring";
import { getTeamLogo } from "../data/teams";
import type {
  LiveState,
  ConfirmedPick,
  UserScores,
  UserBracket,
  RoomUser,
} from "../types";

import PickCard from "../components/PickCard";
import PickWindow from "../components/PickWindow";
import CommissionerPanel from "../components/CommissionerPanel";
import Leaderboard from "../components/Leaderboard";
import BearsMode from "../components/BearsMode";
import Confetti from "../components/Confetti";
import TrubiskyOverlay from "../components/TrubiskyOverlay";
import ChaosFlash from "../components/ChaosFlash";
import { calcChaosScore } from "../lib/chaos";
import { assignPersonas, type PersonaType } from "../lib/personas";
import { getAllGuesses, getAllReactions } from "../lib/storage";
import { calcUserRecap, calcRoomRecap, type UserRecapStats, type RoomRecapStats } from "../lib/recap";
import RecapCard from "../components/RecapCard";
import RoomRecap from "../components/RoomRecap";
import type { LeaderboardEntry } from "../types";

export default function LiveDraftScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const session = getSession();

  const [liveState, setLiveStateLocal] = useState<LiveState | null>(null);
  const [results, setResults] = useState<Record<string, ConfirmedPick>>({});
  const [scores, setScores] = useState<Record<string, UserScores>>({});
  const [brackets, setBrackets] = useState<Record<string, UserBracket>>({});
  const [users, setUsers] = useState<Record<string, RoomUser>>({});
  const [allGuesses, setAllGuesses] = useState<Record<string, Record<string, string>>>({});

  const [guessCount, setGuessCount] = useState(0);
  const [showBearsMode, setShowBearsMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [chaosFlash, setChaosFlash] = useState<{ slot: number; playerName: string } | null>(null);
  const [revealedPicks, setRevealedPicks] = useState<Set<number>>(new Set());
  const [, setLastRevealedPick] = useState<number>(0);
  const [personas, setPersonas] = useState<Record<string, PersonaType>>({});
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<{
    users: UserRecapStats[];
    room: RoomRecapStats;
    entries: LeaderboardEntry[];
  } | null>(null);
  const processedPicks = useRef<Set<number>>(new Set());
  const bearsDoublePicks = useRef<Set<number>>(new Set());

  // Redirect if no session
  useEffect(() => {
    if (!session || session.roomCode !== roomCode) {
      navigate("/");
    }
  }, [session, roomCode, navigate]);

  // Subscribe to Firebase data
  useEffect(() => {
    if (!roomCode) return;

    const unsubs = [
      onLiveState(roomCode, setLiveStateLocal),
      onResults(roomCode, setResults),
      onScores(roomCode, setScores),
      onBrackets(roomCode, setBrackets),
      onUsers(roomCode, setUsers),
    ];

    return () => unsubs.forEach((u) => u());
  }, [roomCode]);

  // Initialize live state if commissioner and no live state exists
  useEffect(() => {
    if (!roomCode || !session?.isCommissioner || liveState) return;

    setLiveState(roomCode, {
      currentPick: 1,
      windowOpen: false,
      windowOpenedAt: null,
      teamOnClock: DRAFT_ORDER[0]?.abbrev || "??",
      tradeMode: false,
      bearsDoubleActive: false,
    });
    updateRoomStatus(roomCode, "live");
  }, [roomCode, session?.isCommissioner, liveState]);

  // Safety reset: if trubiskyActive stays true for >10s, reset it
  useEffect(() => {
    if (!roomCode || !liveState?.trubiskyActive) return;
    const t = setTimeout(() => {
      updateLiveState(roomCode, { trubiskyActive: false });
    }, 10000);
    return () => clearTimeout(t);
  }, [roomCode, liveState?.trubiskyActive]);

  // Track guess count when window is open
  useEffect(() => {
    if (!roomCode || !liveState?.windowOpen) return;
    const interval = setInterval(async () => {
      const count = await getGuessCount(roomCode, liveState.currentPick);
      setGuessCount(count);
    }, 2000);
    return () => clearInterval(interval);
  }, [roomCode, liveState?.windowOpen, liveState?.currentPick]);

  // Detect new confirmed picks for animations + scoring
  const confirmedPicks = useMemo(() => {
    return Object.values(results).sort((a, b) => a.pick - b.pick);
  }, [results]);

  // Watch for new picks to trigger Bears mode, confetti, and scoring
  useEffect(() => {
    if (!roomCode || !session) return;
    if (confirmedPicks.length === 0) return;

    const latest = confirmedPicks[confirmedPicks.length - 1];
    if (processedPicks.current.has(latest.pick)) return;
    processedPicks.current.add(latest.pick);

    // Reactions unlock after reveal pause
    setTimeout(() => {
      setRevealedPicks((prev) => new Set([...prev, latest.pick]));
    }, REVEAL_PAUSE_MS);
    setLastRevealedPick(latest.pick);

    // Chaos flash (only for non-chalk picks)
    const chaos = calcChaosScore(latest.pick, latest.playerName);
    if (chaos.score > 30) {
      setChaosFlash({ slot: latest.pick, playerName: latest.playerName });
    }

    // Track bears double picks
    if (liveState?.bearsDoubleActive) {
      bearsDoublePicks.current.add(latest.pick);
    }

    // Bears mode?
    if (latest.isBearsPick) {
      setShowBearsMode(true);
    }

    // Check if current user guessed correctly for confetti
    const pickGuessKey = `pick${latest.pick}`;
    {
      const unsub = onGuesses(roomCode, latest.pick, (guesses) => {
        setAllGuesses((prev) => ({ ...prev, [pickGuessKey]: guesses }));

        if (guesses[session.name] === latest.playerName) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5500);
        }

        // Recalculate scores for all users
        const allUsers = Object.values(users);
        allUsers.forEach((user) => {
          const bracket = calcBracketScore(
            brackets[user.name] || null,
            confirmedPicks
          );
          const live = calcLiveScore(
            user.name,
            confirmedPicks,
            { ...allGuesses, [pickGuessKey]: guesses },
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
    }
  }, [confirmedPicks, roomCode, session, users, brackets, allGuesses]);

  // List of officially picked player names
  const pickedPlayers = useMemo(
    () => confirmedPicks.map((p) => p.playerName),
    [confirmedPicks]
  );

  const totalUsers = Object.keys(users).length;
  const currentSlot = DRAFT_ORDER.find(
    (s) => s.pick === (liveState?.currentPick || 1)
  );

  // Compute personas + recap data when all 32 picks are in
  useEffect(() => {
    if (!roomCode || confirmedPicks.length < 32) return;

    async function compute() {
      const [guesses, reactions] = await Promise.all([
        getAllGuesses(roomCode!),
        getAllReactions(roomCode!),
      ]);

      // Personas
      const personaResult = assignPersonas(confirmedPicks, guesses, brackets, scores, reactions);
      setPersonas(personaResult);

      // Recap data
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
        calcUserRecap(
          entry.name,
          brackets[entry.name] || null,
          confirmedPicks,
          guesses,
          scores[entry.name],
          i + 1
        )
      );

      const roomRecap = calcRoomRecap(confirmedPicks, guesses, scores);

      setRecapData({ users: userRecaps, room: roomRecap, entries: sortedEntries });
    }
    compute();
  }, [roomCode, confirmedPicks, brackets, scores]);

  const handleBearsModeComplete = useCallback(() => {
    setShowBearsMode(false);
  }, []);

  const handleWindowClose = useCallback(() => {
    // Window closed naturally — state is managed by Firebase
  }, []);

  if (!session || !roomCode) return null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Bears Mode overlay */}
      {showBearsMode && <BearsMode onComplete={handleBearsModeComplete} />}

      {/* Trubisky overlay */}
      {liveState?.trubiskyActive && (
        <TrubiskyOverlay onComplete={() => {/* Firebase auto-resets via commissioner timeout */}} />
      )}

      {/* Chaos flash */}
      {chaosFlash && (
        <ChaosFlash
          slot={chaosFlash.slot}
          playerName={chaosFlash.playerName}
          onComplete={() => setChaosFlash(null)}
        />
      )}

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-amber tracking-wide">
            WAR ROOM
          </h1>
          <p className="font-mono text-xs text-muted">
            {session.name} — Room {roomCode}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentSlot && getTeamLogo(currentSlot.abbrev) && (
            <img
              src={getTeamLogo(currentSlot.abbrev)}
              alt={currentSlot.abbrev}
              className="w-8 h-8 object-contain"
            />
          )}
          <div className="text-right">
            <p className="font-mono text-sm text-amber">
              PICK #{liveState?.currentPick || 1}
            </p>
            <p className="font-condensed text-xs text-muted uppercase">
              {currentSlot?.abbrev} on the clock
            </p>
            {liveState?.tradeMode && (
              <p className="font-condensed text-xs text-amber uppercase font-bold">
                TRADE PENDING
              </p>
            )}
          </div>
          {confirmedPicks.length >= 32 && recapData && (
            <button
              onClick={() => setShowRecap(true)}
              className="bg-amber text-bg font-condensed font-bold uppercase text-xs px-3 py-1.5 rounded hover:brightness-110 transition-all"
            >
              VIEW RECAP
            </button>
          )}
        </div>
      </header>

      {/* Recap overlay */}
      {showRecap && recapData && (
        <div className="fixed inset-0 z-[90] bg-bg/95 overflow-auto">
          <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-amber tracking-wide">
              DRAFT RECAP
            </h2>
            <button
              onClick={() => setShowRecap(false)}
              className="text-muted hover:text-white font-mono text-sm"
            >
              CLOSE
            </button>
          </div>
          <div className="p-4 flex flex-wrap gap-4 justify-center">
            {/* Room summary first */}
            <RoomRecap stats={recapData.room} entries={recapData.entries} roomCode={roomCode} />
            {/* Per-user cards */}
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

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main content — pick feed */}
        <div className="flex-1 p-4 pb-16 lg:pb-4 overflow-auto">
          {confirmedPicks.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <p className="font-display text-4xl text-amber mb-2">
                DRAFT DAY
              </p>
              <p className="font-condensed text-muted text-lg">
                Waiting for commissioner to open the first window...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Round divider if past pick 32 */}
              {confirmedPicks.length >= 32 && (
                <div className="text-center py-2">
                  <span className="font-display text-lg text-amber tracking-wider">
                    — END OF ROUND 1 —
                  </span>
                </div>
              )}

              {/* Picks in reverse order (newest first) */}
              {[...confirmedPicks].reverse().map((pick) => (
                <PickCard
                  key={pick.pick}
                  pick={pick}
                  roomCode={roomCode}
                  userName={session.name}
                  bracketHits={getBracketHitsForPick(pick, brackets)}
                  reactionsUnlocked={revealedPicks.has(pick.pick)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <Leaderboard scores={scores} roomCode={roomCode} totalPicks={confirmedPicks.length} personas={confirmedPicks.length >= 32 ? personas : undefined} />
      </div>

      {/* Pick window popup */}
      {liveState?.windowOpen && liveState.windowOpenedAt && (
        <PickWindow
          roomCode={roomCode}
          userName={session.name}
          pickNumber={liveState.currentPick}
          teamOnClock={`${currentSlot?.abbrev || "??"} — ${currentSlot?.team || ""}`}
          windowOpenedAt={liveState.windowOpenedAt}
          pickedPlayers={pickedPlayers}
          guessCount={guessCount}
          totalUsers={totalUsers}
          onClose={handleWindowClose}
          isCommissioner={session.isCommissioner}
          currentLiveScore={scores[session.name]?.liveScore || 0}
        />
      )}

      {/* Commissioner panel */}
      {session.isCommissioner && liveState && (
        <CommissionerPanel
          roomCode={roomCode}
          liveState={liveState}
          pickedPlayers={pickedPlayers}
        />
      )}
    </div>
  );
}
