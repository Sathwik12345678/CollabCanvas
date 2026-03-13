import { useEffect, useState } from "react";
import { socket } from "../socket/socket";

function Participants({ roomId, username }) {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // ===== Single source of truth =====
    const handleUsers = (list) => {
      setUsers(list || []);
    };

    const handleAdmin = (payload) => {
      // payload may be boolean or object {status, adminToken}
      const status = typeof payload === "object" ? payload.status : payload;
      setIsAdmin(status);
      if (status && typeof payload === "object" && payload.adminToken) {
        localStorage.setItem("adminToken", payload.adminToken);
      }
    };

    const handleLeft = (id) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    socket.on("room-users", handleUsers);
    socket.on("admin-status", handleAdmin);
    socket.on("user-left", handleLeft);

    return () => {
      socket.off("room-users", handleUsers);
      socket.off("admin-status", handleAdmin);
      socket.off("user-left", handleLeft);
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Participants
          </span>
          <span className="text-xs text-gray-400">
            {users.length} online
          </span>
        </div>
        {isAdmin && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">
            Admin
          </span>
        )}
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {users.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-4">
            No users
          </div>
        )}

        {users.map((user) => {
          const isSelf = user.username === username;

          return (
            <div
              key={user.id}
              className="glass p-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition"
            >
              {/* Left */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {user.username?.charAt(0)?.toUpperCase()}
                </div>

                <div className="text-sm truncate">
                  {user.username}

                  {user.isAdmin && (
                    <span className="ml-1 text-xs text-indigo-300">
                      (Admin)
                    </span>
                  )}

                  {isSelf && (
                    <span className="ml-1 text-xs text-gray-400">
                      (You)
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Controls */}
              {isAdmin && !isSelf && (
                <div className="flex gap-1.5 flex-shrink-0 items-center">
                  <button
                    type="button"
                    className="text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-400/30 px-2 py-1 rounded-lg transition"
                    onClick={() =>
                      socket.emit("admin-mute-user", { roomId, targetId: user.id })
                    }
                  >
                    Mute
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-medium bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-400/30 px-2 py-1 rounded-lg transition"
                    onClick={() =>
                      socket.emit("admin-camera-off-user", { roomId, targetId: user.id })
                    }
                  >
                    Cam
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Participants;