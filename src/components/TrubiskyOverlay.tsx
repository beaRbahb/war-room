import { useEffect, useState } from "react";
import trubiskyImg from "../assets/images/trubisky.jpg";

interface TrubiskyOverlayProps {
  onComplete: () => void;
}

/**
 * Full-screen Trubisky overlay. Pure vibes, no gameplay impact.
 * Shake → reveal with headshot + text → auto-dismiss after 4s.
 */
export default function TrubiskyOverlay({ onComplete }: TrubiskyOverlayProps) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Background */}
      <div
        className={`absolute inset-0 bg-bears-navy ${
          phase === "shake" ? "animate-trubisky-shake" : ""
        }`}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {phase === "shake" && (
          <div className="animate-pulse">
            <p className="font-mono text-2xl text-bears-orange font-bold">
              OH NO
            </p>
          </div>
        )}

        {phase === "reveal" && (
          <div className="animate-fade-in-up">
            <img
              src={trubiskyImg}
              alt="Mitchell Trubisky"
              className="w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-bears-orange mx-auto mb-4 object-cover bg-surface"
            />
            <p className="font-display text-5xl sm:text-7xl text-bears-orange tracking-wider leading-none">
              MITCHELL TRUBISKY
            </p>
            <p className="font-condensed text-xl sm:text-2xl text-white mt-3 tracking-wide">
              2017 NFL Draft &middot; Pick #2
            </p>
            <p className="font-mono text-sm text-muted mt-2">
              (Mahomes went #10 &middot; Watson went #12)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
