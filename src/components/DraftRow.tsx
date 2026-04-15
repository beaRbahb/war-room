import { useRef, useEffect } from "react";
import { isBearsPick } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import { TEAM_NEEDS } from "../data/teamNeeds";
import { getPickProb } from "../data/prospectOdds";
import { getTeamLogo, getTeamAbbrev } from "../data/teams";
import type { DraftSlot } from "../data/draftOrder";
import type { ConfirmedPick } from "../types";

export type RowState = "editable" | "active" | "completed" | "locked";

interface DraftRowProps {
  slot: DraftSlot;
  index: number;
  rowState: RowState;
  /** User's pick — bracket pick (pre-draft) or live guess (live) */
  userPick: string | null;
  /** Official confirmed result (live/done phase) */
  confirmedPick: ConfirmedPick | null;
  /** Whether user's guess matched the actual pick */
  isCorrect: boolean | null;
  onClick: () => void;
  /** Whether the reaction row is expanded (completed rows only) */
  expanded: boolean;
  onToggleExpand: () => void;
  /** Auto-scroll to this row when active */
  shouldScroll?: boolean;
  /** Live mode: submit guess callback (shown as inline button when guess selected but not submitted) */
  onSubmit?: () => void;
  /** Live mode: whether guess has been submitted */
  submitted?: boolean;
  /** Live mode: whether the pick window is open */
  windowOpen?: boolean;
  /** Children for expanded content (reactions) */
  children?: React.ReactNode;
}

function getProspect(name: string) {
  return PROSPECTS.find((p) => p.name === name);
}

