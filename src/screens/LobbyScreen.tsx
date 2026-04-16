import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSession } from "../lib/session";
import { onRoomConfig, updateRoomStatus, onUsers } from "../lib/storage";
import type { RoomUser } from "../types";

export default function LobbyScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const session = getSession();
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState<Record<string, RoomUser>>({});
  const [isCommissioner, setIsCommissioner] = useState(false);

  useEffect(() => {
    if (!roomCode) return;
    return onRoomConfig(roomCode, (config) => {
      if (!config || !session) return;
      setIsCommissioner(config.commissionerId === session.id);
    });
  }, [roomCode, session?.id]);

  useEffect(() => {
    if (!roomCode) return;
    return onUsers(roomCode, setUsers);
  }, [roomCode]);

  async function handleCopy() {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select text
    }
  }

  async function handleOpenBrackets() {
    if (!roomCode) return;
    await updateRoomStatus(roomCode, "bracket");
  }

  const userList = Object.values(users);

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 scanlines">
      {/* Title */}
      <h1 className="font-display text-5xl sm:text-7xl tracking-wider text-amber mb-2 war-room-title">
        WAR ROOM
      </h1>
      <p className="font-condensed text-base text-muted tracking-wide mb-8 uppercase">
        Predict the First Round
      </p>

      {/* Room code box */}
      <button
        onClick={handleCopy}
        className={`group relative bg-surface border-2 rounded-xl px-8 py-5 mb-6 transition-all duration-300 ${
          copied
            ? "border-amber shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            : "border-border hover:border-amber/50"
        }`}
      >
        <p className="font-condensed text-xs text-muted uppercase tracking-widest mb-1">
          Room Code
        </p>
        <p className="font-mono text-4xl sm:text-5xl text-white tracking-[0.3em] font-bold">
          {roomCode}
        </p>
        <p className="font-condensed text-xs text-amber mt-2 uppercase">
          {copied ? "Copied!" : "Tap to copy"}
        </p>
      </button>

      {/* Description */}
      <div className="max-w-sm text-center mb-8">
        <p className="font-condensed text-sm text-white/70 leading-relaxed">
          Fill out your bracket before the draft starts. Predict which player
          goes to each team — earn points for exact matches and correct players.
        </p>
      </div>

      {/* Players in room */}
      {userList.length > 0 && (
        <div className="mb-8 text-center">
          <p className="font-condensed text-xs text-muted uppercase tracking-wide mb-2">
            {userList.length} {userList.length === 1 ? "Player" : "Players"} in Room
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {userList.map((u) => (
              <span
                key={u.id}
                className={`font-mono text-xs px-2 py-1 rounded ${
                  u.isCommissioner
                    ? "bg-amber/10 text-amber border border-amber/30"
                    : "bg-surface text-white/70 border border-border"
                }`}
              >
                {u.name}
                {u.isCommissioner && " ★"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Commissioner action */}
      {isCommissioner ? (
        <button
          onClick={handleOpenBrackets}
          className="bg-amber text-bg font-condensed font-bold uppercase tracking-wide px-8 py-3 rounded-full shadow-lg hover:brightness-110 transition-all text-lg"
        >
          OPEN BRACKETS
        </button>
      ) : (
        <p className="font-condensed text-sm text-muted uppercase animate-pulse">
          Waiting for commissioner to open brackets...
        </p>
      )}

      {/* Footer */}
      <p className="font-condensed text-xs text-muted/50 uppercase tracking-wide mt-12">
        Share the room code with your group
      </p>
    </div>
  );
}
