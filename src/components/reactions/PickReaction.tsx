import { useEffect, useState } from "react";
import { submitReaction, onReactions } from "../../lib/storage";
import type { UserReaction, ReactionType } from "../../types";
import {
  GRADE_LABELS,
  GRADE_COLORS,
  type GradeType,
} from "../../types";

interface PickReactionProps {
  roomCode: string;
  pickNum: number;
  userName: string;
}

const GRADE_OPTIONS: GradeType[] = ["a-plus", "a", "b", "c", "d", "f"];

/** Reaction buttons for a confirmed pick — A-F letter grades for all picks. */
export default function PickReaction({ roomCode, pickNum, userName }: PickReactionProps) {
  const [reactions, setReactions] = useState<Record<string, UserReaction>>({});

  useEffect(() => {
    return onReactions(roomCode, pickNum, setReactions);
  }, [roomCode, pickNum]);

  const myReaction = reactions[userName]?.reaction ?? null;

  async function handleReact(reaction: ReactionType) {
    await submitReaction(roomCode, pickNum, userName, {
      reaction,
      bearsTierCompId: null,
    });
  }

  // Count reactions for summary
  const counts: Record<string, number> = {};
  for (const r of Object.values(reactions)) {
    counts[r.reaction] = (counts[r.reaction] ?? 0) + 1;
  }

  return (
    <div className="flex items-center gap-1">
      {GRADE_OPTIONS.map((opt) => {
        const isSelected = myReaction === opt;
        const count = counts[opt] ?? 0;
        return (
          <button
            key={opt}
            onClick={() => handleReact(opt)}
            className={`font-condensed text-xs font-bold uppercase px-2 py-1 rounded border transition-all ${
              isSelected
                ? GRADE_COLORS[opt] + " border-current"
                : "text-muted bg-surface border-border hover:border-border-bright"
            }`}
          >
            {GRADE_LABELS[opt]}
            {count > 0 && (
              <span className="font-mono text-[10px] ml-1 opacity-70">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