export default function DraftRow({
  slot,
  index,
  rowState,
  userPick,
  confirmedPick,
  isCorrect,
  onClick,
  expanded,
  onToggleExpand,
  shouldScroll,
  onSubmit,
  submitted,
  windowOpen,
  children,
}: DraftRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const bears = isBearsPick(slot.abbrev);

  // Auto-scroll to active row
  useEffect(() => {
    if (shouldScroll && rowState === "active" && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [shouldScroll, rowState]);

  // Determine display player and stats
  const displayName = confirmedPick?.playerName ?? userPick;
  const prospect = displayName ? getProspect(displayName) : null;
  const teamNeeds = TEAM_NEEDS[slot.abbrev] ?? [];
  const needsMatch = prospect && teamNeeds.includes(prospect.position);

  const rankDiff = prospect ? prospect.rank - slot.pick : 0;
  const reachValue = prospect
    ? rankDiff > 8
      ? { label: "REACH", color: "text-red" }
      : rankDiff > 3
        ? { label: "REACH", color: "text-red/70" }
        : rankDiff < -8
          ? { label: "STEAL", color: "text-green" }
          : rankDiff < -3
            ? { label: "VALUE", color: "text-green/70" }
            : { label: "BPA", color: "text-amber" }
    : null;

  // Row background
  const rowBg =
    rowState === "active"
      ? "bg-amber/5"
      : bears
        ? "bg-bears-navy/15"
        : index % 2 === 0
          ? "bg-surface"
          : "bg-surface-elevated/50";

  // Row border
  const borderClass =
    rowState === "active"
      ? "border-amber animate-pulse-border"
      : rowState === "completed" && isCorrect
        ? "border-green"
        : rowState === "completed" && isCorrect === false
          ? "border-red/50"
          : "border-border hover:border-border-bright";

  const isClickable = rowState === "editable" || rowState === "active";
  const isExpandable = rowState === "completed" && confirmedPick;

  return (
    <div ref={rowRef}>
      <button
        onClick={() => {
          if (isClickable) onClick();
          if (isExpandable) onToggleExpand();
        }}
        disabled={rowState === "locked"}
        className={`w-full flex items-center gap-2 ${rowBg} border rounded px-3 h-12 text-left transition-colors ${borderClass} ${
          rowState === "locked" ? "opacity-40 cursor-not-allowed" : ""
        } ${bears ? "border-l-2 border-l-bears-orange" : ""}`}
      >
        {/* Pick number */}
        <span
          className={`font-mono text-sm w-8 text-right shrink-0 ${
            bears ? "text-bears-orange font-bold" : "text-muted"
          }`}
        >
          {slot.pick}
        </span>

        {/* Team logo + abbrev */}
        <div className="flex items-center gap-1.5 w-24 shrink-0">
          <img
            src={getTeamLogo(slot.abbrev)}
            alt={slot.abbrev}
            className="w-8 h-8 object-contain shrink-0"
          />
          <div>
            <span className="font-condensed text-base text-white uppercase block">
              {slot.abbrev}
            </span>
            {slot.fromTeam && (
              <span className="font-mono text-[10px] text-muted block leading-tight">
                via {getTeamAbbrev(slot.fromTeam)}
              </span>
            )}
          </div>
        </div>

        {/* Player display */}
        <div className="flex-1 min-w-0">
          {rowState === "completed" && confirmedPick ? (
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-mono text-sm text-white truncate">
                {confirmedPick.playerName}
              </span>
              {userPick && !isCorrect && (
                <span className="font-mono text-sm text-muted/50 line-through truncate shrink-0">
                  {userPick}
                </span>
              )}
            </div>
          ) : rowState === "active" && displayName && prospect ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white truncate">
                {prospect.name}
              </span>
              {!submitted && onSubmit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSubmit(); }}
                  className="bg-green text-bg font-condensed font-bold uppercase px-3 py-1 rounded text-sm hover:brightness-110 transition-all shrink-0 animate-pulse"
                >
                  SUBMIT
                </button>
              )}
            </div>
          ) : displayName && prospect ? (
            <span className="font-condensed font-bold text-sm text-white truncate block">
              {prospect.name}
            </span>
          ) : rowState === "active" && windowOpen ? (
            <span className="font-mono text-sm text-amber animate-pulse">
              Tap to pick →
            </span>
          ) : rowState === "active" ? (
            <span className="font-mono text-sm text-muted">
              — Waiting on commissioner —
            </span>
          ) : rowState === "locked" ? (
            <span className="font-mono text-sm text-muted">—</span>
          ) : (
            <span className="font-mono text-sm text-muted">
              — Select player —
            </span>
          )}
        </div>

        {/* Stat columns — always rendered for alignment */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {prospect ? (
            <>
              <span className="font-mono text-xs text-muted w-14 text-center hidden md:block">
                {prospect.position}
              </span>
              <span className="font-mono text-xs text-muted w-8 text-right">
                #{prospect.rank}
              </span>
              <span className="font-mono text-xs w-12 text-right text-muted">
                {(() => {
                  const prob = getPickProb(slot.pick, prospect.name);
                  return prob > 0 ? `${prob}%` : "—";
                })()}
              </span>
              <span
                className={`font-condensed text-xs font-bold uppercase w-16 text-center ${
                  reachValue?.color ?? "text-muted"
                }`}
              >
                {reachValue?.label ?? ""}
              </span>
              <span className="font-condensed text-xs font-bold uppercase w-12 text-center">
                {needsMatch ? <span className="text-amber">NEED</span> : ""}
              </span>
            </>
          ) : (
            <>
              <span className="w-14 shrink-0 hidden md:block" />
              <span className="w-8 shrink-0" />
              <span className="w-12 shrink-0" />
              <span className="w-16 shrink-0" />
              <span className="w-12 shrink-0" />
            </>
          )}
        </div>

        {/* Status indicator (non-completed rows only) */}
        <span className="text-sm w-5 text-center shrink-0">
          {rowState === "completed" ? null
          : rowState === "editable" && userPick ? (
            <span className="text-green">✓</span>
          ) : rowState === "active" && submitted ? (
            <span className="text-green">✓</span>
          ) : (
            <span className="text-muted">›</span>
          )}
        </span>
      </button>

      {/* Expanded reaction area */}
      {expanded && children && (
        <div className="bg-surface-elevated border border-t-0 border-border rounded-b px-3 py-2 -mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
