import { useMemo } from "react";
import { PROSPECTS } from "../../data/prospects";
import { TEAM_NEEDS } from "../../data/teamNeeds";
import { getSlotOdds, getPickProb } from "../../data/prospectOdds";
import { getTeamLogo, getTeamColor } from "../../data/teams";
import { getHeadshot } from "../../lib/headshots";
import type { DraftSlot } from "../../data/draftOrder";

interface Props {
  slot: DraftSlot;
  selectedPlayers: Set<string>;
  currentPick: string | null;
  onSelect: (playerName: string) => void;
  onClear: () => void;
  onClose: () => void;
  /** Whether the user already submitted their guess (live mode) */
  liveSubmitted?: boolean;
}


export default function PlayerSelectionPanel({
  slot,
  selectedPlayers,
  currentPick,
  onSelect,
  onClear,
  onClose,
  liveSubmitted = false,
}: Props) {
  const teamNeeds = useMemo(
    () => TEAM_NEEDS[slot.abbrev] ?? [],
    [slot.abbrev]
  );
  const slotOdds = getSlotOdds(slot.pick);
  const teamColor = getTeamColor(slot.abbrev);

  /** Available prospects (not already picked elsewhere, unless it's the current pick) */
  const available = useMemo(() => {
    return PROSPECTS.filter(
      (p) => !selectedPlayers.has(p.name) || p.name === currentPick
    );
  }, [selectedPlayers, currentPick]);

  /** Sorted by rank */
  const filtered = useMemo(
    () => [...available].sort((a, b) => a.rank - b.rank),
    [available]
  );

  function getReachValue(rank: number): {
    label: string;
    color: string;
  } {
    const diff = rank - slot.pick;
    if (diff > 15) return { label: "BIG REACH", color: "text-red" };
    if (diff > 8) return { label: "REACH", color: "text-red" };
    if (diff > 3) return { label: "SLIGHT REACH", color: "text-red/70" };
    if (diff < -15) return { label: "HUGE STEAL", color: "text-green" };
    if (diff < -8) return { label: "STEAL", color: "text-green" };
    if (diff < -3) return { label: "VALUE", color: "text-green/70" };
    return { label: "BPA", color: "text-amber" };
  }

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Panel — side panel on desktop, full sheet on mobile */}
      <div className="fixed inset-y-0 right-0 z-50 w-full lg:w-[720px] xl:w-[840px] bg-bg border-l border-border flex flex-col animate-fade-in-up">
        {/* ─── Team Context Header ─── */}
        <div
          className="shrink-0 border-b border-border-bright"
          style={{ background: `linear-gradient(180deg, ${teamColor}40 0%, var(--color-bg) 100%)` }}
        >
          <div className="px-4 sm:px-5 pt-5 pb-5">
            {/* Top row: logo + team + close */}
            <div className="flex items-center gap-3.5 mb-4.5">
              <img
                src={getTeamLogo(slot.abbrev)}
                alt={slot.abbrev}
                className="w-16 h-16 sm:w-16 sm:h-16 object-contain shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm text-amber tracking-wide">
                  PICK #{slot.pick}
                </span>
                <div className="font-display text-[28px] text-white tracking-wide leading-none">
                  {slot.team}
                </div>
                {slot.fromTeam && (
                  <p className="font-mono text-xs text-muted mt-0.5">
                    via {slot.fromTeam}
                  </p>
                )}
                {slot.trade && slot.tradeNote && (
                  <p className="font-mono text-xs text-amber-dim mt-0.5">
                    {slot.tradeNote}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-white font-mono text-xl px-2 self-start"
              >
                ✕
              </button>
            </div>

            {/* Needs — larger pills */}
            {teamNeeds.length > 0 && (
              <div className="flex items-center gap-2 mb-4.5 flex-wrap">
                <span className="font-condensed text-xs text-muted uppercase tracking-wide">
                  NEEDS
                </span>
                {teamNeeds.map((pos) => (
                  <span
                    key={pos}
                    className="font-mono text-xs font-bold bg-amber/15 border border-amber/30 rounded px-3 py-1 text-amber"
                  >
                    {pos}
                  </span>
                ))}
              </div>
            )}

            {/* Chalk callout box */}
            {slotOdds && (
              <div className="bg-surface border border-border-bright rounded-md px-4 py-3.5 flex items-center justify-between">
                <div>
                  <span className="font-condensed text-xs uppercase tracking-wide text-muted">
                    VEGAS CHALK PICK
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-lg text-white font-bold">
                      {slotOdds.expectedPlayer}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-lg font-bold ${
                      slotOdds.odds.startsWith("-")
                        ? "text-green"
                        : "text-white"
                    }`}
                  >
                    {slotOdds.odds}
                  </span>
                  {(!slotOdds.oddsTeam || slotOdds.oddsTeam === slot.abbrev) && (
                    <div className="font-mono text-[10px] text-muted">
                      {slotOdds.oddsType}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current selection */}
          {currentPick && (
            <div className="mx-4 sm:mx-5 mb-4 flex items-center justify-between bg-surface-elevated border border-green/30 rounded px-3 py-1.5">
              <span className="font-mono text-sm text-green">
                {liveSubmitted ? "LOCKED IN: " : "Selected: "}{currentPick}
              </span>
              {!liveSubmitted && (
                <button
                  onClick={onClear}
                  className="font-condensed text-xs text-red uppercase hover:text-red/80"
                >
                  CLEAR
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Divider with instruction ─── */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-2 bg-surface border-y border-border">
          <div className="flex-1 h-px bg-border" />
          <span className="font-condensed text-xs text-muted uppercase tracking-widest">Select a player</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ─── Prospect List ─── */}
        <div className="flex-1 overflow-auto">
          {/* Column headers */}
          <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-1.5 hidden sm:flex items-center gap-3">
            <span className="w-12 shrink-0" />
            <div className="flex-1">
              <span className="font-condensed text-xs text-muted uppercase">Player</span>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="font-condensed text-xs text-muted uppercase w-12 text-right hidden sm:block">Odds</span>
              <span className="font-condensed text-xs text-muted uppercase w-16 text-center hidden sm:block">Value</span>
              <span className="font-condensed text-xs text-muted uppercase w-12 text-center hidden sm:block">Need</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted font-mono text-sm">
              No prospects match your filters
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((prospect) => {
                const headshot = getHeadshot(prospect.name);
                const reachValue = getReachValue(prospect.rank);
                const isSelected = prospect.name === currentPick;
                const needsMatch = teamNeeds.includes(prospect.position);
                const pickProb = getPickProb(slot.pick, prospect.name);
                const isChalk =
                  slotOdds?.expectedPlayer === prospect.name;

                return (
                  <button
                    key={prospect.name}
                    onClick={() => !liveSubmitted && onSelect(prospect.name)}
                    disabled={liveSubmitted}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${liveSubmitted ? "opacity-50 cursor-not-allowed" : "hover:bg-surface-elevated"} ${
                      isSelected
                        ? "bg-surface-elevated border-l-2 border-l-green"
                        : isChalk
                          ? "border-l-2 border-l-amber"
                          : "border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Headshot + rank */}
                    <div className="shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
                      <div className="w-12 h-12 rounded-full bg-surface border border-border overflow-hidden">
                        {headshot ? (
                          <img
                            src={headshot}
                            alt={prospect.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-condensed text-xs text-muted">
                            {prospect.position}
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-xs text-amber font-bold">
                        #{prospect.rank}
                      </span>
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: name + chalk badge */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-condensed font-bold text-white text-sm truncate">
                          {prospect.name}
                        </span>
                        {isChalk && (
                          <span className="font-condensed text-xs text-amber uppercase shrink-0">
                            CHALK
                          </span>
                        )}
                      </div>

                      {/* Row 2: position + college + pro comp */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`font-mono text-xs ${
                            needsMatch ? "text-amber" : "text-muted"
                          }`}
                        >
                          {prospect.position}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {prospect.college}
                        </span>
                        {prospect.proComp && (
                          <>
                            <span className="text-muted text-xs">—</span>
                            <span className="font-body text-xs text-muted italic truncate">
                              {prospect.proComp}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Row 3: measurables (if available) */}
                      {(prospect.height || prospect.weight || prospect.ras) && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {prospect.height && (
                            <span className="font-mono text-xs text-muted">
                              {prospect.height}
                            </span>
                          )}
                          {prospect.weight && (
                            <span className="font-mono text-xs text-muted">
                              {prospect.weight}lb
                            </span>
                          )}
                          {prospect.age && (
                            <span className="font-mono text-xs text-muted">
                              {prospect.age}yo
                            </span>
                          )}
                          {prospect.ras && (
                            <span className="font-mono text-xs text-muted">
                              RAS {prospect.ras.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Row 4: scouting note (if available) */}
                      {prospect.note && (
                        <p className="font-body text-xs text-muted/80 mt-1 line-clamp-2">
                          {prospect.note}
                        </p>
                      )}
                    </div>

                    {/* Right side: ESPN prob, value, need as columns */}
                    <div className="shrink-0 flex items-center gap-2 mt-0.5">
                      <span className={`font-mono text-xs font-bold w-12 text-right hidden sm:block ${
                        pickProb >= 20
                          ? "text-green"
                          : pickProb >= 10
                            ? "text-amber"
                            : "text-muted"
                      }`}>
                        {pickProb > 0 ? `${pickProb}%` : "—"}
                      </span>
                      <span className={`font-condensed text-xs font-bold uppercase w-16 text-center hidden sm:block ${reachValue.color}`}>
                        {reachValue.label}
                      </span>
                      <span className="font-condensed text-xs font-bold uppercase w-12 text-center hidden sm:block">
                        {needsMatch ? <span className="text-amber">NEED</span> : "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer: count ─── */}
        <div className="shrink-0 bg-surface border-t border-border px-4 py-2">
          <span className="font-mono text-xs text-muted">
            {filtered.length} prospect{filtered.length !== 1 ? "s" : ""}{" "}
            available
          </span>
        </div>
      </div>
    </>
  );
}
