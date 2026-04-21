import { useRef, useState } from "react";
import RoomRecap from "./RoomRecap";
import WinnerCard from "./WinnerCard";
import type { PersonaType } from "../../lib/personas";
import type { UserRecapStats, RoomRecapStats } from "../../lib/recap";
import type { ConfirmedPick, LeaderboardEntry } from "../../types";
import { buildDraftJSON, downloadJSON, captureAndShareCard } from "../../lib/exportDraft";

interface RecapOverlayProps {
  recapData: {
    users: UserRecapStats[];
    room: RoomRecapStats;
    entries: LeaderboardEntry[];
    bracketWinner: UserRecapStats | null;
    liveWinner: UserRecapStats | null;
  };
  personas: Record<string, PersonaType>;
  roomCode: string;
  confirmedPicks: ConfirmedPick[];
  onClose: () => void;
}

type SharingCard = "room" | "bracket" | "live" | null;

export default function RecapOverlay({ recapData, personas, roomCode, confirmedPicks, onClose }: RecapOverlayProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [sharingCard, setSharingCard] = useState<SharingCard>(null);

  async function handleShare(card: "room" | "bracket" | "live") {
    if (sharingCard) return; // guard against double-click
    const refs = { room: roomRef, bracket: bracketRef, live: liveRef };
    const el = refs[card].current;
    if (!el) return;
    setSharingCard(card);
    try {
      const filename = `war-room-${roomCode.toLowerCase()}-${card}`;
      await captureAndShareCard(el, filename);
    } catch (err) {
      console.error("[RecapOverlay] share failed:", err);
    } finally {
      setSharingCard(null);
    }
  }

  function handleExportJSON() {
    const data = buildDraftJSON(roomCode, recapData, confirmedPicks, personas);
    downloadJSON(data);
  }

  return (
    <div className="fixed inset-0 z-[90] bg-bg/95 overflow-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="font-display text-2xl text-amber tracking-wide">DRAFT RECAP</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="font-condensed text-[13px] font-bold uppercase tracking-wider text-amber bg-transparent border border-amber/40 px-3.5 py-1.5 rounded-md hover:bg-amber/10 hover:border-amber transition-all"
          >
            ⬇ EXPORT JSON
          </button>
          <button onClick={onClose} className="text-muted hover:text-white font-mono text-sm">
            CLOSE
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="p-4 sm:p-5 flex flex-wrap gap-5 justify-center">
        {/* Room summary card */}
        <RoomRecap
          stats={recapData.room}
          entries={recapData.entries}
          roomCode={roomCode}
          cardRef={roomRef}
          onShare={() => handleShare("room")}
          isSharing={sharingCard === "room"}
        />

        {/* Bracket winner card */}
        {recapData.bracketWinner && (
          <WinnerCard
            stats={recapData.bracketWinner}
            category="bracket"
            persona={personas[recapData.bracketWinner.name]}
            roomCode={roomCode}
            cardRef={bracketRef}
            onShare={() => handleShare("bracket")}
            isSharing={sharingCard === "bracket"}
          />
        )}

        {/* Live winner card */}
        {recapData.liveWinner && (
          <WinnerCard
            stats={recapData.liveWinner}
            category="live"
            persona={personas[recapData.liveWinner.name]}
            roomCode={roomCode}
            cardRef={liveRef}
            onShare={() => handleShare("live")}
            isSharing={sharingCard === "live"}
          />
        )}
      </div>
    </div>
  );
}
