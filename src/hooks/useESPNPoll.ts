import { useState, useEffect, useRef, useCallback } from "react";
import { fetchLatestESPNPick, type ESPNPick } from "../lib/espn";

const POLL_INTERVAL_MS = 10_000;

/**
 * Polls ESPN draft API for the latest confirmed pick.
 * Local state only — never writes to Firebase.
 * Only runs when `enabled` is true (commissioner's client during live draft).
 * `currentPick` seeds the scan position so cold starts skip already-confirmed picks.
 */
export function useESPNPoll(enabled: boolean, currentPick: number) {
  const [suggestion, setSuggestion] = useState<ESPNPick | null>(null);
  const lastSeenRef = useRef(Math.max(0, currentPick - 1));

  // Keep seed in sync if currentPick jumps (e.g. commissioner confirms manually)
  useEffect(() => {
    if (currentPick - 1 > lastSeenRef.current) {
      lastSeenRef.current = currentPick - 1;
    }
  }, [currentPick]);

  const poll = useCallback(async () => {
    const pick = await fetchLatestESPNPick(lastSeenRef.current);
    if (pick) {
      lastSeenRef.current = pick.overall;
      setSuggestion(pick);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, poll]);

  /** Dismiss suggestion after commissioner acts on it or skips it */
  const clearSuggestion = useCallback(() => setSuggestion(null), []);

  return { suggestion, clearSuggestion };
}
