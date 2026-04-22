import { useRef, useState } from "react";
import RoomRecap from "./RoomRecap";
import WinnerCard from "./WinnerCard";
import { PERSONA_META, type PersonaType } from "../../lib/personas";
import type { UserRecapStats, RoomRecapStats } from "../../lib/recap";
import type { ConfirmedPick, LeaderboardEntry } from "../../types";
import { buildDraftJSON, downloadJSON, copyCardImage } from "../../lib/exportDraft";
import ChaosMeter from "../chaos/ChaosMeter";

interface RecapOverlayProps {
  recapData: {
    users: UserRecapStats[];
    room: RoomRecapStats;
    entries: LeaderboardEntry[];
    bracketWinner: UserRecapStats | null;
    liveWinner: UserRecapStats | null;
  };
  personas: Record<string, PersonaType>;
  roomCode: string;
  confirmedPicks: ConfirmedPick[];
  onClose: () => void;
}

const COPY_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CHECK_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SAVE_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const DOWNLOAD_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function RecapOverlay({ recapData, personas, roomCode, confirmedPicks, onClose }: RecapOverlayProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [desktopTab, setDesktopTab] = useState<string>("room");
  const [copying, setCopying] = useState(false);
  const [feedback, setFeedback] = useState<{ key: string; result: "copied" | "saved" } | null>(null);

  const { room, entries, bracketWinner, liveWinner } = recapData;
  const champion = entries[0];

  const slideKeys = ["room", ...(bracketWinner ? ["bracket"] : []), ...(liveWinner ? ["live"] : [])];
  const tabKeys = ["room", ...(bracketWinner ? ["bracket"] : []), ...(liveWinner ? ["live"] : [])];

  function handleScroll() {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    setActiveSlide(Math.min(idx, slideKeys.length - 1));
  }

  function goToSlide(i: number) {
    scrollRef.current?.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: "smooth" });
  }

  function handleCopy(el: HTMLElement | null, key: string) {
    if (!el || copying) return;
    setCopying(true);
    setFeedback(null);
    copyCardImage(el)
      .then((result) => {
        setFeedback({ key, result });
        setTimeout(() => setFeedback(null), 2000);
      })
      .catch((err) => {
        console.error("[RecapOverlay] copy failed:", err);
        setFeedback({ key, result: "saved" }); // show something even on error
        setTimeout(() => setFeedback(null), 2000);
      })
      .finally(() => setCopying(false));
  }

  function handleExportJSON() {
    const data = buildDraftJSON(roomCode, recapData, confirmedPicks, personas);
    downloadJSON(data);
  }

  return (
    <div className="fixed inset-0 z-[90] bg-bg flex flex-col">
      {/* ── Header ── */}
      <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <h2 className="font-display text-2xl text-amber tracking-wide">DRAFT RECAP</h2>
        <div className="flex items-center gap-3">
          <button onClick={handleExportJSON} className="text-muted hover:text-white transition-colors p-1.5" title="Download results JSON">
            {DOWNLOAD_ICON}
          </button>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none px-1">✕</button>
        </div>
      </div>

      {/* ── Mobile: Swipe Cards ── */}
      <div className="md:hidden flex-1 flex flex-col min-h-0">
        {/* Dots */}
        <div className="flex justify-center gap-2 pt-3 pb-2 shrink-0">
          {slideKeys.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeSlide ? "w-6 bg-amber" : "w-2 bg-border-bright"
              }`}
            />
          ))}
        </div>

        {/* Swipe container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {/* Room slide */}
          <div className="w-full shrink-0 snap-start px-4 pb-4 overflow-y-auto">
            <div className="relative">
              <CopyBadge onClick={() => handleCopy(roomRef.current, "room")} copying={copying} feedback={feedback?.key === "room" ? feedback.result : null} />
              <RoomRecap stats={room} entries={entries} roomCode={roomCode} cardRef={roomRef} />
            </div>
          </div>

          {/* Bracket slide */}
          {bracketWinner && (
            <div className="w-full shrink-0 snap-start px-4 pb-4 overflow-y-auto">
              <div className="relative">
                <CopyBadge onClick={() => handleCopy(bracketRef.current, "bracket")} copying={copying} feedback={feedback?.key === "bracket" ? feedback.result : null} />
                <WinnerCard stats={bracketWinner} category="bracket" persona={personas[bracketWinner.name]} roomCode={roomCode} cardRef={bracketRef} />
              </div>
            </div>
          )}

          {/* Live slide */}
          {liveWinner && (
            <div className="w-full shrink-0 snap-start px-4 pb-4 overflow-y-auto">
              <div className="relative">
                <CopyBadge onClick={() => handleCopy(liveRef.current, "live")} copying={copying} feedback={feedback?.key === "live" ? feedback.result : null} />
                <WinnerCard stats={liveWinner} category="live" persona={personas[liveWinner.name]} roomCode={roomCode} cardRef={liveRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: Trophy Layout ── */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* Left: Hero + Podium */}
        <div className="flex-1 flex flex-col items-center justify-center border-r border-border overflow-auto px-8 py-6">
          <div ref={heroRef} className="flex flex-col items-center">
            <div className="text-5xl mb-2">🏆</div>
            <p className="font-condensed text-xs font-bold uppercase tracking-[4px] text-amber">Overall Champion</p>
            <p className="font-display text-6xl text-white leading-none mt-1">
              {champion?.name.toUpperCase() ?? "—"}
            </p>

            {champion && (
              <div className="flex gap-8 mt-4">
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-amber">{champion.totalScore}</p>
                  <p className="font-condensed text-[10px] uppercase tracking-[2px] text-muted">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-white">{champion.bracketScore}</p>
                  <p className="font-condensed text-[10px] uppercase tracking-[2px] text-muted">Bracket</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-white">{champion.liveScore}</p>
                  <p className="font-condensed text-[10px] uppercase tracking-[2px] text-muted">Live</p>
                </div>
              </div>
            )}

            {/* Podium */}
            {entries.length >= 2 && (
              <div className="flex gap-2 mt-8 items-end justify-center">
                <div className="text-center w-28">
                  <div className="bg-surface border border-border rounded-t-lg p-3" style={{ minHeight: 80 }}>
                    <p className="font-display text-3xl text-[#aaa]">2</p>
                    <p className="font-condensed text-xs font-bold text-white truncate">{entries[1].name}</p>
                    <p className="font-mono text-sm font-bold text-amber">{entries[1].totalScore}</p>
                  </div>
                </div>
                <div className="text-center w-28">
                  <div className="bg-surface border border-amber rounded-t-lg p-3" style={{ minHeight: 110, background: "rgba(245,166,35,0.04)" }}>
                    <p className="font-display text-3xl text-amber">1</p>
                    <p className="font-condensed text-xs font-bold text-white truncate">{entries[0].name}</p>
                    <p className="font-mono text-sm font-bold text-amber">{entries[0].totalScore}</p>
                  </div>
                </div>
                {entries.length >= 3 && (
                  <div className="text-center w-28">
                    <div className="bg-surface border border-border rounded-t-lg p-3" style={{ minHeight: 60 }}>
                      <p className="font-display text-3xl text-[#8b6914]">3</p>
                      <p className="font-condensed text-xs font-bold text-white truncate">{entries[2].name}</p>
                      <p className="font-mono text-sm font-bold text-amber">{entries[2].totalScore}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copy hero */}
          <button
            onClick={() => handleCopy(heroRef.current, "hero")}
            disabled={copying}
            className="mt-6 font-condensed text-xs font-bold uppercase tracking-wider text-muted border border-border rounded-md px-4 py-2 hover:text-amber hover:border-amber/40 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {feedback?.key === "hero"
              ? <>{feedback.result === "copied" ? CHECK_ICON : SAVE_ICON} {feedback.result === "copied" ? "COPIED!" : "SAVED!"}</>
              : <>{COPY_ICON} {copying ? "CAPTURING..." : "COPY IMAGE"}</>
            }
          </button>
        </div>

        {/* Right: Tabbed Stats + Standings */}
        <div className="w-[340px] overflow-y-auto p-5">
          <div className="flex border-b border-border mb-4">
            {tabKeys.map((key) => (
              <button
                key={key}
                onClick={() => setDesktopTab(key)}
                className={`flex-1 text-center font-condensed text-xs font-bold uppercase tracking-[2px] py-2.5 border-b-2 transition-all ${
                  desktopTab === key ? "text-amber border-amber" : "text-muted border-transparent hover:text-white"
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          {desktopTab === "room" && <RoomTabContent room={room} />}
          {desktopTab === "bracket" && bracketWinner && (
            <WinnerTabContent stats={bracketWinner} category="bracket" persona={personas[bracketWinner.name]} />
          )}
          {desktopTab === "live" && liveWinner && (
            <WinnerTabContent stats={liveWinner} category="live" persona={personas[liveWinner.name]} />
          )}

          <p className="font-condensed text-xs font-bold uppercase tracking-[2px] text-muted mt-6 mb-2">All Players</p>
          {entries.map((entry, i) => (
            <div key={entry.name} className="flex items-center justify-between bg-bg border border-border rounded px-3 py-1.5 mb-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted w-5 text-right">{i + 1}.</span>
                <span className="font-condensed text-sm text-white font-bold">{entry.name}</span>
              </div>
              <span className="font-mono text-sm text-amber font-bold">{entry.totalScore}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */

/** Small copy button pinned to top-right corner of a card. */
function CopyBadge({ onClick, copying, feedback }: { onClick: () => void; copying: boolean; feedback: "copied" | "saved" | null }) {
  return (
    <button
      onClick={onClick}
      disabled={copying}
      className={`absolute top-2 right-2 z-10 p-2 rounded-lg transition-all ${
        feedback
          ? "bg-green/20 text-green"
          : "bg-bg/80 text-muted hover:text-amber backdrop-blur-sm"
      } disabled:opacity-50`}
      title="Save card image"
    >
      {feedback ? (feedback === "copied" ? CHECK_ICON : SAVE_ICON) : COPY_ICON}
    </button>
  );
}

function RoomTabContent({ room }: { room: RoomRecapStats }) {
  return (
    <div>
      <DesktopStatRow label="Room Accuracy" value={`${room.roomAccuracy}%`} color="text-amber" />
      <DesktopStatRow label="Surprise Picks" value={String(room.surprisePicks)} color="text-amber" />
      <DesktopStatRow label="Avg Chaos" value={String(room.avgChaos)} color="text-bears-orange" />
      {room.mostChaosPick && (
        <div className="flex items-center justify-between bg-bg border border-border rounded-lg px-3 py-2.5 mt-3">
          <div>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">Most Chaotic</p>
            <p className="font-mono text-xs text-white">#{room.mostChaosPick.pick.pick} {room.mostChaosPick.pick.playerName}</p>
          </div>
          <ChaosMeter slot={room.mostChaosPick.pick.pick} playerName={room.mostChaosPick.pick.playerName} />
        </div>
      )}
      {room.mostChalkPick && (
        <div className="flex items-center justify-between bg-bg border border-border rounded-lg px-3 py-2.5 mt-2">
          <div>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">Most Chalk</p>
            <p className="font-mono text-xs text-white">#{room.mostChalkPick.pick.pick} {room.mostChalkPick.pick.playerName}</p>
          </div>
          <ChaosMeter slot={room.mostChalkPick.pick.pick} playerName={room.mostChalkPick.pick.playerName} />
        </div>
      )}
    </div>
  );
}

function WinnerTabContent({ stats, category, persona }: { stats: UserRecapStats; category: "bracket" | "live"; persona?: PersonaType }) {
  const isBracket = category === "bracket";
  const accuracy = stats.liveTotal > 0
    ? Math.round(((isBracket ? stats.bracketPlayersCorrect : stats.liveCorrect) / stats.liveTotal) * 100)
    : 0;
  const bestCall = isBracket ? stats.bestBracketCall : stats.bestCall;
  const personaMeta = persona ? PERSONA_META[persona] : null;

  return (
    <div>
      <div className="mb-3">
        <p className="font-condensed text-xs font-bold uppercase tracking-[2px] text-amber mb-0.5">
          {isBracket ? "Bracket Winner" : "Live Winner"}
        </p>
        <p className="font-display text-2xl text-white">{stats.name.toUpperCase()}</p>
        {personaMeta && (
          <p className="font-condensed text-xs uppercase tracking-wider text-amber/60">{personaMeta.label}</p>
        )}
      </div>

      {isBracket ? (
        <>
          <DesktopStatRow label="Players Correct" value={`${stats.bracketPlayersCorrect}/${stats.liveTotal}`} color="text-white" />
          <DesktopStatRow label="Exact Slot Hits" value={String(stats.bracketExactSlots)} color="text-green" />
          <DesktopStatRow label="Accuracy" value={`${accuracy}%`} color="text-amber" />
        </>
      ) : (
        <>
          <DesktopStatRow label="Correct Picks" value={`${stats.liveCorrect}/${stats.liveTotal}`} color="text-white" />
          <DesktopStatRow label="Longest Streak" value={`${stats.longestStreak} in a row`} color="text-green" />
          <DesktopStatRow label="Accuracy" value={`${accuracy}%`} color="text-amber" />
        </>
      )}

      {bestCall && (
        <div className="flex items-center justify-between bg-green/[0.03] border border-green/12 rounded-lg px-3 py-2.5 mt-3">
          <div>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-green mb-0.5">
              {isBracket ? "Best Bracket Call" : "Best Live Call"}
            </p>
            <p className="font-mono text-xs font-bold text-green">
              #{bestCall.pick.pick} {bestCall.pick.playerName} → {bestCall.pick.teamAbbrev}
            </p>
          </div>
          <ChaosMeter slot={bestCall.pick.pick} playerName={bestCall.pick.playerName} />
        </div>
      )}

      {stats.bearsPrediction && (
        <div className="bg-bears-navy/30 border border-bears-orange/30 rounded-lg px-3 py-2.5 mt-2">
          <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-bears-orange mb-1">
            Bears Pick #25 — {isBracket ? "Bracket" : "Live"}
          </p>
          <p className="font-mono text-xs text-white">
            Predicted: {isBracket ? stats.bearsPrediction.bracketPick : stats.bearsPrediction.livePick}
          </p>
        </div>
      )}
    </div>
  );
}

function DesktopStatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-b-0">
      <span className="font-condensed text-[13px] uppercase tracking-wider text-muted">{label}</span>
      <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
