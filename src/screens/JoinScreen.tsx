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

      if (room) {
        // ── Room exists → join it ──
        const users = await getUsers(code);
        const userList = Object.values(users);

        // Check if this name already exists (rejoin)
        const existing = userList.find(
          (u) => u.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (existing) {
          saveSession({
            name: existing.name,
            id: existing.id,
            roomCode: code,
            isCommissioner: existing.isCommissioner,
          });
          navigate(`/room/${code}`, { state: { justJoined: true } });
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

        navigate(`/room/${code}`, { state: { justJoined: true } });
      } else {
        // ── Room doesn't exist → create it ──
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
      }
    } catch (err) {
      setError("Failed to join. Check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center bg-bg scanlines">
      {/* Tecmo Bowl background animation */}
      <TecmoCanvas />

      {/* Mobile: stacked layout. Desktop: two-column, vertically centered. */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-5 sm:pb-8 min-h-[200px] md:justify-center md:pb-0 md:min-h-dvh md:w-full">
        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-center md:gap-24 lg:gap-32 md:w-full md:px-12 lg:px-20">

          {/* Left column: title + features */}
          <div className="flex flex-col items-center md:items-start md:max-w-md">
            <h1 className="font-display text-5xl sm:text-8xl tracking-wider text-amber mb-1 sm:mb-2 otc-title whitespace-nowrap">
              ON THE CLOCK
            </h1>
            <p className="hidden md:block font-condensed text-base sm:text-lg text-muted tracking-wide uppercase">
              NFL Draft Companion
            </p>

            {/* Feature strip — hidden on mobile here, shown below */}
            <div className="hidden md:flex flex-col gap-1.5 mt-6">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber opacity-60 mt-0.5">//</span>
                <span className="font-condensed text-[13px] text-muted leading-snug">
                  <strong className="text-white font-semibold">Predict every pick</strong> before the commissioner is on the clock
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber opacity-60 mt-0.5">//</span>
                <span className="font-condensed text-[13px] text-muted leading-snug">
                  <strong className="text-white font-semibold">Compete live</strong> on a real-time leaderboard as each selection drops
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber opacity-60 mt-0.5">//</span>
                <span className="font-condensed text-[13px] text-muted leading-snug">
                  <strong className="text-white font-semibold">Roast the picks</strong> between selections and vote on the best one
                </span>
              </div>
            </div>
          </div>

          {/* Right column (desktop) / bottom section (mobile): features + form */}
          <div className="flex-shrink-0 w-full md:w-[420px] md:flex-shrink-0 flex flex-col items-center md:items-stretch px-4 pb-6 sm:pb-10 md:pb-0 md:px-0">
            {/* Feature strip — mobile only */}
            <div className="md:hidden w-full max-w-sm bg-bg/80 backdrop-blur-sm rounded-lg px-4 py-3 flex flex-col gap-1.5 mb-5">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber opacity-60 mt-0.5">//</span>
                <span className="font-condensed text-[13px] text-muted leading-snug">
                  <strong className="text-white font-semibold">Predict every pick</strong> before the commissioner is on the clock
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber opacity-60 mt-0.5">//</span>
                <span className="font-condensed text-[13px] text-muted leading-snug">
                  <strong className="text-white font-semibold">Compete live</strong> on a real-time leaderboard as each selection drops
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber opacity-60 mt-0.5">//</span>
                <span className="font-condensed text-[13px] text-muted leading-snug">
                  <strong className="text-white font-semibold">Roast the picks</strong> between selections and vote on the best one
                </span>
              </div>
            </div>

            {/* Auth error banner */}
            {authError && (
              <p className="w-full max-w-sm bg-red/10 border border-red text-red font-condensed text-sm uppercase tracking-wide text-center py-2 rounded mb-2">
                {authError}
              </p>
            )}

            {/* Kicked banner */}
            {kicked && (
              <p className="w-full max-w-sm bg-red/10 border border-red text-red font-condensed text-sm uppercase tracking-wide text-center py-2 rounded mb-2">
                You were removed from the room
              </p>
            )}

            {/* Card */}
            <div className="w-full max-w-sm md:max-w-none bg-surface border border-amber rounded-lg p-5 sm:p-6 md:p-8 space-y-3 sm:space-y-4 md:space-y-5 animate-[pulse-border_2s_ease-in-out_infinite]">
              {/* Name */}
              <div>
                <label className="block font-condensed text-sm text-white uppercase tracking-wide mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=""
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
                  placeholder=""
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

              {/* Single join button */}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-amber text-bg font-condensed font-bold uppercase tracking-wide py-2.5 rounded hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {loading ? "..." : "JOIN"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
