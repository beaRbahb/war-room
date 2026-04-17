import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { MAX_ROOM_PLAYERS } from "../data/scoring";
import { BRACKET_LOCK_TIME } from "../data/scoring";
import { createRoom, addUser, getRoom, getUsers } from "../lib/storage";
import { onAuthError } from "../lib/firebase";
import { saveSession, generateUserId } from "../lib/session";
import type { RoomConfig, RoomUser } from "../types";
import TecmoCanvas from "../components/ui/TecmoCanvas";

/** Only allow letters, numbers, hyphens, underscores in room codes (Firebase-safe) */
const ROOM_CODE_REGEX = /^[A-Z0-9_-]+$/;

export default function JoinScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const kicked = (location.state as { kicked?: boolean })?.kicked === true;
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState(urlRoomCode?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => onAuthError(setAuthError), []);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Enter a room code");
      return;
    }
    const code = roomCode.trim().toUpperCase();
    if (!ROOM_CODE_REGEX.test(code)) {
      setError("Room code can only contain letters, numbers, hyphens, and underscores");
      return;
    }
    setLoading(true);
    setError("");

    try {

      // Check if room already exists
      const existing = await getRoom(code);
      if (existing) {
        setError("Room already exists — pick a different code");
        setLoading(false);
        return;
      }
      const userId = generateUserId();

      const config: RoomConfig = {
        roomCode: code,
        commissionerId: userId,
        commissionerName: name.trim(),
        lockTime: BRACKET_LOCK_TIME.toISOString(),
        status: "bracket",
        createdAt: new Date().toISOString(),
      };

      const user: RoomUser = {
        name: name.trim(),
        id: userId,
        joinedAt: new Date().toISOString(),
        isCommissioner: true,
        isActive: true,
      };

      await createRoom(code, config);
      await addUser(code, user);

      saveSession({
        name: name.trim(),
        id: userId,
        roomCode: code,
        isCommissioner: true,
      });

      navigate(`/room/${code}`, { state: { justCreated: true } });
    } catch (err) {
      setError("Failed to create room. Check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Enter a room code");
      return;
    }
    const code = roomCode.trim().toUpperCase();
    if (!ROOM_CODE_REGEX.test(code)) {
      setError("Room code can only contain letters, numbers, hyphens, and underscores");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const room = await getRoom(code);

      if (!room) {
        setError("Room not found");
        setLoading(false);
        return;
      }

      const users = await getUsers(code);
      const userList = Object.values(users);

      // Check if this name already exists (rejoin)
      const existing = userList.find(
        (u) => u.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (existing) {
        // Rejoin — restore session
        saveSession({
          name: existing.name,
          id: existing.id,
          roomCode: code,
          isCommissioner: existing.isCommissioner,
        });
        navigate(`/room/${code}`);
        return;
      }

      // New user
      if (userList.length >= MAX_ROOM_PLAYERS) {
        setError(`Room is full (${MAX_ROOM_PLAYERS} players max)`);
        setLoading(false);
        return;
      }

      const userId = generateUserId();
      const user: RoomUser = {
        name: name.trim(),
        id: userId,
        joinedAt: new Date().toISOString(),
        isCommissioner: false,
        isActive: true,
      };

      await addUser(code, user);

      saveSession({
        name: name.trim(),
        id: userId,
        roomCode: code,
        isCommissioner: false,
      });

      navigate(`/room/${code}`);
    } catch (err) {
      setError("Failed to join room. Check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-end pb-6 sm:justify-center sm:pb-0 px-4 bg-bg scanlines">
      {/* Tecmo Bowl background animation */}
      <TecmoCanvas />

      {/* Title */}
      <h1 className="relative z-10 font-display text-5xl sm:text-8xl tracking-wider text-amber mb-1 sm:mb-2 war-room-title">
        WAR ROOM
      </h1>
      <p className="relative z-10 font-condensed text-base sm:text-lg text-muted tracking-wide mb-4 sm:mb-10 uppercase">
        NFL Draft Companion
      </p>

      {/* Auth error banner */}
      {authError && (
        <p className="relative z-10 w-full max-w-sm bg-red/10 border border-red text-red font-condensed text-sm uppercase tracking-wide text-center py-2 rounded mb-2">
          {authError}
        </p>
      )}

      {/* Kicked banner */}
      {kicked && (
        <p className="relative z-10 w-full max-w-sm bg-red/10 border border-red text-red font-condensed text-sm uppercase tracking-wide text-center py-2 rounded mb-2">
          You were removed from the room
        </p>
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-lg p-5 sm:p-6 space-y-3 sm:space-y-4">
        {/* Name */}
        <div>
          <label className="block font-condensed text-sm text-white uppercase tracking-wide mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ICEMAN"
            maxLength={20}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            className="w-full bg-bg border border-border rounded px-3 py-2 text-white font-mono text-xs focus:border-amber focus:outline-none"
          />
        </div>

        {/* Room code */}
        <div>
          <label className="block font-condensed text-sm text-white uppercase tracking-wide mb-1">
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase())}
            placeholder="BEARS"
            maxLength={20}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            className="w-full bg-bg border border-border rounded px-3 py-2 text-white font-mono text-xs uppercase tracking-widest focus:border-amber focus:outline-none"
          />
          <p className="font-mono text-[10px] text-muted mt-1">Letters and numbers only</p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red text-sm font-condensed">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex-1 bg-amber text-bg font-condensed font-bold uppercase tracking-wide py-2.5 rounded hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? "..." : "JOIN ROOM"}
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-surface-elevated border border-border text-white font-condensed font-bold uppercase tracking-wide py-2.5 rounded hover:border-amber disabled:opacity-50 transition-all"
          >
            {loading ? "..." : "CREATE"}
          </button>
        </div>
      </div>

    </div>
  );
}
