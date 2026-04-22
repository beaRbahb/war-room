import { useRef, useEffect } from "react";
import { getTeamLogo } from "../../data/teams";
import { usePickTimer } from "../../hooks/usePickTimer";
import RoomPulse from "./RoomPulse";
import QuiplashPanel from "../reactions/QuiplashPanel";
import type { DraftSlot } from "../../data/draftOrder";
import type { LiveState } from "../../types";
import type { QuiplashPhase } from "../../hooks/useQuiplash";
import type { RoastAnswer } from "../../types";

interface ActivePickCardProps {
  slot: DraftSlot;
  liveState: LiveState;
  userGuess: string | null;
  submitted: boolean;
  guessCount: number;
  totalUsers: number;
  onClick: () => void;
  onSubmit: () => void;
  /** Room Pulse data (null when no guesses yet) */
  roomPulseData: { guesses: Record<string, string>; pickNumber: number } | null;
  userName: string;
  /** Quiplash props — null when not in finalize or no prompt */
  quiplash: {
    phase: QuiplashPhase;
    prompt: string;
    answers: Record<string, RoastAnswer>;
    votes: Record<string, string>;
    draftText: string;
    setDraftText: (text: string) => void;
    answerCount: number;
    totalUsers: number;
    onSubmitAnswer: () => Promise<void>;
    onSubmitVote: (answererName: string) => Promise<void>;
  } | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ActivePickCard({
  slot,
  liveState,
  userGuess,
  submitted,
  guessCount,
  totalUsers,
  onClick,
  onSubmit,
  roomPulseData,
  userName,
  quiplash,
  scrollContainerRef,
}: ActivePickCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { timeLeft, isWarning } = usePickTimer(
    liveState.windowOpenedAt,
    liveState.windowOpen,
  );

  const windowFinalizing = !liveState.windowOpen && !!liveState.windowOpenedAt;
  const logo = getTeamLogo(slot.abbrev);

  // Auto-scroll to top of scroll area when pick changes
  useEffect(() => {
    const card = cardRef.current;
    const container = scrollContainerRef.current;
    if (!card || !container) return;

    // Small delay to let DOM settle after pick advance
    const timer = setTimeout(() => {
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const delta = cardRect.top - containerRect.top - 8;
      if (Math.abs(delta) > 4) {
        container.scrollTo({
          top: container.scrollTop + delta,
          behavior: "smooth",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [liveState.currentPick, scrollContainerRef]);

  // ── Trade mode ──
  if (liveState.tradeMode) {
    return (
      <div ref={cardRef} className="my-1.5 border-[1.5px] border-amber rounded-[10px] bg-surface overflow-hidden">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {logo && <img src={logo} alt={slot.abbrev} className="w-8 h-8 object-contain shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg text-amber leading-none tracking-wide">PICK #{slot.pick}</div>
            <div className="font-condensed text-sm text-white uppercase">{slot.team}</div>
          </div>
          <span className="font-condensed text-sm text-amber font-bold uppercase animate-pulse shrink-0">
            TRADE PENDING
          </span>
        </div>
      </div>
    );
  }

  // ── Card border color ──
  const borderColor = isWarning
    ? "border-red animate-flash-red"
    : "border-amber";

  return (
    <div ref={cardRef}>
      <div className={`my-1.5 border-[1.5px] ${borderColor} rounded-[10px] bg-surface overflow-hidden`}>
        {/* Pick bar */}
        <button
          onClick={liveState.windowOpen && !submitted ? onClick : undefined}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
        >
          {logo && <img src={logo} alt={slot.abbrev} className="w-8 h-8 object-contain shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg text-amber leading-none tracking-wide">PICK #{slot.pick}</div>
            <div className="font-condensed text-sm text-white uppercase">{slot.team}</div>
          </div>
          <div className="text-right shrink-0">
            {liveState.windowOpen ? (
              <>
                <div className={`font-mono text-[22px] font-bold leading-none ${isWarning ? "text-red" : "text-amber"}`}>
                  0:{timeLeft.toString().padStart(2, "0")}
                </div>
                <span className="font-mono text-xs text-muted block mt-0.5">
                  {guessCount}/{totalUsers} in
                </span>
              </>
            ) : windowFinalizing ? (
              <span className="font-condensed text-xs text-muted uppercase">Finalizing...</span>
            ) : (
              <span className="font-condensed text-xs text-muted uppercase">
                Pick #{slot.pick} coming up
              </span>
            )}
          </div>
        </button>

        {/* Content area — depends on state */}
        {liveState.windowOpen && !userGuess && !submitted && (
          <div className="px-3 pb-3 text-right">
            <span className="font-condensed text-base text-muted uppercase animate-active-pulse">
              TAP TO PICK ›
            </span>
          </div>
        )}

        {liveState.windowOpen && userGuess && !submitted && (
          <div className="px-3 pb-3 text-right">
            <span className="font-condensed text-sm font-bold text-amber uppercase">
              {userGuess}
            </span>
          </div>
        )}

        {submitted && (
          <div className="flex items-baseline justify-between px-3 pb-2.5">
            <span className="font-condensed text-xs font-bold text-muted uppercase tracking-wider">
              SUBMITTED
            </span>
            <span className="font-condensed text-sm font-bold text-amber uppercase">
              {userGuess}
            </span>
          </div>
        )}

        {/* Finalize: inline Room Pulse + GM Roast */}
        {windowFinalizing && (
          <>
            {roomPulseData && (
              <>
                <div className="h-px bg-border mx-3" />
                <RoomPulse
                  pickGuesses={roomPulseData.guesses}
                  userName={userName}
                  pickNumber={roomPulseData.pickNumber}
                  totalUsers={totalUsers}
                  compact
                />
              </>
            )}
            {quiplash && quiplash.phase && (
              <>
                <div className="h-px bg-border mx-3" />
                <QuiplashPanel
                  phase={quiplash.phase}
                  prompt={quiplash.prompt}
                  answers={quiplash.answers}
                  votes={quiplash.votes}
                  draftText={quiplash.draftText}
                  setDraftText={quiplash.setDraftText}
                  answerCount={quiplash.answerCount}
                  totalUsers={quiplash.totalUsers}
                  userName={userName}
                  onSubmitAnswer={quiplash.onSubmitAnswer}
                  onSubmitVote={quiplash.onSubmitVote}
                  compact
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Submit button — OUTSIDE card, only when guess selected but not submitted */}
      {liveState.windowOpen && userGuess && !submitted && (
        <div className="mt-1">
          <button
            onClick={onSubmit}
            className="w-full h-11 bg-green text-bg font-condensed font-bold uppercase text-[15px] tracking-wide border-none rounded-lg hover:brightness-110 transition-all"
          >
            SUBMIT: {userGuess.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
