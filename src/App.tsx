import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinScreen from "./screens/JoinScreen";
import RoomRouter from "./screens/RoomRouter";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinScreen />} />
        <Route path="/room/:roomCode" element={<RoomRouter />} />
        <Route path="/join/:roomCode" element={<JoinScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
