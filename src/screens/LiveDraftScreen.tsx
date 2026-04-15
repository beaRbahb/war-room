import { useState, useEffect, useCallback, useMemo } from "react";
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
  onGuesses,
} from "../lib/storage";
import { DRAFT_ORDER } from "../data/draftOrder";
import { calcBracketScore, getBracketHitsForPick, calcLiveScore } from "../lib/scoring";
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
  const [revealedPicks, setRevealedPicks] = useState<Set<number>>(new Set());
  const [, setLastRevealedPick] = useState<number>(0);

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
    if (revealedPicks.has(latest.pick)) return;

    // Mark as revealed
    setRevealedPicks((prev) => new Set([...prev, latest.pick]));
    setLastRevealedPick(latest.pick);

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
          setTimeout(() => setShowConfetti(false), 3000);
        }

        // Recalculate scores for all users
        const allUsers = Object.values(users);
        allUsers.forEach((user) => {
          const bracketScore = calcBracketScore(
            brackets[user.name] || null,
            confirmedPicks
          );
          const liveScore = calcLiveScore(
            user.name,
            confirmedPicks,
            { ...allGuesses, [pickGuessKey]: guesses },
            new Set() // TODO: track bears double picks
          );
          updateScores(roomCode, user.name, { bracketScore, liveScore });
        });

        unsub();
      });
    }
  }, [confirmedPicks, roomCode, session, revealedPicks, users, brackets, allGuesses]);

  // List of officially picked player names
  const pickedPlayers = useMemo(
    () => confirmedPicks.map((p) => p.playerName),
    [confirmedPicks]
  );

  const totalUsers = Object.keys(users).length;
  const currentSlot = DRAFT_ORDER.find(
    (s) => s.pick === (liveState?.currentPick || 1)
  );

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
      </header>

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
        <Leaderboard scores={scores} roomCode={roomCode} />
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
