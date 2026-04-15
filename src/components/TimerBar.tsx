import { useState, useEffect } from "react";
import { GUESS_WINDOW_SECONDS, FLASH_WARNING_SECONDS } from "../data/scoring";
import { getTeamLogo } from "../data/teams";
import type { DraftSlot } from "../data/draftOrder";
import type { LiveState } from "../types";

interface TimerBarProps {
  liveState: LiveState;
  currentSlot: DraftSlot | undefined;
  /** Current user's guess for this pick (selected but maybe not submitted) */
  userGuess: string | null;
  /** Whether the guess has been submitted/locked in */
  submitted: boolean;
  /** Callback to submit the current guess */
  onSubmit: () => void;
  guessCount: number;
  totalUsers: number;
}

export default function TimerBar({
  liveState,
  currentSlot,
  userGuess,
  submitted,
  onSubmit,
  guessCount,
  totalUsers,
}: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(GUESS_WINDOW_SECONDS);

  // Countdown timer
  useEffect(() => {
    if (!liveState.windowOpen || !liveState.windowOpenedAt) {
      setTimeLeft(GUESS_WINDOW_SECONDS);
      return;
    }

    const openedMs = new Date(liveState.windowOpenedAt).getTime();

    function tick() {
      const elapsed = (Date.now() - openedMs) / 1000;
      const remaining = Math.max(0, GUESS_WINDOW_SECONDS - elapsed);
      setTimeLeft(Math.ceil(remaining));
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [liveState.windowOpen, liveState.windowOpenedAt]);

  const isFlashing =
    liveState.windowOpen && timeLeft <= FLASH_WARNING_SECONDS;

  // Trade mode
  if (liveState.tradeMode) {
    return (
      <div className="sticky top-[57px] z-[9] bg-surface border-b border-amber px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentSlot && (
            <img
              src={getTeamLogo(currentSlot.abbrev)}
              alt={currentSlot.abbrev}
              className="w-8 h-8 object-contain"
            />
          )}
          <div>
            <span className="font-mono text-sm text-amber">
              PICK #{liveState.currentPick}
            </span>
            <span className="font-condensed text-xs text-muted ml-2">
              {currentSlot?.abbrev}
            </span>
          </div>
        </div>
        <span className="font-condensed text-sm text-amber font-bold uppercase animate-pulse">
          TRADE PENDING
        </span>
      </div>
    );
  }

  // Window open — show countdown
  if (liveState.windowOpen) {
    return (
      <div
        className={`sticky top-[57px] z-[9] border-b px-4 py-2.5 flex items-center justify-between ${
          isFlashing
            ? "bg-red/10 border-red animate-flash-red"
            : "bg-surface border-amber"
        }`}
      >
        <div className="flex items-center gap-3">
          {currentSlot && (
            <img
              src={getTeamLogo(currentSlot.abbrev)}
              alt={currentSlot.abbrev}
              className="w-8 h-8 object-contain"
            />
          )}
          <div>
            <span className="font-mono text-sm text-amber">
              PICK #{liveState.currentPick}
            </span>
            <span className="font-condensed text-xs text-muted ml-2">
              {currentSlot?.abbrev} on the clock
            </span>
          </div>
        </div>

        {/* Countdown */}
        <span
          className={`font-mono text-2xl font-bold ${
            isFlashing ? "text-red" : "text-amber"
          }`}
        >
          0:{timeLeft.toString().padStart(2, "0")}
        </span>

        {/* Status + Submit */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            {submitted ? (
              <span className="font-condensed text-sm text-green font-bold uppercase">
                LOCKED IN
              </span>
            ) : userGuess ? (
              <span className="font-condensed text-sm text-amber font-bold uppercase">
                {userGuess}
              </span>
            ) : (
              <span className="font-condensed text-sm text-muted uppercase animate-pulse">
                Select your pick
              </span>
            )}
            <p className="font-mono text-xs text-muted">
              {guessCount}/{totalUsers} submitted
            </p>
          </div>
          {userGuess && !submitted && (
            <button
              onClick={onSubmit}
              className="bg-green text-bg font-condensed font-bold uppercase text-sm px-4 py-2 rounded hover:brightness-110 transition-all animate-pulse"
            >
              SUBMIT
            </button>
          )}
        </div>
      </div>
    );
  }

  // Window closed — waiting state
  return (
    <div className="sticky top-[57px] z-[9] bg-surface border-b border-border px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {currentSlot && (
          <img
            src={getTeamLogo(currentSlot.abbrev)}
            alt={currentSlot.abbrev}
            className="w-8 h-8 object-contain"
          />
        )}
        <div>
          <span className="font-mono text-sm text-amber">
            PICK #{liveState.currentPick}
          </span>
          <span className="font-condensed text-xs text-muted ml-2">
            {currentSlot?.abbrev} on the clock
          </span>
        </div>
      </div>
      <span className="font-condensed text-sm text-muted uppercase">
        Waiting for commissioner...
      </span>
    </div>
  );
}
