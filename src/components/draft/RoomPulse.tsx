import { useMemo } from "react";
import { PROSPECTS } from "../../data/prospects";
import { getExpectedPlayer, getPickProb } from "../../data/prospectOdds";
import { getHeadshot } from "../../lib/headshots";

interface RoomPulseProps {
  /** All guesses for the current pick: { userName: playerName } */
  pickGuesses: Record<string, string>;
  /** Current user's name */
  userName: string;
  /** Current pick number (1-32) */
  pickNumber: number;
  /** Total users in the room */
  totalUsers: number;
  /** When true, component fades out before unmounting */
  fading?: boolean;
}

interface GuessTally {
  playerName: string;
  position: string;
  rank: number | null;
  espnProb: number;
  headshot: string | undefined;
  count: number;
  pct: number;
  isChalk: boolean;
  isUserPick: boolean;
}

const MAX_VISIBLE = 5;

export default function RoomPulse({
  pickGuesses,
  userName,
  pickNumber,
  totalUsers,
  fading = false,
}: RoomPulseProps) {
  const chalk = getExpectedPlayer(pickNumber);
  const guessers = Object.keys(pickGuesses);
  const guessCount = guessers.length;

  const tallies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const player of Object.values(pickGuesses)) {
      counts[player] = (counts[player] || 0) + 1;
    }

    const result: GuessTally[] = Object.entries(counts)
      .map(([playerName, count]) => {
        const prospect = PROSPECTS.find((p) => p.name === playerName);
        return {
          playerName,
          position: prospect?.position ?? "—",
          rank: prospect?.rank ?? null,
          espnProb: getPickProb(pickNumber, playerName),
          headshot: getHeadshot(playerName),
          count,
          pct: Math.round((count / guessCount) * 100),
          isChalk: playerName === chalk,
          isUserPick: pickGuesses[userName] === playerName,
        };
      })
      .sort((a, b) => b.count - a.count);

    return result;
  }, [pickGuesses, userName, pickNumber, guessCount, chalk]);

  if (guessCount === 0) return null;

  const userGuessed = !!pickGuesses[userName];
  const uniqueGuesses = tallies.length;
  const roomAgreesWithChalk = tallies[0]?.isChalk;
  const visible = tallies.slice(0, MAX_VISIBLE);
  const hiddenCount = tallies.length - visible.length;

  return (
    <div className={`bg-surface border border-border rounded-lg overflow-hidden transition-opacity duration-500 ${
      fading ? "opacity-0" : "opacity-100 animate-fade-in-up"
    }`}>
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

      {/* Distribution bars — top 5 */}
      <div className="px-3 py-2 space-y-2">
        {/* Column headers */}
        <div className="flex items-center gap-3 font-condensed text-xs text-muted uppercase tracking-wide">
          <div className="w-7 shrink-0" />
          <div className="w-24 sm:w-32 shrink-0">Player</div>
          <div className="w-10 shrink-0 text-right">Rank</div>
          <div className="w-12 shrink-0 text-right mr-3">Odds</div>
          <div className="flex-1">Votes</div>
          <div className="w-16 shrink-0" />
        </div>

        {visible.map((tally) => (
          <div key={tally.playerName} className="flex items-center gap-3">
            {/* Headshot */}
            {tally.headshot ? (
              <img
                src={tally.headshot}
                alt={tally.playerName}
                className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border shrink-0" />
            )}

            {/* Player name */}
            <div className="w-24 sm:w-32 shrink-0 truncate">
              <span
                className={`font-mono text-xs font-bold ${
                  tally.isUserPick ? "text-amber" : "text-white"
                }`}
              >
                {tally.playerName}
              </span>
            </div>

            {/* Rank */}
            <div className="w-10 shrink-0 text-right font-mono text-xs text-muted">
              {tally.rank ? `#${tally.rank}` : "—"}
            </div>

            {/* Odds */}
            <div className="w-12 shrink-0 text-right mr-3 font-mono text-xs text-white/50">
              {tally.espnProb > 0 ? `${tally.espnProb}%` : "—"}
            </div>

            {/* Bar */}
            <div className="flex-1 h-5 bg-surface-elevated rounded overflow-hidden relative">
              <div
                className={`h-full rounded transition-all duration-500 ${
                  tally.isChalk
                    ? "bg-white/20"
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
                <span className="font-mono text-[10px] text-white/70 bg-white/5 border border-white/20 px-1 rounded">
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

        {/* Overflow summary */}
        {hiddenCount > 0 && (
          <p className="font-mono text-xs text-muted text-center pt-0.5">
            +{hiddenCount} more pick{hiddenCount !== 1 ? "s" : ""}
          </p>
        )}
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
