import { useEffect, useState } from "react";
import { calcChaosScore, type ChaosLevel } from "../lib/chaos";

interface ChaosFlashProps {
  slot: number;
  playerName: string;
  teamAbbrev?: string;
  priorPicks?: { position: string }[];
  onComplete: () => void;
}

const BG_COLORS: Record<ChaosLevel, string> = {
  CHALK: "bg-muted/40",
  MILD: "bg-amber/30",
  SPICY: "bg-bears-orange/40",
  CHAOS: "bg-red/50",
};

const TEXT_COLORS: Record<ChaosLevel, string> = {
  CHALK: "text-muted",
  MILD: "text-amber",
  SPICY: "text-bears-orange",
  CHAOS: "text-red",
};

const BORDER_COLORS: Record<ChaosLevel, string> = {
  CHALK: "border-muted/30",
  MILD: "border-amber/30",
  SPICY: "border-bears-orange/30",
  CHAOS: "border-red/30",
};

const DURATIONS: Record<ChaosLevel, number> = {
  CHALK: 1500,
  MILD: 1500,
  SPICY: 2500,
  CHAOS: 2500,
};

/**
 * Brief full-screen chaos score flash on pick confirmation.
 * Shows score, level, and context tags explaining why.
 * Pointer-events-none so it doesn't block interaction.
 */
export default function ChaosFlash({ slot, playerName, teamAbbrev, priorPicks, onComplete }: ChaosFlashProps) {
  const [visible, setVisible] = useState(true);
  const { score, level, tags } = calcChaosScore(slot, playerName, teamAbbrev, priorPicks);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, DURATIONS[level]);

    return () => clearTimeout(timer);
  }, [level, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center pointer-events-none ${BG_COLORS[level]}`}
    >
      <div className="animate-fade-in-up text-center">
        <p className={`font-mono text-7xl sm:text-9xl font-bold ${TEXT_COLORS[level]}`}>
          {score}
        </p>
        <p className={`font-display text-3xl sm:text-5xl tracking-wider ${TEXT_COLORS[level]}`}>
          {level}
        </p>
        {tags.length > 0 && (
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`font-condensed text-sm sm:text-lg font-bold uppercase px-3 py-1 rounded border ${TEXT_COLORS[level]} ${BORDER_COLORS[level]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
