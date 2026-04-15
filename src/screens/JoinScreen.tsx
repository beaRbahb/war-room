import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomCode, MAX_ROOM_PLAYERS } from "../data/scoring";
import { BRACKET_LOCK_TIME } from "../data/scoring";
import { createRoom, addUser, getRoom, getUsers } from "../lib/storage";
import { saveSession, generateUserId } from "../lib/session";
import type { RoomConfig, RoomUser } from "../types";
import TecmoCanvas from "../components/TecmoCanvas";

export default function JoinScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const code = generateRoomCode();
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

      navigate(`/room/${code}`);
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
    setLoading(true);
    setError("");

    try {
      const code = roomCode.trim().toUpperCase();
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
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 bg-bg scanlines">
      {/* Tecmo Bowl background animation */}
      <TecmoCanvas />

      {/* Title */}
      <h1 className="relative z-10 font-display text-6xl sm:text-8xl tracking-wider text-amber mb-2 war-room-title">
        WAR ROOM
      </h1>
      <p className="relative z-10 font-condensed text-lg text-muted tracking-wide mb-10 uppercase">
        NFL Draft Companion
      </p>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-lg p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block font-condensed text-sm text-muted uppercase tracking-wide mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Da Coach"
            maxLength={20}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-white font-mono text-sm focus:border-amber focus:outline-none"
          />
        </div>

        {/* Room code */}
        <div>
          <label className="block font-condensed text-sm text-muted uppercase tracking-wide mb-1">
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. B3ARS7"
            maxLength={6}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-white font-mono text-sm uppercase tracking-widest focus:border-amber focus:outline-none"
          />
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
