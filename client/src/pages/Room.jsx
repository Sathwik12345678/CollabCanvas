import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket/socket";
import CanvasBoard from "../components/CanvasBoard";
import ChatPanel from "../components/ChatPanel";
import Participants from "../components/Participants";
import StickyNotes from "../components/StickyNotes";
import VideoPanel from "../components/VideoPanel";

function Room() {
  const { id } = useParams();
  const navigate = useNavigate();

  const storedName = localStorage.getItem("name");
  const [username, setUsername] = useState(storedName || "");
  const [tempName, setTempName] = useState("");
  const [joined, setJoined] = useState(false);
  const joinedRef = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Game
  const [gameActive, setGameActive] = useState(false);
  const [isDrawer, setIsDrawer] = useState(false);
  const [word, setWord] = useState("");
  const [wordHint, setWordHint] = useState("");
  const [scores, setScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastGameResult, setLastGameResult] = useState(null); // { winner: { username, score }, scores: [] }
  const [customWord, setCustomWord] = useState("");

  // ===== JOIN =====
  const handleJoin = useCallback((nameToUse) => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    socket.connect();

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomId: id,
        username: nameToUse,
        adminToken: localStorage.getItem("adminToken"),
      });
      
      // Request admin status after joining (in case message was lost)
      setTimeout(() => {
        socket.emit("request-admin-status", {
          roomId: id,
          adminToken: localStorage.getItem("adminToken"),
        });
      }, 100);
    });

    localStorage.setItem("name", nameToUse);
    setUsername(nameToUse);
    setJoined(true);
  }, [id]);

  const handleExit = useCallback(() => {
    socket.disconnect();
    joinedRef.current = false;
    setJoined(false);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (storedName && !joinedRef.current) {
      const t = setTimeout(() => {
        if (!joinedRef.current) handleJoin(storedName);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [handleJoin, storedName]);

  useEffect(() => {
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      joinedRef.current = false;
    };
  }, []);

  // ===== GAME EVENTS =====
  useEffect(() => {
    const handleRoundStart = ({ drawerId, wordLength }) => {
      setGameActive(true);
      setIsDrawer(socket.id === drawerId);
      setWord("");
      setWordHint("_ ".repeat(wordLength));
    };

    socket.on("round-start", handleRoundStart);
    socket.on("your-word", setWord);
    socket.on("correct-guess", ({ scores: s }) => setScores(s));
    socket.on("timer", setTimeLeft);
    socket.on("game-ended", (payload) => setLastGameResult(payload));
    socket.on("admin-status", (payload) => {
      // payload { status: boolean, adminToken?: string }
      console.log("Admin status received:", payload);
      setIsAdmin(payload.status);
      if (payload.status && payload.adminToken) {
        localStorage.setItem("adminToken", payload.adminToken);
      }
    });
    socket.on("game-stopped", () => {
      setGameActive(false);
      setIsDrawer(false);
      setWord("");
      setWordHint("");
      setScores([]);
      setTimeLeft(0);
    });

    return () => {
      socket.off("round-start");
      socket.off("your-word");
      socket.off("correct-guess");
      socket.off("timer");
      socket.off("game-ended");
      socket.off("admin-status");
      socket.off("game-stopped");
    };
  }, []);

  // ===== NAME SCREEN =====
  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4">
        <div className="glass glass-lift card-premium w-full max-w-sm text-center fade-up">
          <h3 className="text-xl font-semibold mb-2 tracking-tight">Welcome to CollabCanvas</h3>
          <p className="text-xs text-slate-400 mb-6">
            Add your name to join this live room.
          </p>
          <input
            className="input-premium mb-4"
            placeholder="Your name"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tempName.trim() && handleJoin(tempName.trim())}
          />
          <button
            className="btn-premium w-full"
            onClick={() => {
              if (!tempName.trim()) return;
              handleJoin(tempName.trim());
            }}
          >
            Join room
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="glass px-4 py-2 rounded-full text-slate-300 text-sm">
          Joining room…
        </div>
      </div>
    );
  }

  // ===== MAIN LAYOUT =====
  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden bg-slate-950 page-fade">

      {/* Top Bar */}
      <header className="flex-shrink-0 px-4 flex flex-wrap items-center justify-between gap-3 glass border-b border-white/10 min-h-[56px]">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              CollabCanvas
            </span>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-white truncate">
                Room · {id.slice(0, 8)}…
              </span>
              <span className="text-slate-400 truncate">
                · {username}
              </span>
            </div>
          </div>

        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end min-w-0">
          {gameActive && (
            <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-300 px-2 py-0.5 border border-amber-400/30 tabular-nums">
                ⏱ {timeLeft}s
              </span>

              {!isDrawer && wordHint && (
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-200 px-2 py-0.5 border border-indigo-400/30">
                  Hint: {wordHint}
                </span>
              )}

              {isDrawer && word && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-300 px-2 py-0.5 border border-emerald-400/40 font-medium">
                  Word: {word}
                </span>
              )}

              {scores?.length > 0 && (
                <span
                  className="text-slate-400 text-[11px] max-w-[220px] truncate"
                  title={scores.map((p) => `${p.username}: ${p.score}`).join(", ")}
                >
                  {scores.map((p) => `${p.username}: ${p.score}`).join(" · ")}
                </span>
              )}
            </div>
          )}

          {!gameActive && isAdmin && (
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                placeholder="Custom word (optional)"
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value)}
                className="input-premium text-sm py-2 px-3 flex-1 min-w-[140px] max-w-[220px]"
                maxLength={20}
              />
              <button
                type="button"
                className="btn-press text-sm py-2 px-4 rounded-full font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/60"
                onClick={() => {
                  setLastGameResult(null);
                  socket.emit("start-game", id, customWord.trim() || null);
                  setCustomWord("");
                }}
                title="Start a new drawing game"
              >
                Start game
              </button>
            </div>
          )}

          {!gameActive && !isAdmin && (
            <button
              type="button"
              className="btn-press text-sm py-2 px-4 rounded-full font-medium bg-emerald-900/40 text-emerald-300/60 border border-emerald-700/40 cursor-not-allowed"
              disabled
              title="Only the room admin can start the game"
            >
              Start game
            </button>
          )}

          {gameActive && (
            <button
              type="button"
              className={`btn-press text-sm py-2 px-4 rounded-full font-medium transition ${
                isAdmin
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 border border-red-400/60"
                  : "bg-red-900/40 text-red-300/60 border border-red-700/40 cursor-not-allowed"
              }`}
              disabled={!isAdmin}
              onClick={() => {
                if (!isAdmin) return;
                socket.emit("stop-game", id);
              }}
              title={isAdmin ? "Stop the current game" : "Only the room admin can stop the game"}
            >
              Stop game
            </button>
          )}

          {/* Copy link – always visible, on the right */}
          <button
            type="button"
            className="btn-premium btn-press text-sm py-2 px-4"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copy link
          </button>

          {/* Exit meeting */}
          <button
            type="button"
            className="btn-press text-sm py-2 px-4 rounded-full font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 border border-red-400/60"
            onClick={handleExit}
          >
            Exit Meeting
          </button>
        </div>
      </header>

      {/* Winner / Game ended overlay */}
      {lastGameResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass card-premium max-w-sm w-full text-center p-6 rounded-2xl shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">Game Over</h3>
            {lastGameResult.winner ? (
              <>
                <p className="text-2xl font-bold text-amber-400 mt-2 mb-1">
                  🏆 {lastGameResult.winner.username}
                </p>
                <p className="text-slate-400 text-sm mb-4">Winner with {lastGameResult.winner.score} points</p>
              </>
            ) : (
              <p className="text-slate-400 text-sm my-3">No scores yet. Play a round to see a winner!</p>
            )}
            {lastGameResult.scores?.length > 0 && (
              <ul className="text-left text-sm text-slate-300 space-y-1 mb-4">
                {lastGameResult.scores
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <li key={p.username} className="flex justify-between">
                      <span>{i + 1}. {p.username}</span>
                      <span className="tabular-nums font-medium">{p.score} pts</span>
                    </li>
                  ))}
              </ul>
            )}
            <button
              type="button"
              className="btn-premium btn-press w-full"
              onClick={() => setLastGameResult(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Workspace */}
      <div className="flex flex-1 min-h-0">

        {/* Participants */}
        <aside className="w-56 flex-shrink-0 flex flex-col glass panel-premium border-r border-white/10 overflow-hidden">
          <Participants roomId={id} username={username} />
        </aside>

        {/* Canvas area - has .workspace for StickyNotes drag */}
        <div className="workspace flex-1 min-w-0 relative bg-white rounded-2xl shadow-[0_24px_80px_rgba(15,23,42,0.95)] m-3 overflow-hidden">
          <CanvasBoard roomId={id} canDraw={!gameActive || isDrawer} />
          <StickyNotes roomId={id} />

          {/* Video overlay */}
          <div className="absolute bottom-4 right-4 z-20">
            <VideoPanel roomId={id} />
          </div>
        </div>

        {/* Chat */}
        <aside className="w-80 flex-shrink-0 flex flex-col overflow-hidden glass panel-premium border-l border-white/10">
          <ChatPanel roomId={id} username={username} />
        </aside>
      </div>
    </div>
  );
}

export default Room;