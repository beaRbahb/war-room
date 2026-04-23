import type { UserRecapStats } from "../../lib/recap";
import type { PersonaType } from "../../lib/personas";
import PersonaBadge from "../reactions/PersonaBadge";
import ChaosMeter from "../chaos/ChaosMeter";

interface RecapCardProps {
  stats: UserRecapStats;
  persona?: PersonaType;
  roomCode: string;
}

/** Per-user post-draft recap card. Designed for screenshot sharing. */
export default function RecapCard({ stats, persona, roomCode }: RecapCardProps) {
  const medals = ["", "", ""];

  return (
    <div className="w-[400px] bg-surface border border-border rounded-xl p-5 shrink-0">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="font-display text-sm text-muted tracking-widest">
          ON THE CLOCK 2026
        </p>
        <p className="font-mono text-xs text-muted">{roomCode}</p>
      </div>

      {/* Name + rank */}
      <div className="text-center mb-4">
        <p className="font-display text-4xl text-amber tracking-wide">
          {stats.name}
        </p>
        <p className="font-display text-2xl text-white mt-1">
          {stats.rank <= 3 ? medals[stats.rank - 1] + " " : ""}#{stats.rank}
        </p>
        {persona && (
          <div className="mt-2 flex justify-center">
            <PersonaBadge persona={persona} size="lg" />
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-bg border border-border rounded p-2 text-center">
          <p className="font-mono text-2xl text-amber font-bold">
            {stats.totalScore}
          </p>
          <p className="font-condensed text-xs text-muted uppercase">Total</p>
        </div>
        <div className="bg-bg border border-border rounded p-2 text-center">
          <p className="font-mono text-lg text-white font-bold">
            {stats.bracketScore}
          </p>
          <p className="font-condensed text-xs text-muted uppercase">Bracket</p>
        </div>
        <div className="bg-bg border border-border rounded p-2 text-center">
          <p className="font-mono text-lg text-white font-bold">
            {stats.liveScore}
          </p>
          <p className="font-condensed text-xs text-muted uppercase">Live</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-bg border border-border rounded p-2">
          <p className="font-condensed text-xs text-muted uppercase mb-1">Bracket</p>
          <p className="font-mono text-sm text-white">
            {stats.bracketPlayersCorrect}/{stats.liveTotal} players
          </p>
          <p className="font-mono text-sm text-green">
            {stats.bracketExactSlots} exact slots
          </p>
        </div>
        <div className="bg-bg border border-border rounded p-2">
          <p className="font-condensed text-xs text-muted uppercase mb-1">Live Picks</p>
          <p className="font-mono text-sm text-white">
            {stats.liveCorrect}/{stats.liveTotal} correct
          </p>
          <p className="font-mono text-sm text-amber">
            {stats.liveTotal > 0
              ? Math.round((stats.liveCorrect / stats.liveTotal) * 100)
              : 0}% accuracy
          </p>
        </div>
      </div>

      {/* Best call */}
      {stats.bestCall && (
        <div className="bg-bg border border-border rounded p-3 mb-4">
          <p className="font-condensed text-xs text-muted uppercase mb-1">Best Call</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-green">
                #{stats.bestCall.pick.pick} {stats.bestCall.pick.playerName}
              </p>
              <p className="font-mono text-xs text-muted">
                {stats.bestCall.pick.teamAbbrev}
              </p>
            </div>
            <ChaosMeter
              slot={stats.bestCall.pick.pick}
              playerName={stats.bestCall.pick.playerName}
            />
          </div>
        </div>
      )}

      {/* Bears prediction */}
      {stats.bearsPrediction && (
        <div className="bg-bears-navy/30 border border-bears-orange/30 rounded p-3 mb-4">
          <p className="font-condensed text-xs text-bears-orange uppercase mb-1">
            Bears Pick #{stats.bearsPrediction.actual ? "25" : ""}
          </p>
          <p className="font-mono text-sm text-white">
            Actual: <span className="text-bears-orange">{stats.bearsPrediction.actual}</span>
          </p>
          {stats.bearsPrediction.bracketPick && (
            <p className="font-mono text-xs text-muted">
              Bracket: {stats.bearsPrediction.bracketPick}
              {stats.bearsPrediction.bracketPick === stats.bearsPrediction.actual && (
                <span className="text-green"> NAILED IT</span>
              )}
            </p>
          )}
          {stats.bearsPrediction.livePick && (
            <p className="font-mono text-xs text-muted">
              Live: {stats.bearsPrediction.livePick}
              {stats.bearsPrediction.livePick === stats.bearsPrediction.actual && (
                <span className="text-green"> NAILED IT</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2 border-t border-border">
        <p className="font-display text-xs text-muted tracking-widest">ON THE CLOCK</p>
      </div>
    </div>
  );
}
