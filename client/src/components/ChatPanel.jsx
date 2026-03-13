import { useState, useEffect, useRef } from "react";
import { socket } from "../socket/socket";

function ChatPanel({ roomId, username }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const containerRef = useRef(null);

  // ================= RECEIVE =================
  useEffect(() => {
    const handleMessage = (data) => {
      setMessages((prev) => {
        const updated = [...prev, data];
        return updated.slice(-100); // keep last 100 messages
      });
    };

    socket.on("chat-message", handleMessage);

    return () => {
      socket.off("chat-message", handleMessage);
    };
  }, []);

  // ================= AUTO SCROLL (smart) =================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // ================= SEND =================
  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;

    const msgData = {
      roomId,
      username,
      message: text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("chat-message", msgData);

    // Scribble guess support
    socket.emit("guess", {
      roomId,
      message: text,
      username,
    });

    setMessage("");
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
  };

  // ================= UI =================
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Room chat
          </span>
          <span className="text-xs text-slate-500 truncate">
            Collaborate in real time
          </span>
        </div>
        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
          💬 Live
        </span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-3 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/40"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No messages yet. Say hi!
          </div>
        )}
        {messages.map((msg, index) => {
          const isMe = msg.username === username;

          return (
            <div
              key={index}
              className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[85%] min-w-0 px-3 py-2 rounded-2xl text-sm shadow backdrop-blur text-left
                  ${isMe
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md"
                    : "bg-white/10 border border-white/10 text-gray-200 rounded-bl-md"
                  }`}
              >
                {!isMe && (
                  <div className="text-xs text-indigo-300 font-medium mb-0.5 truncate">
                    {msg.username}
                  </div>
                )}
                <div className="break-words whitespace-pre-wrap hyphens-auto text-left">
                  {msg.message}
                </div>
                <div className={`text-[10px] opacity-70 mt-1 ${isMe ? "text-right" : "text-right"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-2.5 border-t border-white/10 flex-shrink-0 bg-slate-900/30">
        <div className="flex gap-1.5 mb-2 flex-wrap items-center">
          {["😊", "👍", "😂", "🎉", "❤️"].map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => addEmoji(e)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-sm transition"
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 outline-none text-sm text-white placeholder:text-slate-400 focus:border-indigo-400/50 transition"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            className="btn-premium btn-press shrink-0 py-2.5 px-4"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;