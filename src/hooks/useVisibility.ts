import { useEffect, useRef, useState } from "react";

interface VisibilityToast {
  missedPicks: number;
  currentPick: number;
}

/**
 * Tracks tab visibility. On return from background, compares
 * current pick number to the one seen when the tab was hidden.
 * Returns a toast object (auto-dismisses after 4s) if picks were missed.
 */
export function useVisibility(currentPick: number | null) {
  const pickOnHide = useRef<number | null>(null);
  const [toast, setToast] = useState<VisibilityToast | null>(null);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        // Tab going to background — snapshot current pick
        pickOnHide.current = currentPick;
      } else {
        // Tab returning to foreground
        if (
          pickOnHide.current !== null &&
          currentPick !== null &&
          currentPick > pickOnHide.current
        ) {
          const missed = currentPick - pickOnHide.current;
          setToast({ missedPicks: missed, currentPick });
        }
        pickOnHide.current = null;
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [currentPick]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  return { toast, dismissToast: () => setToast(null) };
}
