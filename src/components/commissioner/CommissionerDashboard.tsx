import { useState, useEffect, useMemo } from "react";
import { DRAFT_ORDER, isBearsPick } from "../../data/draftOrder";
import { PROSPECTS } from "../../data/prospects";
import { BLOCKBUSTER_TRADES } from "../../data/blockbusterTrades";
import { GUESS_WINDOW_SECONDS, FLASH_WARNING_SECONDS } from "../../data/scoring";
import { getTeamLogo } from "../../data/teams";
import { updateLiveState, confirmPickAndAdvance, removeUser, setBackupCommissioner } from "../../lib/storage";
import { useESPNPoll } from "../../hooks/useESPNPoll";
import { resolveESPNName } from "../../lib/espn";
import type { LiveState, ConfirmedPick, RoomUser } from "../../types";
import type { DraftSlot } from "../../data/draftOrder";

interface CommissionerDashboardProps {
  roomCode: string;
  liveState: LiveState;
  effectiveOrder: DraftSlot[];
  results: Record<string, ConfirmedPick>;
  pickedPlayers: string[];
  users: Record<string, RoomUser>;
  backupCommissionerId: string | null;
  isPrimaryCommissioner: boolean;
  guessCount: number;
  totalUsers: number;
  onShowQuickStart?: () => void;
  onTrade?: () => void;
}

