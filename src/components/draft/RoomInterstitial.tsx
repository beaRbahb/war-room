import { useEffect, useRef, useState } from "react";
import TecmoCanvas from "../ui/TecmoCanvas";

interface RoomInterstitialProps {
  mode: "creating" | "joining";
  onFadeStart: () => void;
  onComplete: () => void;
}

/**
 * Full-screen interstitial with Tecmo play animation.
 * Shows "CREATING YOUR WAR ROOM..." or "JOINING WAR ROOM..."
 * Lets one full Tecmo play run (~8.5s loop), then fades out into the lobby.
 */
export default function RoomInterstitial({ mode, onFadeStart, onComplete }: RoomInterstitialProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const onFadeStartRef = useRef(onFadeStart);
  onFadeStartRef.current = onFadeStart;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // TecmoCanvas loop is 8.5s with 0.7s fade at each end.
    // Start our fade-out at 7.5s so it overlaps with the play's natural fade-out.
    // Fire onFadeStart so the welcome screen renders behind us during the fade.
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      onFadeStartRef.current();
    }, 7500);
    const doneTimer = setTimeout(() => onCompleteRef.current(), 8200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[60] bg-bg flex flex-col items-center justify-start pt-24 sm:pt-32 transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Tecmo play animation background */}
      <TecmoCanvas />

      {/* Text overlay — top of screen */}
      <div className="relative z-10 text-center opacity-0" style={{ animation: "fade-in-up 0.6s ease-out 0.3s forwards" }}>
        <h1 className="font-display text-4xl sm:text-6xl text-amber tracking-wider war-room-title mb-3">
          {mode === "creating" ? "CREATING" : "JOINING"}
        </h1>
        <p className="font-condensed text-sm sm:text-base text-muted uppercase tracking-[0.2em]">
          {mode === "creating" ? "Your War Room..." : "War Room..."}
        </p>
      </div>
    </div>
  );
}
