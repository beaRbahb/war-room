import { useState, useMemo } from "react";
import { PROSPECTS } from "../data/prospects";
import { TEAM_NEEDS } from "../data/teamNeeds";
import { getSlotOdds, getPickProb } from "../data/prospectOdds";
import { getTeamLogo } from "../data/teams";
import { getHeadshot } from "../lib/headshots";
import type { DraftSlot } from "../data/draftOrder";

interface Props {
  slot: DraftSlot;
  selectedPlayers: Set<string>;
  currentPick: string | null;
  onSelect: (playerName: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** All unique positions for filter chips */
const POSITIONS = [...new Set(PROSPECTS.map((p) => p.position))];

type SortMode = "rank" | "value" | "need";

export default function PlayerSelectionPanel({
  slot,
  selectedPlayers,
  currentPick,
  onSelect,
  onClear,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("rank");

  const teamNeeds = useMemo(
    () => TEAM_NEEDS[slot.abbrev] ?? [],
    [slot.abbrev]
  );
  const slotOdds = getSlotOdds(slot.pick);

  /** Available prospects (not already picked elsewhere, unless it's the current pick) */
  const available = useMemo(() => {
    return PROSPECTS.filter(
      (p) => !selectedPlayers.has(p.name) || p.name === currentPick
    );
  }, [selectedPlayers, currentPick]);

  /** Filtered + sorted list */
  const filtered = useMemo(() => {
    let list = available;

    // Search — also searches pro comp
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          (p.proComp && p.proComp.toLowerCase().includes(q))
      );
    }

    // Position filter
    if (posFilter) {
      list = list.filter(
        (p) => p.position === posFilter || p.position.includes(posFilter)
      );
    }

    // Sort
    if (sort === "rank") {
      list = [...list].sort((a, b) => a.rank - b.rank);
    } else if (sort === "value") {
      // Partition: values first (rank < slot), then BPA, then reaches
      list = [...list].sort((a, b) => a.rank - b.rank);
      const values = list.filter((p) => p.rank <= slot.pick);
      const reaches = list.filter((p) => p.rank > slot.pick);
      list = [...values, ...reaches];
    } else if (sort === "need") {
      // Team needs first, then by rank
      list = [...list].sort((a, b) => {
        const aMatch = teamNeeds.includes(a.position) ? 0 : 1;
        const bMatch = teamNeeds.includes(b.position) ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return a.rank - b.rank;
      });
    }

    return list;
  }, [available, search, posFilter, sort, slot.pick, teamNeeds]);

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
      <div className="fixed inset-y-0 right-0 z-50 w-full lg:w-[640px] xl:w-[720px] bg-bg border-l border-border flex flex-col animate-fade-in-up">
        {/* ─── Team Context Header ─── */}
        <div className="shrink-0 bg-surface border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Team logo */}
              <img
                src={getTeamLogo(slot.abbrev)}
                alt={slot.abbrev}
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm text-muted">
                    #{slot.pick}
                  </span>
                  <span className="font-display text-xl text-white tracking-wide">
                    {slot.team}
                  </span>
                </div>
                {slot.fromTeam && (
                  <p className="font-mono text-xs text-muted">
                    via {slot.fromTeam}
                  </p>
                )}
                {slot.trade && slot.tradeNote && (
                  <p className="font-mono text-xs text-amber-dim">
                    {slot.tradeNote}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-white font-mono text-xl px-2"
            >
              ✕
            </button>
          </div>

          {/* Team needs */}
          {teamNeeds.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="font-condensed text-xs text-muted uppercase">
                Needs:
              </span>
              {teamNeeds.map((pos) => (
                <span
                  key={pos}
                  className="font-mono text-xs bg-surface-elevated border border-border rounded px-1.5 py-0.5 text-amber"
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          {/* Slot odds + consensus pick */}
          {slotOdds && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-condensed text-xs text-muted uppercase">
                  Chalk:
                </span>
                <span className="font-mono text-xs text-white">
                  {slotOdds.expectedPlayer}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-condensed text-xs text-muted uppercase">
                  Odds:
                </span>
                <span
                  className={`font-mono text-xs ${
                    slotOdds.odds.startsWith("-")
                      ? "text-green"
                      : "text-white"
                  }`}
                >
                  {slotOdds.odds}
                </span>
                <span className="font-mono text-xs text-muted">
                  ({slotOdds.oddsType})
                </span>
              </div>
            </div>
          )}

          {/* Current selection */}
          {currentPick && (
            <div className="mt-2 flex items-center justify-between bg-surface-elevated border border-green/30 rounded px-3 py-1.5">
              <span className="font-mono text-sm text-green">
                Selected: {currentPick}
              </span>
              <button
                onClick={onClear}
                className="font-condensed text-xs text-red uppercase hover:text-red/80"
              >
                CLEAR
              </button>
            </div>
          )}
        </div>

        {/* ─── Search + Filter Bar ─── */}
        <div className="shrink-0 px-4 py-3 border-b border-border space-y-2">
          {/* Search input */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, college, position, pro comp..."
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white font-mono placeholder:text-muted focus:border-amber focus:outline-none"
            autoFocus
          />

          {/* Position filter chips */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setPosFilter(null)}
              className={`font-condensed text-xs uppercase px-2 py-1 rounded border ${
                posFilter === null
                  ? "bg-amber text-bg border-amber"
                  : "bg-surface border-border text-muted hover:text-white"
              }`}
            >
              ALL
            </button>
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() =>
                  setPosFilter(posFilter === pos ? null : pos)
                }
                className={`font-condensed text-xs uppercase px-2 py-1 rounded border ${
                  posFilter === pos
                    ? "bg-amber text-bg border-amber"
                    : "bg-surface border-border text-muted hover:text-white"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Sort toggle */}
          <div className="flex items-center gap-1">
            <span className="font-condensed text-xs text-muted uppercase mr-1">
              Sort:
            </span>
            {(
              [
                ["rank", "RANK"],
                ["value", "VALUE"],
                ["need", "NEED"],
              ] as [SortMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`font-condensed text-xs uppercase px-2 py-1 rounded border ${
                  sort === mode
                    ? "bg-amber text-bg border-amber"
                    : "bg-surface border-border text-muted hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Prospect List ─── */}
        <div className="flex-1 overflow-auto">
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
                    onClick={() => onSelect(prospect.name)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-surface-elevated ${
                      isSelected
                        ? "bg-surface-elevated border-l-2 border-l-green"
                        : isChalk
                          ? "border-l-2 border-l-amber"
                          : "border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Headshot */}
                    <div className="w-12 h-12 rounded-full bg-surface border border-border shrink-0 overflow-hidden mt-0.5">
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

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: rank + name + pro comp */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs text-muted">
                          #{prospect.rank}
                        </span>
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
                            <span
                              className={`font-mono text-xs ${
                                prospect.ras >= 9.0
                                  ? "text-green"
                                  : prospect.ras >= 7.0
                                    ? "text-amber"
                                    : "text-muted"
                              }`}
                            >
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

                    {/* Right side: probability + reach/value + need */}
                    <div className="shrink-0 text-right space-y-0.5 mt-0.5">
                      {pickProb > 0 && (
                        <div
                          className={`font-mono text-xs font-bold ${
                            pickProb >= 20
                              ? "text-green"
                              : pickProb >= 10
                                ? "text-amber"
                                : "text-muted"
                          }`}
                        >
                          {pickProb}%
                        </div>
                      )}
                      <div
                        className={`font-condensed text-xs font-bold uppercase ${reachValue.color}`}
                      >
                        {reachValue.label}
                      </div>
                      {needsMatch && (
                        <div className="font-condensed text-xs font-bold text-amber uppercase">
                          NEED
                        </div>
                      )}
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