export default function CommissionerDashboard({
  roomCode,
  liveState,
  effectiveOrder,
  results,
  pickedPlayers,
  users,
  backupCommissionerId,
  isPrimaryCommissioner,
  guessCount,
  totalUsers,
  onShowQuickStart,
  onTrade,
}: CommissionerDashboardProps) {
  // ── ESPN auto-fill ──
  const { suggestion: espnSuggestion, clearSuggestion: clearESPN } = useESPNPoll(true, liveState.currentPick);

  // ── Finalize flow state ──
  const [pickSearch, setPickSearch] = useState("");
  const [selectedOfficialPick, setSelectedOfficialPick] = useState("");
  const [confirming, setConfirming] = useState(false);

  // ── Room panel ──
  const [roomPanelOpen, setRoomPanelOpen] = useState(
    () => window.innerWidth >= 768
  );

  // ── Kick confirm ──
  const [kickConfirm, setKickConfirm] = useState<string | null>(null);

  // ── Timer ──
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!liveState.windowOpen || !liveState.windowOpenedAt) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [liveState.windowOpen, liveState.windowOpenedAt]);

  const timeLeft =
    !liveState.windowOpen || !liveState.windowOpenedAt
      ? GUESS_WINDOW_SECONDS
      : Math.ceil(
          Math.min(
            GUESS_WINDOW_SECONDS,
            Math.max(
              0,
              GUESS_WINDOW_SECONDS -
                (now - new Date(liveState.windowOpenedAt).getTime()) / 1000
            )
          )
        );

  const isFlashing = liveState.windowOpen && timeLeft <= FLASH_WARNING_SECONDS;

  // ── Current slot info ──
  const currentSlot = effectiveOrder.find(
    (s) => s.pick === liveState.currentPick
  );
  const teamAbbrev = currentSlot?.abbrev ?? "??";
  const teamName =
    currentSlot?.team ?? DRAFT_ORDER[liveState.currentPick - 1]?.team ?? "TBD";

  // ── Hero card state ──
  const isWindowOpen = liveState.windowOpen;
  const isFinalize =
    !liveState.windowOpen && !!liveState.windowOpenedAt;
  const isIdle = !isWindowOpen && !isFinalize;

  // ── Available players ──
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

  // ── Blockbuster trades (Bears picks only) ──
  const isBears = isBearsPick(teamAbbrev);
  const filteredBlockbusters = useMemo(() => {
    if (!isBears) return [];
    if (!pickSearch.trim()) return BLOCKBUSTER_TRADES;
    const q = pickSearch.toLowerCase();
    return BLOCKBUSTER_TRADES.filter(
      (bt) =>
        bt.name.toLowerCase().includes(q) ||
        bt.position.toLowerCase().includes(q)
    );
  }, [isBears, pickSearch]);

  const isBlockbusterSelected = BLOCKBUSTER_TRADES.some(
    (bt) => bt.name === selectedOfficialPick
  );

  // ── Confirmed count ──
  const confirmedCount = Object.keys(results).length;

  // ── Guess progress ──
  const guessPct = totalUsers > 0 ? guessCount / totalUsers : 0;
  const allGuessesIn = guessPct >= 1;

  // ── Handlers ──
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
    if (!selectedOfficialPick || confirming) return;
    setConfirming(true);

    try {
      const pick: ConfirmedPick = {
        pick: liveState.currentPick,
        playerName: selectedOfficialPick,
        teamAbbrev: teamAbbrev,
        confirmedAt: new Date().toISOString(),
        isBearsPick: isBearsPick(teamAbbrev),
      };

      await confirmPickAndAdvance(roomCode, pick, {
        currentPick: liveState.currentPick + 1,
        windowOpen: false,
        windowOpenedAt: null,
        tradeMode: false,
      });

      setSelectedOfficialPick("");
      setPickSearch("");
    } finally {
      setConfirming(false);
    }
  }

  // ── Hero Card Left Pane (team info) ──
  const originalAbbrev = DRAFT_ORDER[liveState.currentPick - 1]?.abbrev;
  const isTraded = teamAbbrev !== originalAbbrev;

  function renderTeamInfo() {
    return (
      <div className="flex flex-col items-center text-center gap-1">
        <img
          src={getTeamLogo(teamAbbrev)}
          alt={teamAbbrev}
          className="w-11 h-11 object-contain"
        />
        <p className="font-display text-xl text-white leading-tight">
          {teamName}
        </p>
        <div className="w-8 h-px bg-amber mt-1 mb-1" />
        <span className="inline-block font-mono text-[15px] font-bold text-white leading-tight">
          PICK {liveState.currentPick}
        </span>
        {isTraded && (
          <span className="font-condensed text-[11px] text-muted uppercase tracking-wide">
            via {originalAbbrev}
          </span>
        )}
        {onTrade && (
          <button
            onClick={onTrade}
            className="font-condensed font-bold uppercase text-[11px] tracking-wide text-amber bg-transparent border border-amber/40 rounded px-3 py-0.5 mt-1 hover:bg-amber/10 hover:border-amber transition-all"
          >
            TRADE
          </button>
        )}
      </div>
    );
  }

  // ── Hero Card ──
  function renderHeroCard() {
    const borderClass = isWindowOpen
      ? "border-amber animate-pulse-border"
      : "border-border";

    return (
      <div
        className={`bg-surface-elevated rounded-lg border ${borderClass} overflow-hidden`}
      >
        {/* Split panel */}
        <div className="flex flex-row">
          {/* Left pane — team info */}
          <div className="p-3 w-1/2 border-r border-border flex items-center justify-center">
            {renderTeamInfo()}
          </div>

          {/* Right pane — status/action */}
          <div className="p-3 w-1/2 flex flex-col items-center text-center justify-between min-h-[120px]">
            {isIdle && (
              <>
                <div>
                  <p className="font-condensed text-xs text-muted uppercase tracking-wider">
                    WINDOW
                  </p>
                  <p className="font-mono text-[32px] font-bold text-muted leading-tight">
                    IDLE
                  </p>
                </div>
                <button
                  onClick={handleOpenWindow}
                  className="mt-3 w-full self-stretch bg-green text-bg font-condensed font-bold uppercase text-sm py-2.5 rounded hover:brightness-110 transition-all"
                >
                  START GUESSES
                </button>
              </>
            )}

            {isWindowOpen && (
              <>
                <div>
                  <p className="font-condensed text-xs text-muted uppercase tracking-wider">
                    TIME LEFT
                  </p>
                  <p
                    className={`font-mono text-[32px] font-bold leading-tight ${
                      isFlashing
                        ? "text-red animate-countdown-pulse"
                        : "text-amber"
                    }`}
                  >
                    0:{timeLeft.toString().padStart(2, "0")}
                  </p>
                </div>
                <div className="mt-2 w-full">
                  <p
                    className={`font-mono text-sm font-bold ${
                      allGuessesIn ? "text-green" : "text-amber"
                    }`}
                  >
                    {guessCount}/{totalUsers}
                  </p>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-border rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        allGuessesIn ? "bg-green" : "bg-amber"
                      }`}
                      style={{ width: `${Math.min(100, guessPct * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCloseWindow}
                  className="mt-3 w-full self-stretch bg-red text-white font-condensed font-bold uppercase text-sm py-2.5 rounded hover:brightness-110 transition-all"
                >
                  CLOSE GUESSES
                </button>
              </>
            )}

            {isFinalize && (
              <>
                <div>
                  <p className="font-condensed text-xs text-muted uppercase tracking-wider">
                    GUESSES
                  </p>
                  <p
                    className={`font-mono text-[32px] font-bold leading-tight ${
                      allGuessesIn ? "text-green" : "text-amber"
                    }`}
                  >
                    {guessCount}/{totalUsers}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Finalize zone — below the split panel */}
        {isFinalize && (
          <div className="border-t border-border p-4">
            {/* ESPN suggestion banner */}
            {espnSuggestion && espnSuggestion.overall === liveState.currentPick && (() => {
              const matched = resolveESPNName(espnSuggestion.playerName);
              return (
                <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2 mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-amber truncate">
                    ESPN: <span className="text-white font-bold">{espnSuggestion.playerName}</span> to {espnSuggestion.teamAbbrev}
                    {!matched && <span className="text-red ml-1">(no match)</span>}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedOfficialPick(espnSuggestion.playerName);
                      setPickSearch(espnSuggestion.playerName);
                      clearESPN();
                    }}
                    disabled={!matched}
                    className="shrink-0 bg-amber text-bg font-condensed font-bold uppercase text-xs px-3 py-1 rounded hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    LOAD
                  </button>
                </div>
              );
            })()}
            <input
              type="text"
              value={pickSearch}
              onChange={(e) => setPickSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full bg-bg border border-border rounded px-3 py-2 text-white font-mono text-sm focus:border-amber focus:outline-none mb-2"
            />
            {!selectedOfficialPick && <div className="max-h-48 overflow-auto space-y-0.5">
              {filteredPlayers.slice(0, 20).map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setSelectedOfficialPick(p.name);
                    setPickSearch(p.name);
                  }}
                  className={`w-full text-left px-3 py-1.5 font-mono text-sm hover:bg-surface transition-colors rounded flex items-center gap-2 ${
                    selectedOfficialPick === p.name
                      ? "bg-green/10 text-green"
                      : "text-white"
                  }`}
                >
                  <span className="text-muted w-6 text-right shrink-0">
                    #{p.rank}
                  </span>
                  <span>{p.name}</span>
                </button>
              ))}

              {/* Blockbuster trades — Bears picks only */}
              {filteredBlockbusters.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1.5 mt-1">
                    <div className="flex-1 h-px bg-bears-orange/30" />
                    <span className="font-condensed text-[10px] text-bears-orange uppercase tracking-widest">
                      Blockbuster Trades
                    </span>
                    <div className="flex-1 h-px bg-bears-orange/30" />
                  </div>
                  {filteredBlockbusters.map((bt) => (
                    <button
                      key={bt.name}
                      onClick={() => {
                        setSelectedOfficialPick(bt.name);
                        setPickSearch(bt.name);
                      }}
                      className={`w-full text-left px-3 py-1.5 font-mono text-sm hover:bg-bears-navy/30 transition-colors rounded ${
                        selectedOfficialPick === bt.name
                          ? "bg-bears-orange/15 text-bears-orange"
                          : "text-bears-orange/70"
                      }`}
                    >
                      <span className="text-bears-orange font-bold">
                        {bt.name}
                      </span>{" "}
                      <span className="text-muted">
                        {bt.position} · {bt.currentTeamAbbrev}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>}

            <button
              onClick={handleConfirmPick}
              disabled={!selectedOfficialPick || confirming}
              className={`mt-3 w-full ${
                selectedOfficialPick
                  ? isBlockbusterSelected
                    ? "bg-bears-orange text-white hover:brightness-110"
                    : "bg-green text-bg hover:brightness-110"
                  : "bg-amber/20 text-amber border border-amber animate-pulse-border cursor-not-allowed"
              } font-condensed font-bold uppercase text-sm py-2.5 rounded transition-all disabled:opacity-50`}
            >
              {confirming
                ? "CONFIRMING..."
                : selectedOfficialPick
                  ? isBlockbusterSelected
                    ? `TRADE: ${selectedOfficialPick}`
                    : `CONFIRM PICK: ${selectedOfficialPick}`
                  : "SELECT A PLAYER TO CONFIRM"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Room Panel ──
  function renderRoomPanel() {
    return (
      <div className="bg-surface rounded-lg border border-border mt-3 overflow-hidden">
        {/* Collapsible header */}
        <button
          onClick={() => setRoomPanelOpen(!roomPanelOpen)}
          className="w-full flex items-center justify-between px-3 h-12 sm:h-11 hover:bg-surface-elevated transition-colors"
        >
          <span className="font-condensed text-sm text-muted uppercase tracking-wide">
            ROOM · {Object.keys(users).length} PLAYERS
          </span>
          <span className="text-muted text-xs">
            {roomPanelOpen ? "▲" : "▼"}
          </span>
        </button>

        {roomPanelOpen && (
          <div className="border-t border-border">
            {Object.values(users).map((u) => {
              const isBackup = u.id === backupCommissionerId;
              const isKickTarget = kickConfirm === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-3 h-12 sm:h-11 border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-sm text-white truncate">
                    {u.name}
                    {u.isCommissioner && (
                      <span className="ml-1.5 text-amber text-xs font-condensed uppercase">
                        COMM
                      </span>
                    )}
                    {isBackup && (
                      <span className="ml-1.5 text-green text-xs font-condensed uppercase">
                        BACKUP
                      </span>
                    )}
                  </span>

                  {isPrimaryCommissioner && !u.isCommissioner && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isKickTarget ? (
                        <>
                          <span className="font-condensed text-xs text-red uppercase font-bold">
                            CONFIRM?
                          </span>
                          <button
                            onClick={() => {
                              removeUser(roomCode, u.id);
                              setKickConfirm(null);
                            }}
                            className="font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded bg-red text-white hover:brightness-110 transition-all"
                          >
                            YES
                          </button>
                          <button
                            onClick={() => setKickConfirm(null)}
                            className="font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded bg-surface-elevated text-muted border border-border hover:text-white transition-colors"
                          >
                            CANCEL
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Backup toggle */}
                          <button
                            onClick={() =>
                              setBackupCommissioner(
                                roomCode,
                                isBackup ? null : u.id
                              )
                            }
                            className={`font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded border transition-colors ${
                              isBackup
                                ? "bg-green/20 text-green border-green/40 hover:bg-green/30"
                                : "bg-surface-elevated text-muted border-border hover:text-white hover:border-amber"
                            }`}
                          >
                            {isBackup ? "REMOVE BACKUP" : "BACKUP"}
                          </button>
                          {/* Kick */}
                          <button
                            onClick={() => setKickConfirm(u.id)}
                            className="font-condensed text-xs font-bold uppercase px-2 py-0.5 rounded bg-red/20 text-red border border-red/40 hover:bg-red/30 transition-colors"
                          >
                            KICK
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Draft Board ──
  function renderDraftBoard() {
    return (
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-11 border-b border-border">
          <span className="font-condensed text-sm text-muted uppercase tracking-wide">
            DRAFT BOARD
          </span>
          <span className="font-mono text-xs text-muted">
            {confirmedCount}/32 confirmed
          </span>
        </div>

        {/* Rows */}
        <div>
          {effectiveOrder.map((slot, i) => {
            const pickNum = i + 1;
            const confirmed = results[`pick${pickNum}`] ?? null;
            const isCurrent = pickNum === liveState.currentPick;
            const isPast = pickNum < liveState.currentPick;

            return (
              <div
                key={slot.pick}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 h-14 sm:h-12 border-b border-border last:border-b-0 transition-colors ${
                  isCurrent
                    ? "bg-amber/5 border-l-2 border-l-amber"
                    : isPast
                      ? "opacity-50"
                      : "opacity-25"
                }`}
              >
                <span
                  className={`font-mono text-xs sm:text-sm w-4 sm:w-8 text-right shrink-0 ${
                    isCurrent ? "text-amber font-bold" : "text-muted"
                  }`}
                >
                  {pickNum}
                </span>
                <img
                  src={getTeamLogo(slot.abbrev)}
                  alt={slot.abbrev}
                  className="w-8 h-8 object-contain shrink-0"
                />
                <span className="font-condensed text-sm text-white uppercase w-8 shrink-0">
                  {slot.abbrev}
                </span>
                <span
                  className={`flex-1 font-mono text-sm truncate ${
                    confirmed ? "text-white" : "text-muted"
                  }`}
                >
                  {confirmed?.playerName ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-4">
      {/* Left column — Hero + Room Panel */}
      <div className="lg:w-[340px] lg:shrink-0">
        {/* Wrapper keeps ? button outside hero card's overflow-hidden */}
        <div className="relative">
          {renderHeroCard()}
          {onShowQuickStart && (
            <button
              onClick={onShowQuickStart}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-surface border border-border-bright text-muted font-mono text-xs font-bold flex items-center justify-center hover:border-amber hover:text-amber transition-colors"
              aria-label="Commissioner quick start guide"
            >
              ?
            </button>
          )}
        </div>
        {renderRoomPanel()}
      </div>

      {/* Right column — Draft Board */}
      <div className="flex-1 min-w-0 mt-4 lg:mt-0">
        {renderDraftBoard()}
      </div>
    </div>
  );
}
