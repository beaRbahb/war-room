import { useEffect, useRef, useState } from "react";
import { VOTING_TIMEOUT_MS } from "../../data/scoring";
import type { RoastAnswer } from "../../types";

interface RoastVotingProps {
  answers: Record<string, RoastAnswer>;
  userName: string;
  onVote: (answererName: string) => void;
  onSkip: () => void;
}

export default function RoastVoting({
  answers,
  userName,
  onVote,
  onSkip,
}: RoastVotingProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(VOTING_TIMEOUT_MS / 1000),
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  // Sorted alphabetically by author name
  const sortedEntries = Object.entries(answers).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Countdown timer → auto-skip on expiry
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!firedRef.current) {
            firedRef.current = true;
            onSkipRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleVote() {
    if (!selected || firedRef.current) return;
    firedRef.current = true;
    onVote(selected);
  }

  function handleSkip() {
    if (firedRef.current) return;
    firedRef.current = true;
    onSkip();
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-sm px-4">
      {/* Header */}
      <p className="font-display text-2xl text-amber tracking-wide mb-1">
        VOTE FOR THE BEST
      </p>
      <p className="font-condensed text-sm text-muted uppercase tracking-wide mb-5">
        {secondsLeft}s remaining
      </p>

      {/* Answer cards */}
      <div className="w-full space-y-3 mb-6">
        {sortedEntries.map(([author, answer]) => {
          const isSelf = author === userName;
          const isSelected = selected === author;

          return (
            <button
              key={author}
              onClick={() => !isSelf && setSelected(author)}
              disabled={isSelf}
              className={`w-full text-left px-4 py-3.5 rounded-lg border-2 transition-all ${
                isSelf
                  ? "opacity-40 cursor-not-allowed border-border bg-surface-elevated"
                  : isSelected
                    ? "border-amber bg-amber/10 scale-[1.02]"
                    : "border-border-bright bg-surface-elevated hover:border-white/50 active:scale-[0.98]"
              }`}
            >
              <p
                className={`font-mono text-sm leading-relaxed ${
                  isSelf ? "text-muted" : "text-white"
                }`}
              >
                "{answer.text}"
              </p>
              <p
                className={`font-condensed text-xs uppercase mt-1.5 ${
                  isSelf
                    ? "text-muted"
                    : isSelected
                      ? "text-amber"
                      : "text-muted"
                }`}
              >
                — {isSelf ? "You" : author}
              </p>
            </button>
          );
        })}
      </div>

      {/* Vote / Skip buttons */}
      <div className="w-full flex gap-3">
        <button
          onClick={handleSkip}
          className="flex-1 font-condensed text-base font-bold uppercase tracking-wide py-3 rounded-lg border border-border text-muted hover:text-white hover:border-white/50 transition-all"
        >
          SKIP
        </button>
        <button
          onClick={handleVote}
          disabled={!selected}
          className={`flex-1 font-condensed text-base font-bold uppercase tracking-wide py-3 rounded-lg transition-all ${
            selected
              ? "bg-amber text-bg cursor-pointer hover:brightness-110"
              : "bg-border text-muted cursor-not-allowed opacity-50"
          }`}
        >
          VOTE
        </button>
      </div>
    </div>
  );
}
