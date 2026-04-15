import { useState, useMemo } from "react";
import { DRAFT_ORDER, isBearsPick } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import { updateLiveState, confirmPick } from "../lib/storage";
import type { LiveState, ConfirmedPick } from "../types";

interface CommissionerControlsProps {
  roomCode: string;
  liveState: LiveState;
  pickedPlayers: string[];
  /** Current team abbrev at this slot (after swaps applied) */
  currentTeamAbbrev?: string;
  /** Whether swap mode is active */
  swapMode?: boolean;
  /** Toggle swap mode on/off */
  onToggleSwap?: () => void;
}

/**
 * Compact inline commissioner controls.
 * Renders small buttons inline + an expandable finalize panel below.
 */
export default function CommissionerControls({
  roomCode,
  liveState,
  pickedPlayers,
  currentTeamAbbrev,
  swapMode = false,
  onToggleSwap,
}: CommissionerControlsProps) {
  const [pickSearch, setPickSearch] = useState("");
  const [selectedOfficialPick, setSelectedOfficialPick] = useState("");
  const [showFinalize, setShowFinalize] = useState(false);

  const teamAbbrev = currentTeamAbbrev ?? DRAFT_ORDER.find(
    (s) => s.pick === liveState.currentPick
  )?.abbrev ?? "??";

  const available = useMemo(
    () => PROSPECTS.filter((p) => !pickedPlayers.includes(p.name)),
    [pickedPlayers]
  );

  const filteredPlayers = useMemo(() => {
    if (!pickSearch.trim()) return available;
    const q = pickSearch.toLowerCase();
    return available.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q)
    );
  }, [available, pickSearch]);

  async function handleOpenWindow() {
    await updateLiveState(roomCode, {
      windowOpen: true,
      windowOpenedAt: new Date().toISOString(),
      teamOnClock: teamAbbrev,
      tradeMode: false,
    });
  }

  async function handleCloseWindow() {
    await updateLiveState(roomCode, { windowOpen: false });
  }

  async function handleConfirmPick() {
    if (!selectedOfficialPick) return;

    const pick: ConfirmedPick = {
      pick: liveState.currentPick,
      playerName: selectedOfficialPick,
      teamAbbrev: teamAbbrev,
      confirmedAt: new Date().toISOString(),
      isBearsPick: isBearsPick(teamAbbrev || ""),
    };

    await confirmPick(roomCode, pick);

    await updateLiveState(roomCode, {
      currentPick: liveState.currentPick + 1,
      windowOpen: false,
      windowOpenedAt: null,
      bearsDoubleActive: false,
      tradeMode: false,
    });

    setSelectedOfficialPick("");
    setPickSearch("");
    setShowFinalize(false);
  }

  return (
    <>
      {/* Inline buttons — sits inside the row flex */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!liveState.windowOpen ? (
          <button
            onClick={handleOpenWindow}
            className="bg-green text-bg font-condensed font-bold uppercase px-3 py-1 rounded text-sm hover:brightness-110 transition-all"
          >
            OPEN
          </button>
        ) : (
          <button
            onClick={handleCloseWindow}
            className="bg-red text-white font-condensed font-bold uppercase px-3 py-1 rounded text-sm hover:brightness-110 transition-all"
          >
            CLOSE
          </button>
        )}

        <button
          onClick={() => setShowFinalize(!showFinalize)}
          className={`font-condensed font-bold uppercase px-3 py-1 rounded text-sm transition-all ${
            showFinalize
              ? "bg-amber text-bg"
              : "bg-amber/20 text-amber hover:bg-amber/30"
          }`}
        >
          FINALIZE
        </button>

        {onToggleSwap && (
          <button
            onClick={onToggleSwap}
            className={`font-condensed font-bold uppercase px-3 py-1 rounded text-sm transition-all ${
              swapMode
                ? "bg-white text-bg"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            TRADE
          </button>
        )}
      </div>

      {/* Backdrop to dismiss finalize */}
      {showFinalize && (
        <div className="fixed inset-0 z-40" onClick={() => setShowFinalize(false)} />
      )}

      {/* Finalize panel */}
      {showFinalize && (
        <div className="absolute left-0 right-0 top-full z-50 mx-3 mt-1 bg-surface-elevated border border-amber rounded p-2 shadow-lg">
          <input
            type="text"
            value={pickSearch}
            onChange={(e) => setPickSearch(e.target.value)}
            placeholder="Search player..."
            className="w-full bg-bg border border-border rounded px-2 py-1 text-white font-mono text-xs text-right focus:border-amber focus:outline-none mb-1"
          />
          <div className="max-h-40 overflow-auto">
            {filteredPlayers.slice(0, 15).map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setSelectedOfficialPick(p.name);
                  setPickSearch(p.name);
                }}
                className={`w-full text-right px-2 py-1 font-mono text-xs hover:bg-surface transition-colors rounded ${
                  selectedOfficialPick === p.name
                    ? "bg-amber/10 text-amber"
                    : "text-white"
                }`}
              >
                #{p.rank} {p.name}{" "}
                <span className="text-muted">{p.position}</span>
              </button>
            ))}
          </div>
          {selectedOfficialPick && (
            <div className="flex justify-end mt-1.5">
              <button
                onClick={handleConfirmPick}
                className="bg-green text-bg font-condensed font-bold uppercase px-3 py-1 rounded text-sm hover:brightness-110 transition-all"
              >
                CONFIRM: {selectedOfficialPick}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
