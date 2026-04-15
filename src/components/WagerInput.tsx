import { useState, useEffect } from "react";
import { WAGER_MAX_CAP } from "../data/scoring";
import { onWagers } from "../lib/storage";
import type { Wager } from "../types";

interface WagerInputProps {
  roomCode: string;
  pickNumber: number;
  currentLiveScore: number;
  onWagerChange: (amount: number) => void;
  submitted: boolean;
}

/**
 * Optional wager input shown in PickWindow.
 * Users can risk earned points on their prediction.
 * Disabled for pick 1 (everyone starts at 0).
 */
export default function WagerInput({
  roomCode,
  pickNumber,
  currentLiveScore,
  onWagerChange,
  submitted,
}: WagerInputProps) {
  const [amount, setAmount] = useState(0);
  const [potTotal, setPotTotal] = useState(0);

  const maxWager = Math.min(currentLiveScore, WAGER_MAX_CAP);
  const disabled = pickNumber === 1 || submitted;

  // Track the side pot total in real time
  useEffect(() => {
    const unsub = onWagers(roomCode, pickNumber, (wagers: Record<string, Wager>) => {
      const total = Object.values(wagers).reduce((sum, w) => sum + w.amount, 0);
      setPotTotal(total);
    });
    return unsub;
  }, [roomCode, pickNumber]);

  function handleChange(val: number) {
    const clamped = Math.max(0, Math.min(val, maxWager));
    setAmount(clamped);
    onWagerChange(clamped);
  }

  // Don't show for pick 1 (no points to wager)
  if (pickNumber === 1) return null;

  return (
    <div className="bg-bg border border-border rounded p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-condensed text-xs text-muted uppercase tracking-wide">
          CONFIDENCE WAGER
        </p>
        {potTotal > 0 && (
          <span className="font-mono text-xs text-amber">
            POT: {potTotal} pts
          </span>
        )}
      </div>

      {maxWager === 0 ? (
        <p className="font-mono text-xs text-muted">No points to wager</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={maxWager}
              value={amount}
              onChange={(e) => handleChange(Number(e.target.value))}
              disabled={disabled}
              className="flex-1 accent-amber h-1.5"
            />
            <span className={`font-mono text-lg font-bold w-12 text-right ${
              amount > 0 ? "text-amber" : "text-muted"
            }`}>
              {amount}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-1">
              {[0, 5, 10, 25, maxWager].filter((v, i, a) => v <= maxWager && a.indexOf(v) === i).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleChange(preset)}
                  disabled={disabled}
                  className={`font-mono text-xs px-2 py-0.5 rounded border transition-colors ${
                    amount === preset
                      ? "border-amber text-amber bg-amber/10"
                      : "border-border text-muted hover:border-amber/50"
                  } disabled:opacity-30`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <span className="font-mono text-xs text-muted">
              max {maxWager}
            </span>
          </div>
        </>
      )}

      {submitted && amount > 0 && (
        <p className="font-condensed text-xs text-amber mt-2 font-bold uppercase">
          {amount} pts wagered
        </p>
      )}
    </div>
  );
}
