import { useState, useEffect } from "react";
import { onConnectionState } from "../../lib/storage";

/**
 * Shows a subtle top banner when the Firebase connection drops.
 * Automatically hides when reconnected.
 */
export default function ConnectionIndicator() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    return onConnectionState(setConnected);
  }, []);

  if (connected) return null;

  return (
    <div className="bg-red/20 border-b border-red px-4 py-1.5 text-center animate-pulse">
      <span className="font-condensed text-xs uppercase text-red tracking-wider">
        Reconnecting...
      </span>
    </div>
  );
}
