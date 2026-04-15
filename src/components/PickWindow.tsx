import { useState, useEffect, useMemo } from "react";
import { PROSPECTS } from "../data/prospects";
import { GUESS_WINDOW_SECONDS, FLASH_WARNING_SECONDS } from "../data/scoring";
import { submitGuess } from "../lib/storage";
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
}: PickWindowProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GUESS_WINDOW_SECONDS);

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
        // Auto-submit whatever is selected, or empty
        if (!submitted) {
          if (selectedPlayer) {
            submitGuess(roomCode, pickNumber, userName, selectedPlayer);
          }
          setSubmitted(true);
        }
        onClose();
      }
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [windowOpenedAt, roomCode, pickNumber, userName, selectedPlayer, submitted, onClose]);

  async function handleSubmit() {
    if (!selectedPlayer || submitted) return;
    await submitGuess(roomCode, pickNumber, userName, selectedPlayer);
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
            <div className="max-h-48 overflow-auto bg-bg border border-border rounded mb-4">
              {filtered.length === 0 ? (
                <p className="text-center text-muted text-sm py-4 font-mono">
                  No matches
                </p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedPlayer(p.name);
                      setSearch(p.name);
                    }}
                    className={`w-full text-left px-3 py-1.5 font-mono text-sm hover:bg-surface-elevated transition-colors ${
                      selectedPlayer === p.name
                        ? "bg-amber/10 text-amber"
                        : "text-white"
                    }`}
                  >
                    <span className="text-muted">#{p.rank}</span> {p.name}{" "}
                    <span className="text-muted">
                      {p.position}, {p.college}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selectedPlayer}
              className="w-full bg-amber text-bg font-condensed font-bold uppercase tracking-wide py-3 rounded hover:brightness-110 disabled:opacity-30 transition-all"
            >
              SUBMIT GUESS
            </button>
          </>
        )}

        {/* Submission count */}
        <p className="text-center font-mono text-xs text-muted mt-3">
          {guessCount} of {totalUsers} submitted
        </p>
      </div>
    </div>
  );
}
