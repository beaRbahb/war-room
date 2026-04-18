import { useEffect, useState, useRef } from "react";
import bearDownSrc from "../../assets/audio/bear-down.m4a";

/** Module-level audio ref so PickReactionScreen can stop the music */
let activeBearsAudio: HTMLAudioElement | null = null;

/** Fade out and stop the Bears mode music */
export function stopBearsAudio() {
  const audio = activeBearsAudio;
  if (!audio) return;
  const fade = setInterval(() => {
    if (audio.volume > 0.02) {
      audio.volume = Math.max(0, audio.volume - 0.02);
    } else {
      audio.pause();
      clearInterval(fade);
      activeBearsAudio = null;
    }
  }, 40);
}

interface BearsModeProps {
  /** Called when the Bears mode animation completes */
  onComplete: () => void;
}

/**
 * Full-screen Bears mode takeover.
 * Navy/orange flash → "DA BEARS" title → auto-dismiss.
 * Bear Down Chicago Bears plays quietly in the background.
 */
export default function BearsMode({ onComplete }: BearsModeProps) {
  const [phase, setPhase] = useState<"flash" | "title" | "done">("flash");
  const startedRef = useRef(false);

  // Play audio once (guard against strict mode double-play)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const audio = new Audio(bearDownSrc);
    audio.volume = 0.1;
    audio.play().catch(() => {});
    activeBearsAudio = audio;
  }, []);

  // Phase timers (must re-run on strict mode remount)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("title"), 1800);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Background flash */}
      <div
        className={`absolute inset-0 ${
          phase === "flash" ? "animate-bears-flash" : "bg-bears-navy"
        }`}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {phase === "flash" && (
          <div className="animate-pulse">
            <p className="font-mono text-2xl text-bears-orange font-bold">
              PICK INCOMING
            </p>
          </div>
        )}

        {phase === "title" && (
          <div className="animate-fade-in-up">
            <p className="font-display text-8xl sm:text-[10rem] text-bears-orange tracking-wider leading-none">
              DA BEARS
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
