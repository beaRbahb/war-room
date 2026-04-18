import RecapCard from "./RecapCard";
import RoomRecap from "./RoomRecap";
import type { PersonaType } from "../../lib/personas";
import type { UserRecapStats, RoomRecapStats } from "../../lib/recap";
import type { LeaderboardEntry } from "../../types";

interface RecapOverlayProps {
  recapData: {
    users: UserRecapStats[];
    room: RoomRecapStats;
    entries: LeaderboardEntry[];
  };
  personas: Record<string, PersonaType>;
  roomCode: string;
  onClose: () => void;
}

export default function RecapOverlay({ recapData, personas, roomCode, onClose }: RecapOverlayProps) {
  return (
    <div className="fixed inset-0 z-[90] bg-bg/95 overflow-auto">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="font-display text-2xl text-amber tracking-wide">DRAFT RECAP</h2>
        <button onClick={onClose} className="text-muted hover:text-white font-mono text-sm">
          CLOSE
        </button>
      </div>
      <div className="p-4 flex flex-wrap gap-4 justify-center">
        <RoomRecap stats={recapData.room} entries={recapData.entries} roomCode={roomCode} />
        {recapData.users.map((userStats) => (
          <RecapCard
            key={userStats.name}
            stats={userStats}
            persona={personas[userStats.name]}
            roomCode={roomCode}
          />
        ))}
      </div>
    </div>
  );
}
