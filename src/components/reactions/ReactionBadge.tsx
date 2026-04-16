import { useEffect, useState } from "react";
import { onReactions } from "../../lib/storage";
import type { UserReaction } from "../../types";
import {
  POLES_LABELS,
  POLES_COLORS,
  GRADE_LABELS,
  GRADE_COLORS,
} from "../../types";

interface ReactionBadgeProps {
  roomCode: string;
  pickNum: number;
  userName: string;
}

/** Read-only badge showing the user's locked-in reaction for a pick. */
export default function ReactionBadge({ roomCode, pickNum, userName }: ReactionBadgeProps) {
  const [reactions, setReactions] = useState<Record<string, UserReaction>>({});

  useEffect(() => {
    return onReactions(roomCode, pickNum, setReactions);
  }, [roomCode, pickNum]);

  const mine = reactions[userName];
  if (!mine) return <span className="font-mono text-[10px] text-muted">No reaction</span>;

  const r = mine.reaction;
  const label = (POLES_LABELS as Record<string, string>)[r] ?? (GRADE_LABELS as Record<string, string>)[r] ?? r;
  const colorClass = (POLES_COLORS as Record<string, string>)[r] ?? (GRADE_COLORS as Record<string, string>)[r] ?? "text-muted bg-surface-elevated border-border";

  return (
    <span className={`inline-flex font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded border ${colorClass}`}>
      {label}
    </span>
  );
}
