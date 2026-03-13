import { io } from "socket.io-client";

// Use env if available (for deployment later)
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(URL, {
  autoConnect: false,

  // Use WebSocket only (better for WebRTC signaling)
  transports: ["websocket"],

  // Auto reconnect
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,

  // Connection timeout
  timeout: 20000
});

// ======================
// Debug Logs (Helps testing)
// ======================
socket.on("connect", () => {
  console.log("🟢 Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("Socket error:", err.message);
});