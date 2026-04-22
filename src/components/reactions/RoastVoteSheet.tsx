import { useEffect, useState } from "react";
import {
  onRoastAnswersForPick,
  submitRoastVote,
} from "../../lib/storage";
import type { RoastAnswer } from "../../types";

interface RoastVoteSheetProps {
  roomCode: string;
  pickNum: number;
  userName: string;
  playerName: string;
  onDismiss: () => void;
}

export default function RoastVoteSheet({
  roomCode,
  pickNum,
  userName,
  playerName,
  onDismiss,
}: RoastVoteSheetProps) {
  const [answers, setAnswers] = useState<Record<string, RoastAnswer>>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to roast answers in real time
  useEffect(() => {
    return onRoastAnswersForPick(roomCode, pickNum, (data) => {
      setAnswers(data);
      setLoaded(true);
    });
  }, [roomCode, pickNum]);

  // Sorted alphabetically by author (deterministic, anonymous)
  const sortedEntries = Object.entries(answers).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Don't render until listener has fired AND we have >= 2 answers
  if (!loaded || sortedEntries.length < 2) return null;

  async function handleVote() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await submitRoastVote(roomCode, pickNum, userName, selected);
    } catch (err) {
      console.error("[RoastVoteSheet] vote failed:", err);
    }
    onDismiss();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[64] bg-black/50"
        onClick={onDismiss}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[65] bg-surface border-t border-border rounded-t-2xl animate-slide-up max-h-[70vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-bright" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 text-center">
          <p className="font-display text-xl text-amber tracking-wide">
            VOTE FOR THE BEST
          </p>
          <p className="font-condensed text-sm text-muted uppercase tracking-wide">
            Pick #{pickNum} — {playerName}
          </p>
        </div>

        {/* Scrollable answer cards */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="space-y-2.5">
            {sortedEntries.map(([author, answer], index) => {
              const isSelf = author === userName;
              const isSelected = selected === author;

              return (
                <button
                  key={author}
                  onClick={() => {
                    if (!isSelf) setSelected(author);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-amber bg-amber/10 scale-[1.02]"
                      : "border-border-bright bg-surface-elevated hover:border-white/50 active:scale-[0.98]"
                  }`}
                >
                  <p className="font-mono text-sm leading-relaxed text-white">
                    "{answer.text}"
                  </p>
                  <p
                    className={`font-condensed text-xs uppercase mt-1.5 ${
                      isSelected ? "text-amber" : "text-muted"
                    }`}
                  >
                    — Answer {index + 1}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vote / Skip buttons */}
        <div className="px-4 pt-2 pb-4 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 font-condensed text-base font-bold uppercase tracking-wide py-3 rounded-lg border border-border text-muted hover:text-white hover:border-white/50 transition-all"
          >
            SKIP
          </button>
          <button
            onClick={handleVote}
            disabled={!selected || submitting}
            className={`flex-1 font-condensed text-base font-bold uppercase tracking-wide py-3 rounded-lg transition-all ${
              selected && !submitting
                ? "bg-amber text-bg cursor-pointer hover:brightness-110"
                : "bg-border text-muted cursor-not-allowed opacity-50"
            }`}
          >
            VOTE
          </button>
        </div>
      </div>
    </>
  );
}
