import { useEffect, useState, useRef } from "react";
import bearDownSrc from "../../assets/audio/bear-down.m4a";
import type { BlockbusterTradePlayer } from "../../data/blockbusterTrades";

/** Module-level audio ref so other components can stop the music */
let activeAudio: HTMLAudioElement | null = null;

/** Fade out and stop the blockbuster trade music */
export function stopBlockbusterAudio() {
  const audio = activeAudio;
  if (!audio) return;
  const fade = setInterval(() => {
    if (audio.volume > 0.02) {
      audio.volume = Math.max(0, audio.volume - 0.02);
    } else {
      audio.pause();
      clearInterval(fade);
      activeAudio = null;
    }
  }, 40); // ~0.5s fade
}

interface BlockbusterTradeOverlayProps {
  trade: BlockbusterTradePlayer;
  onComplete: () => void;
}

/**
 * Full-screen blockbuster trade overlay.
 * Flash (1.5s) → Reveal (2.5s) → Details (2.5s) → Celebration (1.5s) → done.
 * Plays Bear Down audio on mount, stopped via stopBlockbusterAudio() when user reacts.
 */
export default function BlockbusterTradeOverlay({ trade, onComplete }: BlockbusterTradeOverlayProps) {
  const [phase, setPhase] = useState<"flash" | "reveal" | "details" | "celebration" | "done">("flash");
  const startedRef = useRef(false);

  // Play audio on mount (breaking news screen)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const audio = new Audio(bearDownSrc);
    audio.volume = 0.1;
    audio.play().catch(() => {});
    activeAudio = audio;
  }, []);

  // Phase timers
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1500);
    const t2 = setTimeout(() => setPhase("details"), 4000);
    const t3 = setTimeout(() => setPhase("celebration"), 6500);
    const t4 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Background */}
      <div
        className={`absolute inset-0 ${
          phase === "flash"
            ? "animate-blockbuster-flash"
            : "bg-bears-navy"
        }`}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-lg">
        {/* ── Flash: Breaking News ── */}
        {phase === "flash" && (
          <div className="animate-pulse">
            <div className="bg-red px-8 py-2.5 rounded inline-block mb-3">
              <p className="font-display text-4xl sm:text-6xl text-white tracking-widest">
                BREAKING NEWS
              </p>
            </div>
            <p className="font-mono text-sm text-white/80 uppercase tracking-[0.2em]">
              Trade Alert
            </p>
          </div>
        )}

        {/* ── Reveal: Player image + name ── */}
        {phase === "reveal" && (
          <div className="animate-fade-in-up">
            {trade.image ? (
              <img
                src={trade.image}
                alt={trade.name}
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg border-4 border-bears-orange mx-auto mb-4 object-cover"
              />
            ) : (
              <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg border-4 border-bears-orange mx-auto mb-4 bg-surface flex items-center justify-center">
                <span className="font-display text-6xl text-bears-orange">
                  {trade.position}
                </span>
              </div>
            )}
            <p className="font-display text-5xl sm:text-8xl text-bears-orange tracking-wider leading-none">
              {trade.name.toUpperCase()}
            </p>
            <p className="font-condensed text-xl sm:text-2xl text-white mt-2">
              {trade.position} &middot; {trade.currentTeam}
            </p>
            <p className="font-mono text-sm text-muted mt-1">{trade.accolades}</p>
          </div>
        )}

        {/* ── Details: Trade package ── */}
        {phase === "details" && (
          <div className="animate-fade-in-up">
            {trade.image ? (
              <img
                src={trade.image}
                alt={trade.name}
                className="w-32 h-32 rounded-lg border-2 border-bears-orange mx-auto mb-3 object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-bears-orange mx-auto mb-3 bg-surface flex items-center justify-center">
                <span className="font-display text-3xl text-bears-orange">
                  {trade.position}
                </span>
              </div>
            )}
            <p className="font-display text-3xl sm:text-5xl text-bears-orange tracking-wider mb-4">
              {trade.headline}
            </p>
            <div className="bg-surface-elevated border border-bears-orange/30 rounded-lg p-4">
              <p className="font-condensed text-sm text-muted uppercase tracking-widest mb-2">
                Bears send to {trade.currentTeamAbbrev}
              </p>
              {trade.tradePackage.map((item, i) => (
                <p
                  key={i}
                  className="font-mono text-sm text-white py-1 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── Celebration: Welcome to Chicago ── */}
        {phase === "celebration" && (
          <div className="animate-fade-in-up">
            <p className="font-display text-4xl sm:text-7xl text-bears-orange tracking-wider">
              WELCOME TO CHICAGO
            </p>
            <p className="font-condensed text-xl text-white mt-3">
              {trade.name} is a Bear
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
