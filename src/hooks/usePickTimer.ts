import { useState, useEffect } from "react";
import { GUESS_WINDOW_SECONDS, FLASH_WARNING_SECONDS } from "../data/scoring";

/**
 * Countdown timer for the pick window.
 * Ticks every 200ms while the window is open.
 */
export function usePickTimer(
  windowOpenedAt: string | null,
  windowOpen: boolean,
): { timeLeft: number; isWarning: boolean } {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!windowOpen || !windowOpenedAt) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [windowOpen, windowOpenedAt]);

  const timeLeft =
    !windowOpen || !windowOpenedAt
      ? GUESS_WINDOW_SECONDS
      : Math.ceil(
          Math.min(
            GUESS_WINDOW_SECONDS,
            Math.max(
              0,
              GUESS_WINDOW_SECONDS -
                (now - new Date(windowOpenedAt).getTime()) / 1000,
            ),
          ),
        );

  const isWarning = windowOpen && timeLeft <= FLASH_WARNING_SECONDS;

  return { timeLeft, isWarning };
}
