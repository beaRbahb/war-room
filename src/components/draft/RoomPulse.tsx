import { useMemo } from "react";
import { PROSPECTS } from "../../data/prospects";
import { getExpectedPlayer } from "../../data/prospectOdds";

interface RoomPulseProps {
  /** All guesses for the current pick: { userName: playerName } */
  pickGuesses: Record<string, string>;
  /** Current user's name */
  userName: string;
  /** Current pick number (1-32) */
  pickNumber: number;
  /** Total users in the room */
  totalUsers: number;
}

interface GuessTally {
  playerName: string;
  position: string;
  college: string;
  count: number;
  pct: number;
  isChalk: boolean;
  isUserPick: boolean;
}

export default function RoomPulse({
  pickGuesses,
  userName,
  pickNumber,
  totalUsers,
}: RoomPulseProps) {
  const chalk = getExpectedPlayer(pickNumber);
  const guessers = Object.keys(pickGuesses);
  const guessCount = guessers.length;

  const tallies = useMemo(() => {
    // Count occurrences of each guessed player
    const counts: Record<string, number> = {};
    for (const player of Object.values(pickGuesses)) {
      counts[player] = (counts[player] || 0) + 1;
    }

    // Build tally entries sorted by count desc
    const result: GuessTally[] = Object.entries(counts)
      .map(([playerName, count]) => {
        const prospect = PROSPECTS.find((p) => p.name === playerName);
        return {
          playerName,
          position: prospect?.position ?? "—",
          college: prospect?.college ?? "",
          count,
          pct: Math.round((count / guessCount) * 100),
          isChalk: playerName === chalk,
          isUserPick: pickGuesses[userName] === playerName,
        };
      })
      .sort((a, b) => b.count - a.count);

    return result;
  }, [pickGuesses, userName, pickNumber, guessCount, chalk]);

  // No guesses yet — shouldn't show, but handle gracefully
  if (guessCount === 0) return null;

  const userGuessed = !!pickGuesses[userName];
  const uniqueGuesses = tallies.length;
  const roomAgreesWithChalk = tallies[0]?.isChalk;

  return (
    <div className="mx-2 sm:mx-4 mb-3 bg-surface border border-border rounded-lg overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-amber tracking-wide">
            ROOM PULSE
          </span>
          <span className="font-mono text-xs text-muted">
            {guessCount}/{totalUsers} guessed
          </span>
        </div>
        {!userGuessed && (
          <span className="font-mono text-xs text-red">
            YOU MISSED THIS WINDOW
          </span>
        )}
      </div>

      {/* Distribution bars */}
      <div className="px-3 py-2 space-y-1.5">
        {tallies.map((tally) => (
          <div key={tally.playerName} className="flex items-center gap-2">
            {/* Player info */}
            <div className="w-28 sm:w-36 shrink-0 truncate">
              <span
                className={`font-mono text-xs font-bold ${
                  tally.isUserPick ? "text-amber" : "text-white"
                }`}
              >
                {tally.playerName}
              </span>
              <span className="font-mono text-xs text-muted ml-1">
                {tally.position}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 h-5 bg-surface-elevated rounded overflow-hidden relative">
              <div
                className={`h-full rounded transition-all duration-500 ${
                  tally.isChalk
                    ? "bg-green/30"
                    : tally.isUserPick
                      ? "bg-amber/30"
                      : "bg-border-bright"
                }`}
                style={{ width: `${tally.pct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-2 font-mono text-xs text-white/70">
                {tally.count} ({tally.pct}%)
              </span>
            </div>

            {/* Badges */}
            <div className="flex gap-1 w-16 shrink-0 justify-end">
              {tally.isChalk && (
                <span className="font-mono text-[10px] text-green bg-green/10 border border-green/30 px-1 rounded">
                  CHALK
                </span>
              )}
              {tally.isUserPick && (
                <span className="font-mono text-[10px] text-amber bg-amber/10 border border-amber/30 px-1 rounded">
                  YOU
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer insight */}
      <div className="px-3 py-1.5 border-t border-border">
        <p className="font-mono text-xs text-muted">
          {uniqueGuesses === 1
            ? `Unanimous — everyone picked ${tallies[0].playerName}`
            : roomAgreesWithChalk
              ? `Room agrees with the chalk (${tallies[0].playerName})`
              : chalk
                ? `Room fading the chalk — ${chalk} not the favorite`
                : `${uniqueGuesses} different picks across ${guessCount} guesses`}
        </p>
      </div>
    </div>
  );
}
