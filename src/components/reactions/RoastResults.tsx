import { useEffect, useRef, useState } from "react";
import { SPOTLIGHT_DURATION_MS } from "../../data/scoring";
import type { RoastResult } from "../../types";

interface RoastResultsProps {
  /** Ranked results in display order: 3rd → 2nd → 1st */
  ranked: RoastResult[];
  onComplete: () => void;
}

/** Medal labels for reveal positions */
const PLACE_LABELS = ["1st", "2nd", "3rd"] as const;

export default function RoastResults({
  ranked,
  onComplete,
}: RoastResultsProps) {
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  // Auto-advance spotlight
  useEffect(() => {
    if (spotlightIndex >= ranked.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      setSpotlightIndex((prev) => prev + 1);
    }, SPOTLIGHT_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [spotlightIndex, ranked.length, onComplete]);

  if (spotlightIndex >= ranked.length) return null;

  const current = ranked[spotlightIndex];
  // ranked is in reveal order (3rd→2nd→1st), so the actual place is total - spotlightIndex
  const placeIndex = ranked.length - 1 - spotlightIndex;
  const isWinner = placeIndex === 0;

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-sm px-4">
      {/* Place label */}
      <p
        className={`font-display text-5xl tracking-wider mb-2 ${
          isWinner ? "text-amber" : "text-muted"
        }`}
      >
        {PLACE_LABELS[placeIndex] ?? `${placeIndex + 1}th`}
      </p>

      {/* Answer card */}
      <div
        className={`w-full px-5 py-5 rounded-xl border-2 mb-4 transition-all animate-fade-in-up ${
          isWinner
            ? "border-amber bg-amber/10 shadow-[0_0_24px_rgba(245,158,11,0.15)]"
            : "border-border-bright bg-surface-elevated"
        }`}
      >
        <p
          className={`font-mono text-base leading-relaxed text-center ${
            isWinner ? "text-amber" : "text-white"
          }`}
        >
          "{current.text}"
        </p>
        <p
          className={`font-condensed text-sm uppercase text-center mt-3 ${
            isWinner ? "text-amber font-bold" : "text-muted"
          }`}
        >
          — {current.answererName}
        </p>
        <p className="font-mono text-xs text-muted text-center mt-1">
          {current.voteCount} vote{current.voteCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {ranked.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i <= spotlightIndex
                ? i === spotlightIndex
                  ? "bg-amber scale-125"
                  : "bg-amber/40"
                : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={() => {
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete();
          }
        }}
        className="font-condensed text-sm text-muted uppercase tracking-wide hover:text-white transition-colors"
      >
        SKIP
      </button>
    </div>
  );
}
