import { useState, useEffect } from "react";
import { BRACKET_LOCK_TIME } from "../data/scoring";

interface BracketShareModalProps {
  roomCode: string;
  onClose: () => void;
  /** Show room-created messaging instead of bracket-submitted */
  isRoomCreation?: boolean;
}

/** Formats a countdown string from now until the target date */
function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "DRAFT NIGHT IS HERE";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m ${secs}s`;
}

export default function BracketShareModal({ roomCode, onClose, isRoomCreation }: BracketShareModalProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(BRACKET_LOCK_TIME));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(BRACKET_LOCK_TIME));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const shareUrl = `${window.location.origin}/join/${roomCode}`;

  async function handleShare() {
    const shareData = {
      title: "Join my War Room draft!",
      text: "Predict Round 1 of the NFL Draft.",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share — no-op
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full text-center space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Check icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-green/10 border border-green/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="font-display text-3xl text-amber tracking-wide">
          {isRoomCreation ? "ROOM CREATED" : "BRACKET LOCKED IN"}
        </h2>

        {/* Subtitle */}
        <p className="font-condensed text-sm text-muted leading-relaxed">
          {isRoomCreation
            ? "Invite your group before draft night. Share the link — they just enter their name."
            : "Get your group in before draft night. Share the link — they just enter their name."}
        </p>

        {/* Countdown */}
        <div className="bg-bg border border-border rounded px-4 py-3">
          <p className="font-condensed text-xs text-muted uppercase tracking-wide mb-1">
            Draft Night Countdown
          </p>
          <p className="font-mono text-lg text-amber tracking-wider">
            {countdown}
          </p>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full bg-amber text-bg font-condensed font-bold uppercase tracking-wide py-3 rounded hover:brightness-110 transition-all text-sm"
        >
          {copied ? "LINK COPIED!" : "SHARE INVITE"}
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full py-3 font-condensed text-sm text-muted uppercase tracking-wide hover:text-white transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
