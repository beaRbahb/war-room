import { calcChaosScore } from "../../lib/chaos";

interface ChaosMeterProps {
  slot: number;
  playerName: string;
}

const LEVEL_STYLES = {
  CHALK: "bg-muted/20 text-muted",
  MILD: "bg-amber/10 text-amber",
  SPICY: "bg-bears-orange/20 text-bears-orange animate-pulse",
  CHAOS: "bg-red/20 text-red animate-pulse",
} as const;

/** Inline chaos badge showing how surprising a pick was. */
export default function ChaosMeter({ slot, playerName }: ChaosMeterProps) {
  const { score, level } = calcChaosScore(slot, playerName);

  return (
    <span
      className={`inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded ${LEVEL_STYLES[level]}`}
    >
      <span>{level}</span>
      <span className="font-mono">{score}</span>
    </span>
  );
}
