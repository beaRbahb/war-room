import { memo, useRef, useEffect } from "react";
import { isBearsPick } from "../../data/draftOrder";
import { PROSPECTS } from "../../data/prospects";
import { getTeamLogo, getTeamAbbrev } from "../../data/teams";
import type { DraftSlot } from "../../data/draftOrder";
import type { ConfirmedPick, ReactionType } from "../../types";
import { GRADE_LABELS } from "../../types";

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
  onClick: (index: number) => void;
  /** Whether the reaction row is expanded (completed rows only) */
  expanded: boolean;
  onToggleExpand: (pickNum: number) => void;
  /** Auto-scroll to this row when active */
  shouldScroll?: boolean;
  /** Ref to the scroll container — used for explicit scrollTo instead of scrollIntoView */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Live mode: submit guess callback (shown as inline button when guess selected but not submitted) */
  onSubmit?: () => void;
  /** Live mode: whether guess has been submitted */
  submitted?: boolean;
  /** Live mode: whether the pick window is open */
  windowOpen?: boolean;
  /** Live mode: window was opened then closed, commissioner is finalizing */
  windowFinalizing?: boolean;
  /** Pulse animation for first empty bracket slot */
  isPulsing?: boolean;
  /** User's locked-in reaction for completed rows */
  userGrade?: ReactionType | null;
  /** Children for expanded content (reactions) */
  children?: React.ReactNode;
}

function getProspect(name: string) {
  return PROSPECTS.find((p) => p.name === name);
}

export default memo(function DraftRow({
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
  scrollContainerRef,
  isPulsing,
  onSubmit,
  submitted,
  windowOpen,
  windowFinalizing,
  userGrade,
  children,
}: DraftRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const bears = isBearsPick(slot.abbrev);

  // Auto-scroll using explicit container.scrollTo — immune to scrollIntoView's
  // tendency to scroll ALL ancestors (viewport, overflow-hidden parents, etc.)
  useEffect(() => {
    if (!shouldScroll || (rowState !== "active" && rowState !== "completed")) return;
    const row = rowRef.current;
    const container = scrollContainerRef?.current;
    if (!row || !container) return;

    const rowRect = row.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (rowState === "completed") {
      // Scroll completed row near the top so recap card + next pick are visible
      const delta = rowRect.top - containerRect.top - 16;
      container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
    } else {
      // Center active row in the scroll container
      const delta = rowRect.top - containerRect.top - containerRect.height / 2 + rowRect.height / 2;
      container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
    }
  }, [shouldScroll, rowState, scrollContainerRef]);

  // Determine display player and stats
  const displayName = confirmedPick?.playerName ?? userPick;
  const prospect = displayName ? getProspect(displayName) : null;
  // Row background — pulsing slot uses subtle hint, active uses full amber
  const rowBg =
    rowState === "active"
      ? "bg-amber/5"
      : isPulsing
        ? "bg-white/[0.02]"
        : bears
          ? "bg-bears-navy/15"
          : index % 2 === 0
            ? "bg-surface"
            : "bg-surface-elevated/50";

  // Row border — pulsing uses dimmed amber, active uses full amber
  const borderClass =
    rowState === "active"
      ? "border-amber animate-pulse-border"
      : isPulsing
        ? "border-amber/40 animate-pulse-border"
        : "border-border hover:border-border-bright";

  const isClickable = rowState === "editable" || rowState === "active";
  const isExpandable = rowState === "completed" && confirmedPick;

  return (
    <div ref={rowRef}>
      <button
        onClick={() => {
          if (isClickable) onClick(index);
          if (isExpandable) onToggleExpand(slot.pick);
        }}
        disabled={rowState === "locked"}
        className={`w-full flex items-center gap-1.5 sm:gap-2 ${rowBg} border rounded pl-1 pr-2 sm:px-3 h-14 sm:h-12 text-left transition-colors ${borderClass} ${
          rowState === "locked" ? "opacity-40 cursor-not-allowed" : ""
        } ${bears && !isPulsing && rowState !== "active" ? "border-l-2 border-l-bears-orange" : ""}`}
      >
        {/* Pick number */}
        <span
          className={`font-mono text-xs sm:text-sm w-4 sm:w-8 text-right shrink-0 ${
            bears ? "text-bears-orange font-bold" : "text-muted"
          }`}
        >
          {slot.pick}
        </span>

        {/* Team logo + abbrev */}
        <div className="flex items-center gap-1.5 w-24 shrink-0 overflow-hidden">
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
            <div className="min-w-0">
              <span className={`font-mono text-sm truncate block ${
                isCorrect ? "text-green" : isCorrect === false ? "text-red" : "text-white"
              }`}>
                {confirmedPick.playerName}
              </span>
              {userPick && !isCorrect ? (
                <span className="font-mono text-[10px] sm:text-xs text-muted/50 line-through truncate block leading-tight">
                  {userPick}
                </span>
              ) : !userPick ? (
                <span className="font-mono text-[10px] sm:text-xs text-muted/50 block leading-tight">
                  No pick
                </span>
              ) : null}
            </div>
          ) : rowState === "active" && displayName && prospect ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white truncate">
                {prospect.name}
              </span>
              {submitted && (
                <span className="hidden sm:inline font-condensed text-xs text-green uppercase shrink-0">locked in</span>
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
          ) : rowState === "active" && windowFinalizing ? (
            <span className="font-mono text-sm text-muted">
              <span className="sm:hidden">Finalizing pick...</span>
              <span className="hidden sm:inline">— Finalizing pick —</span>
            </span>
          ) : rowState === "active" ? (
            <span className="font-mono text-sm text-muted">
              <span className="sm:hidden">Pick #{slot.pick} coming up</span>
              <span className="hidden sm:inline">— Pick #{slot.pick} coming up —</span>
            </span>
          ) : rowState === "locked" ? (
            <span className="font-mono text-sm text-muted">—</span>
          ) : (
            <span className="font-mono text-sm text-muted">
              — Select player —
            </span>
          )}
        </div>

        {/* Stat columns — uniform w-12, always all 4 rendered for alignment */}
        <span className="hidden md:block font-mono text-xs text-muted w-12 text-right shrink-0">
          {prospect ? prospect.position : ""}
        </span>
        <span className="hidden md:block font-mono text-xs text-muted w-12 text-right shrink-0">
          {prospect ? `#${prospect.rank}` : ""}
        </span>
        <span className="hidden md:block font-condensed text-sm font-bold uppercase w-12 text-right shrink-0 text-muted">
          {userGrade
            ? ((GRADE_LABELS as Record<string, string>)[userGrade] ?? userGrade)
            : rowState === "completed" ? "—" : ""}
        </span>

        {/* Status indicator */}
        <span className="text-sm w-5 text-center shrink-0">
          {rowState === "completed" ? null : (
            <span className="text-muted">›</span>
          )}
        </span>
      </button>

      {/* Mobile full-width submit button */}
      {rowState === "active" && onSubmit && !submitted && displayName && (
        <button
          onClick={onSubmit}
          className="sm:hidden w-full h-10 bg-green text-bg font-condensed font-bold uppercase text-sm rounded mt-1 hover:brightness-110 transition-all animate-pulse"
        >
          SUBMIT
        </button>
      )}

      {/* Expanded reaction area */}
      {expanded && children && (
        <div className="bg-surface-elevated border border-t-0 border-border rounded-b px-3 py-2 -mt-1">
          {children}
        </div>
      )}
    </div>
  );
})
