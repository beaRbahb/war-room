import { useState } from "react";
import { TEAMS } from "../../data/teams";

interface ReassignTeamModalProps {
  pickNumber: number;
  currentTeamAbbrev: string;
  onReassign: (pickNum: number, newAbbrev: string) => void;
  onClose: () => void;
}

export default function ReassignTeamModal({
  pickNumber,
  currentTeamAbbrev,
  onReassign,
  onClose,
}: ReassignTeamModalProps) {
  const [search, setSearch] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-white/30 rounded-t-xl sm:rounded-xl p-4 w-full sm:max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-display text-lg text-white">
              REASSIGN PICK #{pickNumber}
            </p>
            <p className="font-mono text-xs text-muted">
              Current: {currentTeamAbbrev}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams..."
          autoFocus
          className="w-full bg-bg border border-border rounded px-2 py-1.5 text-white font-mono text-xs focus:border-amber focus:outline-none mb-2"
        />
        <div className="flex-1 overflow-auto min-h-0">
          {Object.entries(TEAMS)
            .filter(([abbrev, info]) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return abbrev.toLowerCase().includes(q) || info.name.toLowerCase().includes(q);
            })
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([abbrev, info]) => (
              <button
                key={abbrev}
                onClick={() => onReassign(pickNumber, abbrev)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-elevated transition-colors ${
                  currentTeamAbbrev === abbrev ? "bg-amber/10 text-amber" : "text-white"
                }`}
              >
                <img src={info.logo} alt={abbrev} className="w-6 h-6 object-contain shrink-0" />
                <span className="font-condensed text-sm uppercase w-10 shrink-0">{abbrev}</span>
                <span className="font-mono text-xs text-muted truncate">{info.name}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
