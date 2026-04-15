import { useEffect, useState } from "react";
import { submitReaction, onReactions } from "../lib/storage";
import type { UserReaction, ReactionType } from "../types";
import {
  POLES_LABELS,
  POLES_COLORS,
  GRADE_LABELS,
  GRADE_COLORS,
  type PolesReaction,
  type GradeType,
} from "../types";

interface PickReactionProps {
  roomCode: string;
  pickNum: number;
  userName: string;
  isBearsPick: boolean;
}

const POLES_OPTIONS: PolesReaction[] = ["king", "meh", "bad"];
const GRADE_OPTIONS: GradeType[] = ["a-plus", "a", "b", "c", "d", "f"];

/** Reaction buttons for a confirmed pick — Bears get Poles reactions, others get letter grades. */
export default function PickReaction({ roomCode, pickNum, userName, isBearsPick }: PickReactionProps) {
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

  if (isBearsPick) {
    return (
      <div className="flex items-center gap-1.5">
        {POLES_OPTIONS.map((opt) => {
          const isSelected = myReaction === opt;
          const count = counts[opt] ?? 0;
          return (
            <button
              key={opt}
              onClick={() => handleReact(opt)}
              className={`font-condensed text-xs font-bold uppercase px-2.5 py-1 rounded border transition-all ${
                isSelected
                  ? POLES_COLORS[opt] + " border-current"
                  : "text-muted bg-surface border-border hover:border-border-bright"
              }`}
            >
              {POLES_LABELS[opt]}
              {count > 0 && (
                <span className="font-mono text-[10px] ml-1 opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
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
