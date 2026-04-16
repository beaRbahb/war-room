import { useState, useEffect } from "react";
import { DRAFT_COUNTDOWN_WARNING_SECONDS } from "../data/scoring";

interface DraftCountdownBannerProps {
  draftStartsAt: string;
  onExpired: () => void;
}

export default function DraftCountdownBanner({ draftStartsAt, onExpired }: DraftCountdownBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const target = new Date(draftStartsAt).getTime();
    return Math.max(0, Math.ceil((target - Date.now()) / 1000));
  });

  useEffect(() => {
    const target = new Date(draftStartsAt).getTime();

    function tick() {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        onExpired();
      }
    }

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [draftStartsAt, onExpired]);

  if (secondsLeft <= 0) return null;

  const isWarning = secondsLeft <= DRAFT_COUNTDOWN_WARNING_SECONDS;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, "0")}`;

  return (
    <div
      className={`px-4 py-3 text-center border-b transition-colors ${
        isWarning
          ? "bg-red/10 border-red animate-flash-red"
          : "bg-amber/10 border-amber"
      }`}
    >
      <p
        className={`font-condensed text-sm uppercase tracking-wide font-bold ${
          isWarning ? "text-red" : "text-amber"
        }`}
      >
        {isWarning ? "BRACKETS LOCKING" : "DRAFT STARTING"}
      </p>
      <p
        className={`font-mono text-3xl font-bold ${
          isWarning ? "text-red" : "text-amber"
        }`}
      >
        {timeStr}
      </p>
      <p className="font-condensed text-xs text-muted mt-1">
        Your bracket will auto-submit when time runs out
      </p>
    </div>
  );
}
