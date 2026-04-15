import { useEffect, useState } from "react";

interface BearsModeProps {
  /** Called when the Bears mode animation completes */
  onComplete: () => void;
}

/**
 * Full-screen Bears mode takeover.
 * Navy/orange flash → "DA BEARS" title → auto-dismiss.
 */
export default function BearsMode({ onComplete }: BearsModeProps) {
  const [phase, setPhase] = useState<"flash" | "title" | "done">("flash");

  useEffect(() => {
    // Flash phase: 1.8s (3 × 0.6s animation)
    const t1 = setTimeout(() => setPhase("title"), 1800);
    // Title phase: 1.5s
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
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
            <div className="mt-4 flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="text-4xl"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {"\u{1F43B}"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
