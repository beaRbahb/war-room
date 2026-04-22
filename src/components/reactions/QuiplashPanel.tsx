import { useState } from "react";
import type { QuiplashPhase } from "../../hooks/useQuiplash";
import type { RoastAnswer } from "../../types";

const CHAR_LIMIT = 120;

interface QuiplashPanelProps {
  phase: QuiplashPhase;
  prompt: string;
  answers: Record<string, RoastAnswer>;
  votes: Record<string, string>;
  draftText: string;
  setDraftText: (text: string) => void;
  answerCount: number;
  totalUsers: number;
  userName: string;
  onSubmitAnswer: () => Promise<void>;
  onSubmitVote: (answererName: string) => Promise<void>;
}

export default function QuiplashPanel({
  phase,
  prompt,
  answers,
  votes,
  draftText,
  setDraftText,
  answerCount,
  totalUsers,
  userName,
  onSubmitAnswer,
  onSubmitVote,
}: QuiplashPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!phase) return null;

  // ── Write phase ──
  if (phase === "write") {
    const userSubmitted = !!answers[userName];

    return (
      <div className="mb-3 bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-border bg-surface-elevated">
          <div className="flex items-center justify-between">
            <span className="font-condensed text-sm font-bold text-amber uppercase tracking-wide">
              GM ROAST
            </span>
            <span className="font-mono text-xs text-muted">
              {answerCount} of {totalUsers} answered
            </span>
          </div>
        </div>
        <div className="px-3.5 py-3">
          <p className="font-condensed text-[15px] text-white leading-snug mb-2.5">
            {prompt}
          </p>
          {userSubmitted ? (
            <div className="flex items-center gap-2 py-2">
              <span className="font-condensed text-sm text-green uppercase font-bold">
                Submitted!
              </span>
              <span className="font-mono text-xs text-muted">
                Waiting for others...
              </span>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value.slice(0, CHAR_LIMIT))}
                  placeholder="Type your answer..."
                  maxLength={CHAR_LIMIT}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-bwignore
                  data-form-type="other"
                  className={`w-full bg-bg border rounded-lg px-3 py-2.5 pr-12 text-white font-mono text-sm outline-none ${
                    draftText ? "border-amber" : "border-border-bright"
                  } focus:border-amber`}
                />
                <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] ${
                  draftText ? "text-amber" : "text-muted"
                }`}>
                  {draftText.length}/{CHAR_LIMIT}
                </span>
              </div>
              <button
                onClick={async () => {
                  if (submitting || !draftText.trim()) return;
                  setSubmitting(true);
                  try { await onSubmitAnswer(); } finally { setSubmitting(false); }
                }}
                disabled={!draftText.trim() || submitting}
                className={`shrink-0 font-condensed text-sm font-bold uppercase px-4 py-2.5 rounded-lg transition-all ${
                  draftText.trim() && !submitting
                    ? "bg-amber text-bg hover:brightness-110"
                    : "bg-border text-muted cursor-not-allowed opacity-50"
                }`}
              >
                SEND
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Vote phase ──
  if (phase === "vote") {
    const sortedEntries = Object.entries(answers).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    async function handleVote() {
      if (!selected || submitting) return;
      setSubmitting(true);
      try { await onSubmitVote(selected); } finally { setSubmitting(false); }
    }

    return (
      <div className="mb-3 bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-border bg-surface-elevated">
          <div className="flex items-center justify-between">
            <span className="font-condensed text-sm font-bold text-amber uppercase tracking-wide">
              VOTE FOR THE BEST
            </span>
            <span className="font-mono text-xs text-muted">
              {answerCount} answers
            </span>
          </div>
        </div>
        <div className="px-3.5 py-3 space-y-2">
          {sortedEntries.map(([author, answer], index) => {
            const isSelf = author === userName;
            const isSelected = selected === author;

            return (
              <button
                key={author}
                onClick={() => { if (!isSelf) setSelected(author); }}
                disabled={isSelf}
                className={`w-full text-left px-3.5 py-3 rounded-lg border-2 transition-all ${
                  isSelf
                    ? "border-border bg-bg opacity-50 cursor-not-allowed"
                    : isSelected
                      ? "border-amber bg-amber/10 scale-[1.02]"
                      : "border-border-bright bg-surface-elevated hover:border-white/50 active:scale-[0.98]"
                }`}
              >
                <p className="font-mono text-sm leading-relaxed text-white">
                  "{answer.text}"
                </p>
                <p className={`font-condensed text-xs uppercase mt-1 ${
                  isSelected ? "text-amber" : "text-muted"
                }`}>
                  {isSelf ? "Your answer" : `Answer ${index + 1}`}
                </p>
              </button>
            );
          })}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleVote}
              disabled={!selected || submitting}
              className={`flex-1 font-condensed text-sm font-bold uppercase py-2.5 rounded-lg transition-all ${
                selected && !submitting
                  ? "bg-amber text-bg hover:brightness-110"
                  : "bg-border text-muted cursor-not-allowed opacity-50"
              }`}
            >
              VOTE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results phase ──
  const sortedEntries = Object.entries(answers).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Tally votes
  const voteCounts: Record<string, number> = {};
  for (const answerer of Object.values(votes)) {
    voteCounts[answerer] = (voteCounts[answerer] ?? 0) + 1;
  }
  const topVoteCount = Math.max(0, ...Object.values(voteCounts));

  // Sort by vote count descending for results
  const resultEntries = [...sortedEntries].sort(([nameA], [nameB]) => {
    const countA = voteCounts[nameA] ?? 0;
    const countB = voteCounts[nameB] ?? 0;
    if (countB !== countA) return countB - countA;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="mb-3 bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-border bg-surface-elevated">
        <div className="flex items-center justify-between">
          <span className="font-condensed text-sm font-bold text-amber uppercase tracking-wide">
            GM ROAST RESULTS
          </span>
          <span className="font-mono text-xs text-muted">
            Waiting for pick...
          </span>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <p className="font-condensed text-sm text-muted leading-snug mb-2.5">
          {prompt}
        </p>
        <div className="space-y-2">
          {resultEntries.map(([author, answer]) => {
            const vc = voteCounts[author] ?? 0;
            const isWinner = vc > 0 && vc === topVoteCount;

            return (
              <div
                key={author}
                className={`rounded-lg px-3.5 py-2.5 border ${
                  isWinner
                    ? "border-amber/40 bg-amber/5"
                    : "border-border bg-surface-elevated"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-condensed text-xs font-bold text-white">
                    {author}
                  </p>
                  {vc > 0 && (
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isWinner
                        ? "bg-amber/20 text-amber"
                        : "bg-border text-muted"
                    }`}>
                      {vc} vote{vc !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-white leading-snug">
                  {answer.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
