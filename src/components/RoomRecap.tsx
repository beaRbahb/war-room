import type { RoomRecapStats } from "../lib/recap";
import type { LeaderboardEntry } from "../types";
import ChaosMeter from "./ChaosMeter";

interface RoomRecapProps {
  stats: RoomRecapStats;
  entries: LeaderboardEntry[];
  roomCode: string;
}

/** Room-level post-draft summary card. */
export default function RoomRecap({ stats, entries, roomCode }: RoomRecapProps) {
  return (
    <div className="w-[400px] bg-surface border border-amber rounded-xl p-5 shrink-0">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="font-display text-sm text-muted tracking-widest">
          WAR ROOM 2026
        </p>
        <p className="font-mono text-xs text-muted">{roomCode}</p>
        <p className="font-display text-3xl text-amber tracking-wide mt-2">
          DRAFT RECAP
        </p>
      </div>

      {/* Winner */}
      <div className="bg-amber/10 border border-amber/30 rounded-lg p-4 mb-4 text-center">
        <p className="font-condensed text-xs text-amber uppercase mb-1">Champion</p>
        <p className="font-display text-3xl text-amber">{stats.winner.name}</p>
        <p className="font-mono text-lg text-white">{stats.winner.score} pts</p>
      </div>

      {/* Draft stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-bg border border-border rounded p-3 text-center">
          <p className="font-mono text-2xl text-amber font-bold">{stats.roomAccuracy}%</p>
          <p className="font-condensed text-xs text-muted uppercase">Room Accuracy</p>
        </div>
        <div className="bg-bg border border-border rounded p-3 text-center">
          <p className="font-mono text-2xl text-amber font-bold">{stats.avgChaos}</p>
          <p className="font-condensed text-xs text-muted uppercase">Avg Chaos</p>
        </div>
      </div>

      {/* Most chaos + most chalk */}
      {stats.mostChaosPick && (
        <div className="bg-bg border border-border rounded p-3 mb-2">
          <p className="font-condensed text-xs text-muted uppercase mb-1">Most Chaotic Pick</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-white">
              #{stats.mostChaosPick.pick.pick} {stats.mostChaosPick.pick.playerName}
            </p>
            <ChaosMeter
              slot={stats.mostChaosPick.pick.pick}
              playerName={stats.mostChaosPick.pick.playerName}
            />
          </div>
        </div>
      )}
      {stats.mostChalkPick && (
        <div className="bg-bg border border-border rounded p-3 mb-4">
          <p className="font-condensed text-xs text-muted uppercase mb-1">Most Chalk Pick</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-white">
              #{stats.mostChalkPick.pick.pick} {stats.mostChalkPick.pick.playerName}
            </p>
            <ChaosMeter
              slot={stats.mostChalkPick.pick.pick}
              playerName={stats.mostChalkPick.pick.playerName}
            />
          </div>
        </div>
      )}

      {/* Final standings */}
      <div className="mb-4">
        <p className="font-condensed text-xs text-muted uppercase mb-2">Final Standings</p>
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div
              key={entry.name}
              className="flex items-center justify-between bg-bg border border-border rounded px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted w-5 text-right">
                  {i + 1}.
                </span>
                <span className="font-condensed text-sm text-white font-bold">
                  {entry.name}
                </span>
              </div>
              <span className="font-mono text-sm text-amber font-bold">
                {entry.totalScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2 border-t border-border">
        <p className="font-display text-xs text-muted tracking-widest">WAR ROOM</p>
      </div>
    </div>
  );
}
