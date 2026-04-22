import { useEffect, useState } from "react";
import { onRoastAnswersForPick, onRoastVotes } from "../../lib/storage";
import { GRADE_LABELS, type GradeType } from "../../types";
import type { UserReaction, RoastAnswer } from "../../types";

/** Grade ranking for tiebreaking — higher grade wins */
const GRADE_RANK: Record<string, number> = {
  "a-plus": 6, a: 5, b: 4, c: 3, d: 2, f: 1,
};

interface PickRecapCardProps {
  roomCode: string;
  pickNum: number;
  reactions: Record<string, UserReaction>;
  userRank?: number;
  scoreDelta?: { bracket: number; live: number };
}

export default function PickRecapCard({
  roomCode, pickNum, reactions, userRank, scoreDelta,
}: PickRecapCardProps) {
  const [roastAnswers, setRoastAnswers] = useState<Record<string, RoastAnswer>>({});
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    return onRoastAnswersForPick(roomCode, pickNum, setRoastAnswers);
  }, [roomCode, pickNum]);

  useEffect(() => {
    return onRoastVotes(roomCode, pickNum, setVotes);
  }, [roomCode, pickNum]);

  // Count reactions by grade
  const gradeCounts: { grade: GradeType; count: number }[] = [];
  const countMap: Record<string, number> = {};
  for (const r of Object.values(reactions)) {
    countMap[r.reaction] = (countMap[r.reaction] ?? 0) + 1;
  }
  for (const [grade, count] of Object.entries(countMap)) {
    if (grade in GRADE_RANK) {
      gradeCounts.push({ grade: grade as GradeType, count });
    }
  }
  // Sort by count desc, then by grade rank desc (higher grade wins tie)
  gradeCounts.sort((a, b) => b.count - a.count || (GRADE_RANK[b.grade] ?? 0) - (GRADE_RANK[a.grade] ?? 0));

  const totalGraded = Object.keys(reactions).length;
  const roastEntries = Object.entries(roastAnswers);
  const totalRoasts = roastEntries.length;
  const winnerGrade = gradeCounts[0];
  const maxCount = winnerGrade?.count ?? 0;

  // Get roast prompt from any answer
  const roastPrompt = roastEntries.find(([, a]) => a.prompt)?.[1]?.prompt;

  // Tally votes per answerer
  const voteCounts: Record<string, number> = {};
  for (const answerer of Object.values(votes)) {
    voteCounts[answerer] = (voteCounts[answerer] ?? 0) + 1;
  }

  // Sort roast entries by vote count descending (winner first), then alphabetical
  const sortedRoasts = [...roastEntries].sort(([nameA], [nameB]) => {
    const countA = voteCounts[nameA] ?? 0;
    const countB = voteCounts[nameB] ?? 0;
    if (countB !== countA) return countB - countA;
    return nameA.localeCompare(nameB);
  });

  const topVoteCount = sortedRoasts.length > 0
    ? (voteCounts[sortedRoasts[0][0]] ?? 0)
    : 0;

  if (totalGraded === 0) return null;

  return (
    <div className="mx-0 mb-1 border border-border rounded-lg overflow-hidden animate-fade-in-up bg-surface">
      {/* Header (clickable to collapse/expand) */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 bg-surface-elevated border-b border-border text-left"
      >
        <span className="font-condensed text-sm font-bold text-white uppercase tracking-wide">
          Pick #{pickNum} Recap
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">
            {totalGraded} graded{totalRoasts > 0 && ` · ${totalRoasts} roast${totalRoasts !== 1 ? "s" : ""}`}
          </span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
      <div className="px-3.5 py-3">
        {/* Score delta row */}
        {(userRank || scoreDelta) && (<>
          <span className="block font-condensed text-sm text-white uppercase tracking-wide mb-1.5">Leaderboard</span>
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
            {userRank && (
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-lg font-bold ${userRank === 1 ? "text-amber" : "text-white"}`}>
                  #{userRank}
                </span>
                <span className="font-condensed text-xs text-muted uppercase">
                  overall
                </span>
              </div>
            )}
            {scoreDelta && (
              <div className="flex gap-2 ml-auto">
                <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${
                  scoreDelta.bracket > 0
                    ? "text-[#4a9eff] bg-[#4a9eff]/10 border border-[#4a9eff]/30"
                    : "text-muted bg-surface-elevated border border-border"
                }`}>
                  +{scoreDelta.bracket} bracket
                </span>
                <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${
                  scoreDelta.live > 0
                    ? "text-green bg-green/[0.08] border border-green/25"
                    : "text-muted bg-surface-elevated border border-border"
                }`}>
                  +{scoreDelta.live} live
                </span>
              </div>
            )}
          </div>
        </>)}

        {/* Split: big consensus grade left, bars right */}
        <span className="block font-condensed text-sm text-white uppercase tracking-wide mb-1.5">Room Grade</span>
        <div className="flex gap-3.5 pb-3.5 border-b border-border mb-3.5">
          {/* Left: big grade */}
          <div className="shrink-0 w-14 sm:w-20 flex flex-col items-center justify-center py-2.5 sm:py-3.5 bg-surface-elevated border border-border rounded-lg">
            <span className="font-display text-3xl sm:text-5xl text-muted leading-none">
              {winnerGrade ? GRADE_LABELS[winnerGrade.grade] : "—"}
            </span>
          </div>

          {/* Right: horizontal bars */}
          <div className="flex-1 flex flex-col gap-1.5 justify-center">
            {gradeCounts.map(({ grade, count }) => {
              const isWinner = count === maxCount;
              const widthPct = maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 0;
              return (
                <div key={grade} className="flex items-center gap-1.5">
                  <span className="font-condensed text-sm font-bold w-6 text-right text-muted">
                    {GRADE_LABELS[grade]}
                  </span>
                  <div className="flex-1 h-5 bg-bg rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${isWinner ? "bg-border-bright" : "bg-border"}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs w-4 text-muted">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roast bubbles — sorted by vote count */}
        {roastPrompt && totalRoasts > 0 && (
          <>
            <span className="block font-condensed text-sm text-white uppercase tracking-wide mb-1.5">Roasts</span>
            <p className="font-condensed text-base text-muted leading-snug mb-2.5">
              {roastPrompt}
            </p>
            {sortedRoasts.map(([name, answer]) => {
              const vc = voteCounts[name] ?? 0;
              const isRoastWinner = vc > 0 && vc === topVoteCount;
              return (
                <div
                  key={name}
                  className="rounded-xl rounded-bl px-3.5 py-2.5 mb-2 last:mb-0 bg-surface-elevated border border-border"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-condensed text-xs font-bold text-white">
                      {name}
                    </p>
                    {vc > 0 && (
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isRoastWinner
                          ? "bg-amber/20 text-amber"
                          : "bg-border text-muted"
                      }`}>
                        {vc} vote{vc !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-white leading-snug">{answer.text}</p>
                </div>
              );
            })}
          </>
        )}

      </div>
      )}
    </div>
  );
}
