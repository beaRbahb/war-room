import type { RefObject } from "react";
import type { RoomRecapStats } from "../../lib/recap";
import type { LeaderboardEntry } from "../../types";
import ChaosMeter from "../chaos/ChaosMeter";

const SHARE_ICON = (
  <svg viewBox="0 0 24 24" className="w-3 h-3 mr-1 fill-current inline-block align-[-1px]">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
  </svg>
);

interface RoomRecapProps {
  stats: RoomRecapStats;
  entries: LeaderboardEntry[];
  roomCode: string;
  cardRef: RefObject<HTMLDivElement | null>;
  onShare: () => void;
  isSharing: boolean;
}

/** Room-level post-draft summary card. */
export default function RoomRecap({ stats, entries, roomCode, cardRef, onShare, isSharing }: RoomRecapProps) {
  return (
    <div>
      <div ref={cardRef} className="w-[400px] bg-surface border border-amber rounded-xl p-5 shrink-0">
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
          <p className="font-condensed text-xs text-amber uppercase mb-1">Overall Champion</p>
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
            <p className="font-mono text-2xl text-amber font-bold">{stats.surprisePicks}</p>
            <p className="font-condensed text-xs text-muted uppercase">Surprise Picks</p>
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
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-mono text-[11px] text-amber/40 tracking-[2px]">Room: {roomCode}</span>
          <span className="font-display text-xs text-muted tracking-widest">WAR ROOM</span>
        </div>
      </div>
      {/* Share button below card */}
      <div className="w-[400px] flex justify-center mt-2 mb-2">
        <button
          onClick={onShare}
          disabled={isSharing}
          className="font-condensed text-xs font-bold uppercase tracking-wider text-muted hover:text-amber transition-colors disabled:opacity-50 px-3 py-1"
        >
          {SHARE_ICON}
          {isSharing ? "SHARING..." : "SHARE IMAGE"}
        </button>
      </div>
    </div>
  );
}
