import { useState, useMemo } from "react";
import { DRAFT_ORDER, isBearsPick } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import {
  updateLiveState,
  confirmPick,
} from "../lib/storage";
import type { LiveState, ConfirmedPick } from "../types";

interface CommissionerPanelProps {
  roomCode: string;
  liveState: LiveState;
  pickedPlayers: string[];
}

export default function CommissionerPanel({
  roomCode,
  liveState,
  pickedPlayers,
}: CommissionerPanelProps) {
  const [showPanel, setShowPanel] = useState(true);
  const [pickSearch, setPickSearch] = useState("");
  const [selectedOfficialPick, setSelectedOfficialPick] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [openWindowConfirm, setOpenWindowConfirm] = useState(false);

  const currentSlot = DRAFT_ORDER.find(
    (s) => s.pick === liveState.currentPick
  );

  // Available players for official pick entry
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
    setOpenWindowConfirm(false);
    await updateLiveState(roomCode, {
      windowOpen: true,
      windowOpenedAt: new Date().toISOString(),
      teamOnClock: currentSlot?.abbrev || "??",
      tradeMode: false,
    });
  }

  async function handleCloseWindow() {
    await updateLiveState(roomCode, {
      windowOpen: false,
    });
  }

  async function handleConfirmPick() {
    if (!selectedOfficialPick) return;

    const pick: ConfirmedPick = {
      pick: liveState.currentPick,
      playerName: selectedOfficialPick,
      teamAbbrev: currentSlot?.abbrev || "??",
      confirmedAt: new Date().toISOString(),
      isBearsPick: isBearsPick(currentSlot?.abbrev || ""),
    };

    await confirmPick(roomCode, pick);

    // Advance to next pick
    await updateLiveState(roomCode, {
      currentPick: liveState.currentPick + 1,
      windowOpen: false,
      windowOpenedAt: null,
      bearsDoubleActive: false,
      tradeMode: false,
    });

    setSelectedOfficialPick("");
    setPickSearch("");
    setConfirmDialog(false);
  }

  async function handleMarkTrade() {
    await updateLiveState(roomCode, {
      tradeMode: true,
      windowOpen: false,
    });
  }

  async function handleResolveTrade() {
    await updateLiveState(roomCode, {
      tradeMode: false,
    });
  }

  async function handleToggleBearsDouble() {
    await updateLiveState(roomCode, {
      bearsDoubleActive: !liveState.bearsDoubleActive,
    });
  }

  async function handleTrubisky() {
    await updateLiveState(roomCode, { trubiskyActive: true });
    setTimeout(() => {
      updateLiveState(roomCode, { trubiskyActive: false });
    }, 4000);
  }

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 z-40 bg-amber text-bg font-condensed font-bold px-4 py-3 rounded-full shadow-lg text-sm uppercase"
      >
        COMMISSIONER
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 w-80 bg-surface border-2 border-amber rounded-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-amber tracking-wide">
            COMMISSIONER
          </h3>
          <button
            onClick={() => setShowPanel(false)}
            className="text-muted hover:text-white text-sm font-mono"
          >
            \u2715
          </button>
        </div>

        {/* Current pick info */}
        <div className="bg-bg border border-border rounded p-2 mb-3">
          <p className="font-mono text-xs text-muted">Current Pick</p>
          <p className="font-display text-xl text-white">
            #{liveState.currentPick} — {currentSlot?.abbrev || "??"}
          </p>
          <p className="font-condensed text-xs text-muted">
            {currentSlot?.team}
            {currentSlot?.fromTeam && ` (via ${currentSlot.fromTeam})`}
          </p>
          {liveState.tradeMode && (
            <p className="font-condensed text-xs text-amber mt-1 uppercase font-bold">
              TRADE — PICK PENDING
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {/* Open/Close window */}
          {!liveState.windowOpen && !liveState.tradeMode && (
            <button
              onClick={() => setOpenWindowConfirm(true)}
              className="w-full bg-amber text-bg font-condensed font-bold uppercase py-2.5 rounded hover:brightness-110 transition-all"
            >
              OPEN WINDOW
            </button>
          )}
          {liveState.windowOpen && (
            <button
              onClick={handleCloseWindow}
              className="w-full bg-red text-white font-condensed font-bold uppercase py-2.5 rounded hover:brightness-110 transition-all"
            >
              CLOSE WINDOW
            </button>
          )}

          {/* Enter official pick */}
          {!liveState.windowOpen && !liveState.tradeMode && (
            <div className="bg-bg border border-border rounded p-2">
              <p className="font-condensed text-xs text-muted uppercase mb-1">
                Enter Official Pick
              </p>
              <input
                type="text"
                value={pickSearch}
                onChange={(e) => setPickSearch(e.target.value)}
                placeholder="Search player..."
                className="w-full bg-surface border border-border rounded px-2 py-1 text-white font-mono text-xs focus:border-amber focus:outline-none mb-1"
              />
              <div className="max-h-32 overflow-auto">
                {filteredPlayers.slice(0, 15).map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedOfficialPick(p.name);
                      setPickSearch(p.name);
                    }}
                    className={`w-full text-left px-2 py-1 font-mono text-xs hover:bg-surface-elevated transition-colors rounded ${
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
                <button
                  onClick={() => setConfirmDialog(true)}
                  className="w-full mt-2 bg-green text-bg font-condensed font-bold uppercase py-2 rounded text-sm hover:brightness-110 transition-all"
                >
                  CONFIRM: {selectedOfficialPick}
                </button>
              )}
            </div>
          )}

          {/* Trade / Bears double */}
          <div className="flex gap-2">
            {!liveState.tradeMode ? (
              <button
                onClick={handleMarkTrade}
                className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase py-2 rounded text-xs hover:border-amber transition-all"
              >
                MARK TRADE
              </button>
            ) : (
              <button
                onClick={handleResolveTrade}
                className="flex-1 bg-amber text-bg font-condensed font-bold uppercase py-2 rounded text-xs hover:brightness-110 transition-all"
              >
                RESOLVE TRADE
              </button>
            )}
            <button
              onClick={handleToggleBearsDouble}
              className={`flex-1 border font-condensed font-bold uppercase py-2 rounded text-xs transition-all ${
                liveState.bearsDoubleActive
                  ? "bg-bears-orange text-white border-bears-orange"
                  : "bg-surface-elevated border-border text-white hover:border-bears-orange"
              }`}
            >
              {liveState.bearsDoubleActive ? "2x ON" : "BEARS 2x"}
            </button>
          </div>

          {/* Trubisky button */}
          <button
            onClick={handleTrubisky}
            disabled={liveState.windowOpen}
            className="w-full bg-bears-navy border border-bears-orange text-bears-orange font-condensed font-bold uppercase py-2 rounded text-xs hover:brightness-125 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            TRUBISKY
          </button>
        </div>
      </div>

      {/* Confirm dialogs */}
      {openWindowConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-amber rounded-xl p-6 max-w-sm w-full">
            <p className="font-display text-xl text-amber mb-2">OPEN WINDOW?</p>
            <p className="font-condensed text-white mb-4">
              This will open the 60s guess window for Pick #{liveState.currentPick} ({currentSlot?.abbrev}) for all players.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleOpenWindow}
                className="flex-1 bg-amber text-bg font-condensed font-bold uppercase py-2.5 rounded"
              >
                OPEN
              </button>
              <button
                onClick={() => setOpenWindowConfirm(false)}
                className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase py-2.5 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-green rounded-xl p-6 max-w-sm w-full">
            <p className="font-display text-xl text-green mb-2">CONFIRM PICK</p>
            <p className="font-condensed text-white mb-1">
              Pick #{liveState.currentPick} — {currentSlot?.abbrev}
            </p>
            <p className="font-display text-2xl text-amber mb-4">
              {selectedOfficialPick}
            </p>
            <p className="font-condensed text-xs text-muted mb-4">
              This cannot be undone. Scores will be calculated immediately.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmPick}
                className="flex-1 bg-green text-bg font-condensed font-bold uppercase py-2.5 rounded"
              >
                PUBLISH
              </button>
              <button
                onClick={() => setConfirmDialog(false)}
                className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase py-2.5 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
