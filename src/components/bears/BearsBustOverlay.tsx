import { useEffect, useState } from "react";
import type { BearsBust } from "../../data/bearsBusts";

interface BearsBustOverlayProps {
  bust: BearsBust;
  onComplete: () => void;
}

/**
 * Full-screen Bears draft bust overlay.
 * Shake → reveal with headshot + name + draft info + who they passed on → auto-dismiss.
 */
export default function BearsBustOverlay({ bust, onComplete }: BearsBustOverlayProps) {
  const [phase, setPhase] = useState<"shake" | "reveal" | "done">("shake");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 800);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className={`absolute inset-0 bg-bears-navy ${
          phase === "shake" ? "animate-trubisky-shake" : ""
        }`}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {phase === "shake" && (
          <div className="animate-pulse">
            <p className="font-mono text-2xl text-bears-orange font-bold">
              OH NO
            </p>
          </div>
        )}

        {phase === "reveal" && (
          <div className="animate-fade-in-up">
            {bust.image ? (
              <img
                src={bust.image}
                alt={bust.name}
                className="w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-bears-orange mx-auto mb-4 object-cover bg-surface"
              />
            ) : (
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-bears-orange mx-auto mb-4 bg-surface flex items-center justify-center">
                <span className="font-mono text-4xl text-bears-orange">?</span>
              </div>
            )}
            <p className="font-display text-4xl sm:text-7xl text-bears-orange tracking-wider leading-none">
              {bust.name}
            </p>
            <p className="font-condensed text-xl sm:text-2xl text-white mt-3 tracking-wide">
              {bust.year} NFL Draft &middot; Pick #{bust.pick}
            </p>
            <p className="font-mono text-sm text-muted mt-2">
              ({bust.passedOn})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
