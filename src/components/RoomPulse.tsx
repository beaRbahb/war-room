import { useEffect, useState } from "react";
import { onGuesses } from "../lib/storage";
import { PROSPECTS } from "../data/prospects";

interface RoomPulseProps {
  roomCode: string;
  pickNumber: number;
}

interface PositionCount {
  position: string;
  count: number;
  percent: number;
}

/**
 * Live aggregate of position groups the room is guessing.
 * Shows horizontal bars without revealing individual picks.
 * Only renders when 3+ guesses exist (prevents deduction in small rooms).
 */
export default function RoomPulse({ roomCode, pickNumber }: RoomPulseProps) {
  const [distribution, setDistribution] = useState<PositionCount[]>([]);
  const [totalGuesses, setTotalGuesses] = useState(0);

  useEffect(() => {
    const unsub = onGuesses(roomCode, pickNumber, (guesses) => {
      const entries = Object.values(guesses);
      setTotalGuesses(entries.length);

      // Map each guess to position
      const posMap: Record<string, number> = {};
      for (const playerName of entries) {
        const prospect = PROSPECTS.find((p) => p.name === playerName);
        const pos = prospect?.position || "??";
        posMap[pos] = (posMap[pos] || 0) + 1;
      }

      // Sort descending by count
      const total = entries.length || 1;
      const dist = Object.entries(posMap)
        .map(([position, count]) => ({
          position,
          count,
          percent: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setDistribution(dist);
    });

    return unsub;
  }, [roomCode, pickNumber]);

  // Don't show until 3+ guesses (privacy threshold)
  if (totalGuesses < 3) return null;

  // Determine headline
  const top = distribution[0];
  const second = distribution[1];
  let headline = "";
  if (top && top.percent > 50) {
    headline = `Room is leaning ${top.position}`;
  } else if (top && second && top.percent - second.percent <= 10) {
    headline = `Split: ${top.position} vs ${second.position}`;
  }

  return (
    <div className="bg-bg border border-border rounded p-3 mt-3">
      <p className="font-condensed text-xs text-muted uppercase tracking-wide mb-2">
        ROOM PULSE
      </p>

      {headline && (
        <p className="font-condensed text-sm text-amber font-bold mb-2">
          {headline}
        </p>
      )}

      <div className="space-y-1">
        {distribution.map(({ position, percent }) => (
          <div key={position} className="flex items-center gap-2">
            <span className="font-condensed text-xs text-white w-10 text-right">
              {position}
            </span>
            <div className="flex-1 h-3 bg-surface-elevated rounded-sm overflow-hidden">
              <div
                className="h-full bg-amber rounded-sm transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="font-mono text-xs text-amber w-8">
              {percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
