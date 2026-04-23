import { useEffect } from "react";

interface CommissionerQuickStartProps {
  onDismiss: () => void;
}

/**
 * One-time overlay teaching the commissioner the 3-step pick cycle.
 * Matches RoomWelcome's layout pattern (grid with spacer divs).
 */
export default function CommissionerQuickStart({ onDismiss }: CommissionerQuickStartProps) {
  // Escape key dismisses
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 bg-bg/98 overflow-auto px-4">
      <div className="w-full max-w-[1060px] mx-auto py-8 md:py-12 md:min-h-full md:flex md:flex-col md:justify-center">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl sm:text-5xl text-amber tracking-wide otc-title mb-2">
            ON THE CLOCK
          </h1>
          <p className="font-condensed text-sm text-muted uppercase tracking-widest">
            Commissioner Quick Start
          </p>
        </div>

        {/* Tab preview */}
        <div className="max-w-[400px] mx-auto mb-6 opacity-0" style={{ animation: "fade-in-up 0.6s ease-out 0.1s forwards" }}>
          <div className="grid grid-cols-2 bg-surface border border-border rounded-lg overflow-hidden">
            <div className="py-2.5 text-center border-b-[3px] border-transparent text-muted">
              <span className="font-condensed text-sm uppercase">MY PICKS</span>
            </div>
            <div className="py-2.5 text-center border-b-[3px] border-amber text-amber font-bold">
              <span className="font-condensed text-sm uppercase">COMMISSIONER</span>
            </div>
          </div>
          <div className="grid grid-cols-2 mt-1.5 gap-2">
            <p className="font-condensed text-[11px] text-muted text-center leading-snug">
              Your live guesses &amp; bracket
            </p>
            <p className="font-condensed text-[11px] text-muted text-center leading-snug">
              Run the draft from here
            </p>
          </div>
        </div>

        {/* 3 step cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_48px_1fr_48px_1fr] gap-4 md:gap-0 max-w-[1000px] mx-auto items-stretch">

          {/* Card 1: START GUESSES */}
          <div
            className="bg-surface border border-border rounded-lg p-5 sm:p-[22px] flex flex-col opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.2s forwards" }}
          >
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-xs font-bold text-bg bg-amber w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
              <h2 className="font-display text-xl text-white tracking-wide">
                START GUESSES
              </h2>
            </div>

            {/* Mini hero card preview */}
            <div className="bg-bg border border-border rounded-md overflow-hidden mb-3.5 min-h-[138px] flex flex-col">
              {/* Team strip */}
              <div className="px-3.5 py-3 flex items-center gap-2 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-muted shrink-0" />
                <span className="font-condensed text-xs text-white uppercase font-semibold">RAIDERS</span>
                <span className="ml-auto font-mono text-[10px] font-bold text-bg bg-amber px-1.5 py-0.5 rounded">PICK 1</span>
              </div>
              {/* Status + button */}
              <div className="px-3.5 py-3 flex-1 flex flex-col justify-center">
                <p className="font-condensed text-[10px] text-muted uppercase tracking-wide">WINDOW</p>
                <p className="font-mono text-xl font-bold text-muted leading-tight">IDLE</p>
                <div className="mt-2.5 bg-green text-bg font-condensed font-bold uppercase text-[11px] py-1.5 rounded text-center">
                  START GUESSES
                </div>
              </div>
            </div>

            <p className="font-condensed text-[15px] text-white leading-relaxed mb-1.5">
              Open the guess window.
            </p>
            <p className="font-condensed text-[13px] text-muted leading-relaxed">
              Players have 90 seconds to lock in their prediction for this pick.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden md:block" />

          {/* Card 2: WAIT OR CLOSE EARLY */}
          <div
            className="bg-surface border border-border rounded-lg p-5 sm:p-[22px] flex flex-col opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.55s forwards" }}
          >
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-xs font-bold text-bg bg-amber w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
              <h2 className="font-display text-xl text-white tracking-wide">
                WAIT OR CLOSE EARLY
              </h2>
            </div>

            {/* Mini hero card preview */}
            <div className="bg-bg border border-amber/40 rounded-md overflow-hidden mb-3.5 min-h-[138px] flex flex-col animate-pulse-border">
              {/* Timer strip */}
              <div className="px-3.5 py-3 border-b border-border">
                <p className="font-condensed text-[10px] text-muted uppercase tracking-wide">TIME LEFT</p>
                <p className="font-mono text-xl font-bold text-amber leading-tight">0:47</p>
              </div>
              {/* Progress + button */}
              <div className="px-3.5 py-3 flex-1 flex flex-col justify-center">
                <p className="font-mono text-sm font-bold text-amber">3/5</p>
                <div className="w-full h-1 bg-border rounded-full mt-1 overflow-hidden">
                  <div className="w-[60%] h-full bg-amber rounded-full" />
                </div>
                <div className="mt-2.5 bg-red text-white font-condensed font-bold uppercase text-[11px] py-1.5 rounded text-center">
                  CLOSE GUESSES
                </div>
              </div>
            </div>

            <p className="font-condensed text-[15px] text-white leading-relaxed mb-1.5">
              Watch guesses come in live.
            </p>
            <p className="font-condensed text-[13px] text-muted leading-relaxed">
              Timer auto-closes at 0:00, or close early once everyone's locked in.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden md:block" />

          {/* Card 3: CONFIRM THE PICK */}
          <div
            className="bg-surface border border-border rounded-lg p-5 sm:p-[22px] flex flex-col opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.9s forwards" }}
          >
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-xs font-bold text-bg bg-amber w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
              <h2 className="font-display text-xl text-white tracking-wide">
                CONFIRM THE PICK
              </h2>
            </div>

            {/* Mini hero card preview */}
            <div className="bg-bg border border-border rounded-md overflow-hidden mb-3.5 min-h-[138px] flex flex-col">
              {/* Search */}
              <div className="px-3 py-2 border-b border-border">
                <div className="bg-surface border border-border rounded px-2.5 py-1.5 font-mono text-[11px] text-white">
                  Cam W
                </div>
              </div>
              {/* Player list */}
              <div className="px-2 py-1.5 space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green/10">
                  <span className="text-muted font-mono text-[10px]">#1</span>
                  <span className="font-mono text-[11px] text-green font-semibold">Cam Ward</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded">
                  <span className="text-muted font-mono text-[10px]">#12</span>
                  <span className="font-mono text-[11px] text-white/60">Cameron Williams</span>
                </div>
              </div>
              {/* Confirm button */}
              <div className="px-3 py-2 border-t border-border">
                <div className="bg-green text-bg font-condensed font-bold uppercase text-[11px] py-1.5 rounded text-center">
                  CONFIRM PICK: CAM WARD
                </div>
              </div>
            </div>

            <p className="font-condensed text-[15px] text-white leading-relaxed mb-1.5">
              Enter the real NFL pick.
            </p>
            <p className="font-condensed text-[13px] text-muted leading-relaxed">
              Search for the player, select them, and confirm. Scores update instantly for everyone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center mt-8 opacity-0"
          style={{ animation: "fade-in-up 0.6s ease-out 1.1s forwards" }}
        >
          <p className="font-condensed text-sm text-muted mb-4">
            Switch to <span className="text-white font-semibold">MY PICKS</span> anytime to make your own guesses.
          </p>
          <button
            onClick={onDismiss}
            className="bg-amber text-bg font-condensed font-bold uppercase tracking-wide text-sm px-8 py-3 rounded-md hover:brightness-110 transition-all"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
