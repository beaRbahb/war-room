import { useState, useEffect, useMemo } from "react";
import { PROSPECTS } from "../data/prospects";
import { GUESS_WINDOW_SECONDS, FLASH_WARNING_SECONDS } from "../data/scoring";
import { submitGuess, submitWager } from "../lib/storage";
import { getTeamLogo } from "../data/teams";
import { getHeadshot } from "../lib/headshots";
import { getPickProb } from "../data/prospectOdds";
import { TEAM_NEEDS } from "../data/teamNeeds";
import RoomPulse from "./RoomPulse";
import WagerInput from "./WagerInput";
interface PickWindowProps {
  roomCode: string;
  userName: string;
  pickNumber: number;
  teamOnClock: string;
  windowOpenedAt: string;
  /** Players already officially picked — removed from dropdown */
  pickedPlayers: string[];
  /** Count of submissions so far */
  guessCount: number;
  totalUsers: number;
  onClose: () => void;
  isCommissioner?: boolean;
  /** Current user's live score (for wager max) */
  currentLiveScore: number;
}

export default function PickWindow({
  roomCode,
  userName,
  pickNumber,
  teamOnClock,
  windowOpenedAt,
  pickedPlayers,
  guessCount,
  totalUsers,
  onClose,
  isCommissioner,
  currentLiveScore,
}: PickWindowProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GUESS_WINDOW_SECONDS);
  const [wagerAmount, setWagerAmount] = useState(0);

  const teamAbbrev = teamOnClock.split(" — ")[0]?.trim() || "";
  const teamNeeds = TEAM_NEEDS[teamAbbrev] || [];

  function getReachValue(rank: number): { label: string; color: string } {
    const diff = rank - pickNumber;
    if (diff > 15) return { label: "BIG REACH", color: "text-red" };
    if (diff > 8) return { label: "REACH", color: "text-red" };
    if (diff > 3) return { label: "SLIGHT REACH", color: "text-red/70" };
    if (diff < -15) return { label: "HUGE STEAL", color: "text-green" };
    if (diff < -8) return { label: "STEAL", color: "text-green" };
    if (diff < -3) return { label: "VALUE", color: "text-green/70" };
    return { label: "BPA", color: "text-amber" };
  }

  // Available players (not yet officially picked)
  const available = useMemo(
    () => PROSPECTS.filter((p) => !pickedPlayers.includes(p.name)),
    [pickedPlayers]
  );

  // Filtered by search
  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.college.toLowerCase().includes(q)
    );
  }, [available, search]);

  // Countdown timer
  useEffect(() => {
    const openedMs = new Date(windowOpenedAt).getTime();

    function tick() {
      const elapsed = (Date.now() - openedMs) / 1000;
      const remaining = Math.max(0, GUESS_WINDOW_SECONDS - elapsed);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        // Auto-submit whatever is selected + wager
        if (!submitted) {
          if (selectedPlayer) {
            submitGuess(roomCode, pickNumber, userName, selectedPlayer);
            if (wagerAmount > 0) {
              submitWager(roomCode, pickNumber, userName, {
                amount: wagerAmount,
                playerName: selectedPlayer,
              });
            }
          }
          setSubmitted(true);
        }
        onClose();
      }
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [windowOpenedAt, roomCode, pickNumber, userName, selectedPlayer, submitted, onClose, wagerAmount]);

  async function handleSubmit() {
    if (!selectedPlayer || submitted) return;
    await submitGuess(roomCode, pickNumber, userName, selectedPlayer);
    if (wagerAmount > 0) {
      await submitWager(roomCode, pickNumber, userName, {
        amount: wagerAmount,
        playerName: selectedPlayer,
      });
    }
    setSubmitted(true);
  }

  const isFlashing = timeLeft <= FLASH_WARNING_SECONDS && !submitted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className={`w-full max-w-md bg-surface border-2 rounded-xl p-6 ${
          isFlashing ? "animate-flash-red border-red" : "animate-pulse-border border-amber"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <p className="font-condensed text-sm text-muted uppercase tracking-wide">
            On The Clock
          </p>
          {(() => {
            const abbrev = teamOnClock.split(" — ")[0]?.trim();
            const logo = abbrev ? getTeamLogo(abbrev) : undefined;
            return logo ? (
              <img src={logo} alt={abbrev} className="w-12 h-12 object-contain mx-auto mb-1" />
            ) : null;
          })()}
          <p className="font-display text-4xl text-amber tracking-wide">
            PICK #{pickNumber}
          </p>
          <p className="font-condensed text-lg text-white uppercase font-bold">
            {teamOnClock}
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center mb-4">
          <span
            className={`font-mono text-5xl font-bold ${
              isFlashing ? "text-red" : "text-amber"
            }`}
          >
            0:{timeLeft.toString().padStart(2, "0")}
          </span>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <p className="font-display text-2xl text-green">LOCKED IN</p>
            <p className="font-condensed text-muted mt-1">
              {selectedPlayer || "No pick"}
            </p>
            {isCommissioner && (
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-surface-elevated border border-amber text-amber font-condensed font-bold uppercase tracking-wide text-sm rounded hover:bg-amber/10 transition-colors"
              >
                BACK TO PANEL
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full bg-bg border border-border rounded px-3 py-2 text-white font-mono text-sm focus:border-amber focus:outline-none mb-2"
              autoFocus
            />

            {/* Player list */}
            <div className="max-h-64 overflow-auto bg-bg border border-border rounded mb-4">
              {filtered.length === 0 ? (
                <p className="text-center text-muted text-sm py-4 font-mono">
                  No matches
                </p>
              ) : (
                filtered.map((p) => {
                  const headshot = getHeadshot(p.name);
                  const prob = getPickProb(pickNumber, p.name);
                  const rv = getReachValue(p.rank);
                  const isNeedMatch = teamNeeds.includes(p.position);

                  return (
                    <button
                      key={p.name}
                      onClick={() => {
                        setSelectedPlayer(p.name);
                        setSearch(p.name);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-surface-elevated transition-colors flex items-center gap-2 ${
                        selectedPlayer === p.name
                          ? "bg-amber/10"
                          : ""
                      }`}
                    >
                      {/* Headshot */}
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-elevated flex-shrink-0">
                        {headshot ? (
                          <img src={headshot} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted font-mono text-xs">
                            {p.position}
                          </div>
                        )}
                      </div>

                      {/* Name + position */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-mono text-sm truncate ${
                          selectedPlayer === p.name ? "text-amber" : "text-white"
                        }`}>
                          <span className="text-muted">#{p.rank}</span> {p.name}
                        </div>
                        <div className={`font-condensed text-xs ${
                          isNeedMatch ? "text-amber" : "text-muted"
                        }`}>
                          {p.position} · {p.college}
                        </div>
                      </div>

                      {/* Prob + reach/value */}
                      <div className="flex-shrink-0 text-right">
                        {prob > 0 && (
                          <div className={`font-mono text-xs font-bold ${
                            prob >= 20 ? "text-green" : prob >= 5 ? "text-amber" : "text-muted"
                          }`}>
                            {prob}%
                          </div>
                        )}
                        <div className={`font-condensed text-xs font-bold uppercase ${rv.color}`}>
                          {rv.label}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Wager */}
            <WagerInput
              roomCode={roomCode}
              pickNumber={pickNumber}
              currentLiveScore={currentLiveScore}
              onWagerChange={setWagerAmount}
              submitted={submitted}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selectedPlayer}
              className="w-full bg-amber text-bg font-condensed font-bold uppercase tracking-wide py-3 rounded hover:brightness-110 disabled:opacity-30 transition-all"
            >
              {wagerAmount > 0 ? `SUBMIT GUESS + ${wagerAmount} PT WAGER` : "SUBMIT GUESS"}
            </button>
          </>
        )}

        {/* Submission count */}
        <p className="text-center font-mono text-xs text-muted mt-3">
          {guessCount} of {totalUsers} submitted
        </p>

        {/* Room Pulse — position aggregate */}
        <RoomPulse roomCode={roomCode} pickNumber={pickNumber} />
      </div>
    </div>
  );
}
