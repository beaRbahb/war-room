import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onRoomConfig } from "../lib/storage";
import { getSession } from "../lib/session";
import DraftScreen from "./DraftScreen";
import LobbyScreen from "./LobbyScreen";

/**
 * Routes to the correct screen based on room status.
 * /room/:roomCode lands here — LobbyScreen for lobby, DraftScreen for bracket/live/done.
 */
export default function RoomRouter() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const session = getSession();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.roomCode !== roomCode) {
      navigate("/");
      return;
    }
  }, [session, roomCode, navigate]);

  useEffect(() => {
    if (!roomCode) return;
    return onRoomConfig(roomCode, (config) => {
      if (!config) {
        navigate("/");
        return;
      }
      setStatus(config.status);
    });
  }, [roomCode, navigate]);

  if (!status) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="font-mono text-amber animate-pulse">LOADING...</p>
      </div>
    );
  }

  if (status === "lobby") {
    return <LobbyScreen />;
  }

  return <DraftScreen />;
}
