import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DRAFT_ORDER, isBearsPick } from "../data/draftOrder";
import { PROSPECTS } from "../data/prospects";
import { BRACKET_LOCK_TIME } from "../data/scoring";
import { TEAM_NEEDS } from "../data/teamNeeds";
import { getPickProb } from "../data/prospectOdds";
import { getTeamLogo } from "../data/teams";
import { saveBracket, getBracket, onRoomConfig, updateRoomStatus } from "../lib/storage";
import { getSession } from "../lib/session";
import PlayerSelectionPanel from "../components/PlayerSelectionPanel";
import type { BracketPick, UserBracket } from "../types";

export default function BracketScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const session = getSession();

  const [picks, setPicks] = useState<(BracketPick | null)[]>(
    Array(32).fill(null)
  );
  const [locked, setLocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [showReference, setShowReference] = useState(false);
  const [, setRoomStatus] = useState<string>("bracket");

  const [showStartConfirm, setShowStartConfirm] = useState(false);

  /** Which slot index (0-31) has the selection panel open, or null */
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // Redirect if no session
  useEffect(() => {
    if (!session || session.roomCode !== roomCode) {
      navigate("/");
    }
  }, [session, roomCode, navigate]);

  // Load existing bracket
  useEffect(() => {
    if (!roomCode || !session) return;
    getBracket(roomCode, session.name).then((bracket) => {
      if (bracket?.picks) {
        const loaded: (BracketPick | null)[] = Array(32).fill(null);
        bracket.picks.forEach((p) => {
          if (p && p.slot >= 1 && p.slot <= 32) {
            loaded[p.slot - 1] = p;
          }
        });
        setPicks(loaded);
        if (bracket.submittedAt) setSubmitted(true);
      }
    });
  }, [roomCode, session?.name]);

  // Watch room status for redirect to live
  useEffect(() => {
    if (!roomCode) return;
    return onRoomConfig(roomCode, (config) => {
      if (config?.status === "live") {
        setRoomStatus("live");
        navigate(`/room/${roomCode}/live`);
      }
    });
  }, [roomCode, navigate]);

  // Countdown timer
  useEffect(() => {
    function tick() {
      const now = Date.now();
      const lockMs = BRACKET_LOCK_TIME.getTime();
      const diff = lockMs - now;

      if (diff <= 0) {
        setLocked(true);
        setCountdown("LOCKED");
        return;
      }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Which players are already selected
  const selectedPlayers = useMemo(
    () => new Set(picks.filter(Boolean).map((p) => p!.playerName)),
    [picks]
  );

  function handlePickSelect(slotIndex: number, playerName: string) {
    if (locked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[slotIndex] = {
        slot: slotIndex + 1,
        playerName,
      };
      return next;
    });
    setActiveSlot(null);
  }

  function handlePickClear(slotIndex: number) {
    if (locked) return;
    setPicks((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setActiveSlot(null);
  }

  async function handleSubmit() {
    if (!roomCode || !session || locked) return;

    const bracket: UserBracket = {
      userName: session.name,
      picks: picks.filter(Boolean) as BracketPick[],
      submittedAt: new Date().toISOString(),
    };

    await saveBracket(roomCode, session.name, bracket);
    setSubmitted(true);
  }

  /** Find the prospect object for a selected player name */
  function getProspect(name: string) {
    return PROSPECTS.find((p) => p.name === name);
  }

  if (!session) return null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-amber tracking-wide">
            PRE-DRAFT BRACKET
          </h1>
          <p className="font-mono text-xs text-muted">
            {session.name} — Room {roomCode}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-amber">
            {locked ? "\u{1F512}" : "\u{1F513}"} {countdown}
          </p>
          {submitted && (
            <p className="font-condensed text-xs text-green uppercase">
              Submitted
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Bracket Grid */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Column headers */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 mb-1">
            <span className="w-8 shrink-0" />
            <span className="w-16 shrink-0" />
            <span className="flex-1 font-condensed text-xs text-muted uppercase tracking-wide">Player</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-condensed text-xs text-muted uppercase w-14 text-center hidden md:block">Pos</span>
              <span className="font-condensed text-xs text-muted uppercase w-32 hidden lg:block">Comp</span>
              <span className="font-condensed text-xs text-muted uppercase w-8 text-right">Rank</span>
              <span className="font-condensed text-xs text-muted uppercase w-12 text-right">ESPN</span>
              <span className="font-condensed text-xs text-muted uppercase w-16 text-center">Value</span>
              <span className="font-condensed text-xs text-muted uppercase w-12 text-center">Need</span>
              <span className="w-5 shrink-0" />
            </div>
          </div>

          <div className="space-y-1">
            {DRAFT_ORDER.map((slot, i) => {
              const pick = picks[i];
              const prospect = pick ? getProspect(pick.playerName) : null;
              const needsMatch =
                prospect &&
                TEAM_NEEDS[slot.abbrev]?.includes(prospect.position);
              const rankDiff = prospect
                ? prospect.rank - slot.pick
                : 0;
              const bears = isBearsPick(slot.abbrev);
              const rowBg = bears
                ? "bg-bears-navy/15"
                : i % 2 === 0
                  ? "bg-surface"
                  : "bg-surface-elevated/50";

              return (
                <button
                  key={slot.pick}
                  onClick={() => !locked && setActiveSlot(i)}
                  disabled={locked}
                  className={`w-full flex items-center gap-2 ${rowBg} border rounded px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                    bears ? "border-l-2 border-l-bears-orange" : ""
                  } ${
                    activeSlot === i
                      ? "border-amber"
                      : pick
                        ? "border-border hover:border-border-bright"
                        : "border-border hover:border-amber/50"
                  }`}
                >
                  {/* Pick number */}
                  <span className={`font-mono text-sm w-8 text-right shrink-0 ${
                    bears ? "text-bears-orange font-bold" : "text-muted"
                  }`}>
                    {slot.pick}
                  </span>

                  {/* Team logo + abbrev */}
                  <div className="flex items-center gap-1.5 w-16 shrink-0">
                    <img
                      src={getTeamLogo(slot.abbrev)}
                      alt={slot.abbrev}
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    <span className="font-condensed text-sm text-white uppercase">
                      {slot.abbrev}
                    </span>
                  </div>
                  {slot.trade && (
                    <span className="font-condensed text-xs bg-amber-dim/30 text-amber border border-amber-dim rounded px-1.5 py-0.5 uppercase font-bold tracking-wide shrink-0">
                      TRADE
                    </span>
                  )}

                  {/* Player display or placeholder */}
                  {pick && prospect ? (
                    <span className="flex-1 font-condensed font-bold text-sm text-white truncate min-w-0">
                      {prospect.name}
                    </span>
                  ) : (
                    <span className="flex-1 font-mono text-sm text-muted">
                      — Select player —
                    </span>
                  )}

                  {/* Inline stats — always rendered for alignment */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {pick && prospect ? (
                      <>
                        {/* Position */}
                        <span className="font-mono text-xs text-muted w-14 text-center hidden md:block">
                          {prospect.position}
                        </span>

                        {/* Pro comp */}
                        <span className="font-body text-xs text-muted italic truncate w-32 hidden lg:block">
                          {prospect.proComp || "—"}
                        </span>

                        {/* Consensus rank */}
                        <span className="font-mono text-xs text-muted w-8 text-right">
                          #{prospect.rank}
                        </span>

                        {/* ESPN pick probability */}
                        {(() => {
                          const prob = getPickProb(slot.pick, prospect.name);
                          return (
                            <span
                              className={`font-mono text-xs w-12 text-right ${
                                prob >= 20
                                  ? "text-green"
                                  : prob >= 10
                                    ? "text-amber"
                                    : prob > 0
                                      ? "text-muted"
                                      : "text-muted/50"
                              }`}
                            >
                              {prob > 0 ? `${prob}%` : "—"}
                            </span>
                          );
                        })()}

                        {/* Reach/Value badge */}
                        <span
                          className={`font-condensed text-xs font-bold uppercase w-16 text-center ${
                            rankDiff > 8
                              ? "text-red"
                              : rankDiff > 3
                                ? "text-red/70"
                                : rankDiff < -8
                                  ? "text-green"
                                  : rankDiff < -3
                                    ? "text-green/70"
                                    : "text-amber"
                          }`}
                        >
                          {rankDiff > 8
                            ? "REACH"
                            : rankDiff > 3
                              ? "REACH"
                              : rankDiff < -8
                                ? "STEAL"
                                : rankDiff < -3
                                  ? "VALUE"
                                  : "BPA"}
                        </span>

                        {/* Need match */}
                        <span className="font-condensed text-xs font-bold uppercase w-12 text-center">
                          {needsMatch ? <span className="text-amber">NEED</span> : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-14 shrink-0 hidden md:block" />
                        <span className="w-32 shrink-0 hidden lg:block" />
                        <span className="w-8 shrink-0" />
                        <span className="w-12 shrink-0" />
                        <span className="w-16 shrink-0" />
                        <span className="w-12 shrink-0" />
                      </>
                    )}
                  </div>

                  {/* Status indicator */}
                  {pick ? (
                    <span className="text-green text-sm w-5 text-center shrink-0">✓</span>
                  ) : (
                    <span className="text-muted text-sm w-5 text-center shrink-0">›</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Submit */}
          {!locked && (
            <button
              onClick={handleSubmit}
              className={`mt-4 w-full font-condensed font-bold uppercase tracking-wide py-3 rounded transition-all ${
                submitted
                  ? "bg-green/20 border border-green text-green hover:bg-green/30"
                  : "bg-amber text-bg hover:brightness-110"
              }`}
            >
              {submitted ? "\u2713 BRACKET SUBMITTED — TAP TO UPDATE" : "SUBMIT BRACKET"}
            </button>
          )}
        </div>

        {/* Reference Panel — desktop sidebar, mobile toggle */}
        <button
          onClick={() => setShowReference(!showReference)}
          className="lg:hidden fixed bottom-4 right-4 z-20 bg-amber text-bg font-condensed font-bold px-4 py-2 rounded-full shadow-lg"
        >
          {showReference ? "CLOSE" : "BIG BOARD"}
        </button>

        <div
          className={`${
            showReference ? "fixed inset-0 z-30 bg-bg/95 pt-16" : "hidden"
          } lg:block lg:static lg:w-72 lg:border-l lg:border-border overflow-auto`}
        >
          <div className="p-4">
            <h2 className="font-display text-lg text-amber mb-3 tracking-wide">
              CONSENSUS BOARD
            </h2>
            <div className="space-y-0.5">
              {PROSPECTS.map((p, idx) => {
                const showTierBreak = idx === 5 || idx === 15 || idx === 32;
                const selected = selectedPlayers.has(p.name);
                return (
                  <div key={p.rank}>
                    {showTierBreak && (
                      <div className="border-t border-border-bright my-1.5 pt-1">
                        <span className="font-condensed text-xs text-amber-dim uppercase">
                          {idx === 5 ? "TIER 2" : idx === 15 ? "TIER 3" : "DAY 2"}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-baseline gap-2 text-xs font-mono py-0.5 ${
                        selected
                          ? "text-muted line-through opacity-50"
                          : p.rank <= 5
                            ? "text-white font-bold"
                            : p.rank <= 15
                              ? "text-white"
                              : "text-white/70"
                      }`}
                    >
                      <span className={`w-6 text-right ${
                        selected ? "text-muted" : p.rank <= 5 ? "text-amber" : "text-muted"
                      }`}>
                        {p.rank}
                      </span>
                      <span className="flex-1">{p.name}</span>
                      <span className="text-muted">{p.position}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Mobile close */}
          {showReference && (
            <button
              onClick={() => setShowReference(false)}
              className="lg:hidden fixed top-4 right-4 z-40 text-amber font-mono text-xl"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Player Selection Panel */}
      {activeSlot !== null && (
        <PlayerSelectionPanel
          slot={DRAFT_ORDER[activeSlot]}
          selectedPlayers={selectedPlayers}
          currentPick={picks[activeSlot]?.playerName ?? null}
          onSelect={(name) => handlePickSelect(activeSlot, name)}
          onClear={() => handlePickClear(activeSlot)}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* Commissioner: Start Draft */}
      {session.isCommissioner && (
        <button
          onClick={() => setShowStartConfirm(true)}
          className="fixed bottom-4 left-4 z-20 bg-green text-bg font-condensed font-bold uppercase px-6 py-3 rounded-full shadow-lg hover:brightness-110 transition-all"
        >
          START DRAFT
        </button>
      )}

      {showStartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-green rounded-xl p-6 max-w-sm w-full">
            <p className="font-display text-xl text-green mb-2">GO LIVE?</p>
            <p className="font-condensed text-white mb-4">
              This will lock all brackets and start the live draft. Everyone in the room will be moved to the draft screen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!roomCode) return;
                  await updateRoomStatus(roomCode, "live");
                  setShowStartConfirm(false);
                }}
                className="flex-1 bg-green text-bg font-condensed font-bold uppercase py-2.5 rounded"
              >
                GO LIVE
              </button>
              <button
                onClick={() => setShowStartConfirm(false)}
                className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase py-2.5 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
