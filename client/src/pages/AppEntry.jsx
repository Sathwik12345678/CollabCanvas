import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import { v4 as uuidv4 } from "uuid";

function AppEntry() {
  const navigate = useNavigate();

  const storedName = localStorage.getItem("name") || "";

  const [name, setName] = useState(storedName);
  const [roomInput, setRoomInput] = useState("");

  const createRoom = () => {
    if (!name.trim()) return alert("Enter your name");

    localStorage.setItem("name", name.trim());
    const roomId = uuidv4();
    navigate(`/room/${roomId}`);
  };

  const joinRoom = () => {
    if (!name.trim()) return alert("Enter your name");
    if (!roomInput.trim()) return alert("Enter room ID");

    localStorage.setItem("name", name.trim());
    navigate(`/room/${roomInput.trim()}`);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black page-fade">
      <div className="bg-glow bg-glow-indigo -top-40 -left-40" />
      <div className="bg-glow bg-glow-purple -bottom-40 -right-36" />

      <TopNav />

      <div className="w-full flex items-center justify-center px-4 pb-10">
        <div className="glass glass-lift card-premium w-[420px] max-w-full text-center fade-up">
          <h1 className="text-3xl font-semibold mb-2 tracking-tight">
            The modern collaboration canvas
          </h1>

          <p className="text-gray-400 text-sm mb-8">
            Spin up a real-time whiteboard room with chat, sticky notes, and live video.
          </p>

          <input
            className="input-premium mb-4"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            className="btn-premium w-full mb-6 btn-press"
            onClick={createRoom}
          >
            Create new room
          </button>

          <div className="text-gray-500 text-xs mb-4 tracking-wide uppercase">
            or join existing
          </div>

          <input
            className="input-premium mb-3"
            placeholder="Enter room ID"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
          />

          <button
            className="btn-premium w-full btn-press"
            onClick={joinRoom}
          >
            Join room
          </button>

          <div className="mt-6 pt-6 border-t border-white/10 flex justify-center gap-4 text-sm">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              Login
            </Link>
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppEntry;
