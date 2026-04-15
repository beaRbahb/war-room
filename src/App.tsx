import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinScreen from "./screens/JoinScreen";
import RoomRouter from "./screens/RoomRouter";
import LiveDraftScreen from "./screens/LiveDraftScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinScreen />} />
        <Route path="/room/:roomCode" element={<RoomRouter />} />
        <Route path="/room/:roomCode/live" element={<LiveDraftScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
