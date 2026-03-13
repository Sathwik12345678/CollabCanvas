require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/user");

const app = express();

// ======================
// MIDDLEWARE
// ======================
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const prodOrigins = [process.env.CLIENT_URL].filter(Boolean);

const allowedOrigins =
  process.env.NODE_ENV === "production" ? prodOrigins : devOrigins;

const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); // curl/server-to-server/no-origin
  if (allowedOrigins.includes(origin)) return cb(null, true);
  return cb(new Error(`CORS blocked origin: ${origin}`));
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// ======================
// MongoDB
// ======================
const hasMongoUri = Boolean(process.env.MONGO_URI);

if (!hasMongoUri) {
  console.warn("⚠️  MONGO_URI is not set. Auth endpoints will be unavailable.");
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
      console.warn("⚠️  Continuing without MongoDB. Auth will use in-memory fallback.");
    });
}

const mongoReady = () => mongoose.connection?.readyState === 1;

// In-memory auth fallback (so the app works without MongoDB in dev/demo)
// NOTE: resets on server restart; for production you should use MongoDB.
const memoryUsersByEmail = new Map(); // email -> { id, name, email, passwordHash }

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ======================
// STORE DATA
// ======================
const rooms = {};
const games = {};

const words = [
  // Easy words
  "apple", "car", "house", "tree", "cat", "dog", "phone", "book", "chair", "sun",
  "moon", "star", "bird", "fish", "flower", "ball", "hat", "shoe", "door", "window",
  // Medium words
  "computer", "elephant", "butterfly", "mountain", "ocean", "guitar", "piano", "rocket",
  "castle", "bridge", "telescope", "microscope", "volcano", "pyramid", "statue", "painting",
  // Hard words
  "chrysanthemum", "hippopotamus", "rhinoceros", "squelch", "quixotic", "mellifluous",
  "serendipity", "ephemeral", "labyrinth", "quintessential", "onomatopoeia", "sesquipedalian"
];

// ======================
// AUTH ROUTES
// ======================

// Input validation helper
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password && password.length >= 6;
const validateName = (name) => name && name.trim().length >= 2;

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!validateName(name)) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedName = name.trim();

    if (mongoReady()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) return res.status(400).json({ message: "User already exists" });

      const hashed = await bcrypt.hash(password, 10);
      await new User({ name: normalizedName, email: normalizedEmail, password: hashed }).save();
      return res.status(201).json({ message: "Signup successful" });
    }

    if (memoryUsersByEmail.has(normalizedEmail)) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    memoryUsersByEmail.set(normalizedEmail, {
      id,
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashed,
    });
    return res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!validateEmail(email) || !password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const normalizedEmail = email.toLowerCase();

    let userId;
    let userName;
    let passwordHash;

    if (mongoReady()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      userId = user._id;
      userName = user.name;
      passwordHash = user.password;
    } else {
      const user = memoryUsersByEmail.get(normalizedEmail);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      userId = user.id;
      userName = user.name;
      passwordHash = user.passwordHash;
    }

    const match = await bcrypt.compare(password, passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const token = jwt.sign(
      { id: userId, name: userName },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: userName, userId });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GAME LOGIC
// ======================
function startRound(roomId, customWord) {
  const game = games[roomId];
  if (!game || game.players.length === 0) return;

  const drawer = game.players[game.currentIndex];
  const word = customWord || words[Math.floor(Math.random() * words.length)];
  game.word = word;

  io.to(roomId).emit("round-start", {
    drawerId: drawer.id,
    wordLength: word.length
  });

  io.to(drawer.id).emit("your-word", word);

  let time = 60;
  io.to(roomId).emit("timer", time);

  if (game.timer) clearInterval(game.timer);

  game.timer = setInterval(() => {
    time--;
    io.to(roomId).emit("timer", time);

    if (time <= 0) {
      clearInterval(game.timer);
      game.currentIndex =
        (game.currentIndex + 1) % game.players.length;
      startRound(roomId);
    }
  }, 1000);
}

// ======================
// SOCKET
// ======================
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("error", (err) => {
    console.error(`❌ Socket error [${socket.id}]:`, err);
  });

  const getRoomUsers = (roomId) => rooms[roomId] || [];
  const isSocketAdmin = (roomId) => {
    const u = getRoomUsers(roomId).find((x) => x.id === socket.id);
    return Boolean(u?.isAdmin);
  };

  // ======================
  // JOIN ROOM
  // ======================
  // helper to generate simple tokens; could be replaced with uuid
  const genToken = () => Math.random().toString(36).slice(2);

  socket.on("join-room", ({ roomId, username, adminToken: clientToken }) => {
    socket.join(roomId);
    socket.roomId = roomId;

    if (!rooms[roomId]) rooms[roomId] = [];

    const exists = rooms[roomId].find(u => u.id === socket.id);
    if (!exists) {
      // determine admin status: first person OR token match
      let isAdmin = false;
      if (rooms[roomId].length === 0) {
        isAdmin = true;
        // create a persistent token for this room admin
        rooms[roomId].adminToken = genToken();
      } else if (clientToken && rooms[roomId].adminToken === clientToken) {
        // rejoin with the correct token
        isAdmin = true;
      }

      const safeName =
        typeof username === "string" && username.trim().length
          ? username.trim().slice(0, 32)
          : "Guest";

      rooms[roomId].push({
        id: socket.id,
        username: safeName,
        isAdmin
      });

      // Send admin status (with token when true)
      console.log(`User ${safeName} joined room ${roomId}, admin: ${isAdmin}`);
      io.to(socket.id).emit("admin-status", {
        status: isAdmin,
        adminToken: isAdmin ? rooms[roomId].adminToken : null,
      });

      // Send updated users to everyone
      io.to(roomId).emit("room-users", rooms[roomId]);
    }
  });

  // Request admin status (for reconnects or missed messages)
  socket.on("request-admin-status", ({ roomId, adminToken: clientToken } = {}) => {
    const rid = roomId || socket.roomId;
    if (!rid) return;
    let isAdmin = isSocketAdmin(rid);

    // if token matches, grant admin even if socket id changed
    if (!isAdmin && clientToken && rooms[rid]?.adminToken === clientToken) {
      // update the user entry if present
      const user = rooms[rid].find(u => u.id === socket.id);
      if (user) user.isAdmin = true;
      isAdmin = true;
    }

    console.log(`Admin status requested for ${socket.id} in room ${rid}: ${isAdmin}`);
    socket.emit("admin-status", {
      status: isAdmin,
      adminToken: isAdmin ? rooms[rid]?.adminToken : null,
    });
  });

  // ======================
  // WEBRTC SIGNALING
  // ======================

  // Send users with usernames
  socket.on("get-users", (roomId) => {
    const roomUsers = rooms[roomId];
    if (!roomUsers) return;

    const users = roomUsers.filter(u => u.id !== socket.id);
    socket.emit("all-users", users);
  });

  socket.on("offer", ({ target, sdp }) => {
    io.to(target).emit("offer", {
      sdp,
      caller: socket.id
    });
  });

  socket.on("answer", ({ target, sdp }) => {
    io.to(target).emit("answer", {
      sdp,
      id: socket.id
    });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", {
      candidate,
      from: socket.id
    });
  });

  // ======================
  // ADMIN CONTROLS
  // ======================
  socket.on("admin-mute-user", ({ roomId, targetId }) => {
    const rid = roomId || socket.roomId;
    if (!rid || !isSocketAdmin(rid)) return;
    io.to(targetId).emit("force-mute");
  });

  socket.on("admin-camera-off-user", ({ roomId, targetId }) => {
    const rid = roomId || socket.roomId;
    if (!rid || !isSocketAdmin(rid)) return;
    io.to(targetId).emit("force-camera-off");
  });

  socket.on("admin-mute-all", (roomId) => {
    const rid = roomId || socket.roomId;
    if (!rid || !isSocketAdmin(rid)) return;
    const roomUsers = rooms[rid] || [];
    roomUsers.forEach(u => {
      io.to(u.id).emit("force-mute");
    });
  });

  socket.on("admin-camera-off-all", (roomId) => {
    const rid = roomId || socket.roomId;
    if (!rid || !isSocketAdmin(rid)) return;
    const roomUsers = rooms[rid] || [];
    roomUsers.forEach(u => {
      io.to(u.id).emit("force-camera-off");
    });
  });

  // ======================
  // GAME
  // ======================
  socket.on("start-game", (roomId, customWord) => {
    const rid = roomId || socket.roomId;
    const isAdminCheck = isSocketAdmin(rid);
    console.log(`Start game requested by ${socket.id} in room ${rid}, isAdmin: ${isAdminCheck}`);
    if (!rid || !isAdminCheck) {
      console.log(`Start game denied: room=${rid}, admin=${isAdminCheck}`);
      return;
    }

    const roomUsers = rooms[rid];
    if (!roomUsers || roomUsers.length === 0) {
      console.log(`Start game denied: no users in room ${rid}`);
      return;
    }

    console.log(`Starting game in room ${rid} with ${roomUsers.length} players`);
    games[rid] = {
      players: roomUsers.map(u => ({
        id: u.id,
        username: u.username,
        score: 0
      })),
      currentIndex: 0,
      word: "",
      timer: null
    };

    startRound(rid, customWord);
  });

  socket.on("stop-game", (roomId) => {
    const rid = roomId || socket.roomId;
    if (!rid || !isSocketAdmin(rid)) return;

    const game = games[rid];
    if (!game) return;

    if (game.timer) clearInterval(game.timer);

    // Determine winner (highest score) and emit before clearing
    const scores = game.players.map((p) => ({ username: p.username, score: p.score }));
    const best = game.players.reduce((a, b) => (a.score >= b.score ? a : b));
    const winner = best.score > 0 ? { username: best.username, score: best.score } : null;

    io.to(rid).emit("game-ended", { winner, scores });
    delete games[rid];
    io.to(rid).emit("game-stopped");
  });

  socket.on("guess", ({ roomId, message }) => {
    const game = games[roomId];
    if (!game) return;

    if (message &&
        message.toLowerCase() === game.word.toLowerCase()) {

      const player = game.players.find(p => p.id === socket.id);
      if (player) player.score += 10;

      io.to(roomId).emit("correct-guess", {
        username: player.username,
        scores: game.players
      });

      clearInterval(game.timer);
      game.currentIndex =
        (game.currentIndex + 1) % game.players.length;

      startRound(roomId);
    }
  });

  // ======================
  // STICKY NOTES
  // ======================
  socket.on("add-note", (note) => socket.to(note.roomId).emit("add-note", note));
  socket.on("move-note", (d) => socket.to(d.roomId).emit("move-note", d));
  socket.on("update-note", (d) => socket.to(d.roomId).emit("update-note", d));
  socket.on("delete-note", (d) => socket.to(d.roomId).emit("delete-note", d.id));

  // ======================
  // CANVAS & CHAT
  // ======================
  socket.on("drawing", d => socket.to(d.roomId).emit("drawing", d));
  socket.on("clear-board", r => socket.to(r).emit("clear-board"));

  socket.on("cursor-move", d => {
    socket.to(d.roomId).emit("cursor-move", d);
  });

  socket.on("chat-message", d => {
    io.to(d.roomId).emit("chat-message", d);
  });

  // ======================
  // DISCONNECT
  // ======================
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    // remove user but preserve existing adminToken for the room
    const existingRoom = rooms[roomId];
    const existingAdminToken = existingRoom.adminToken;
    const updatedUsers = existingRoom.filter(u => u.id !== socket.id);
    updatedUsers.adminToken = existingAdminToken;
    rooms[roomId] = updatedUsers;

    // if admin left and there are still users, promote the first one
    if (rooms[roomId].length > 0) {
      const hasAdmin = rooms[roomId].some(u => u.isAdmin);
      if (!hasAdmin) {
        rooms[roomId][0].isAdmin = true;
        rooms[roomId].adminToken = genToken();
        io.to(rooms[roomId][0].id).emit("admin-status", {
          status: true,
          adminToken: rooms[roomId].adminToken,
        });
      }
    }

    io.to(roomId).emit("room-users", rooms[roomId]);
    socket.to(roomId).emit("user-left", socket.id);

    if (rooms[roomId].length === 0) {
      console.log(`🗑️ Cleanup: Room "${roomId}" deleted`);
      delete rooms[roomId];
      if (games[roomId]) {
        clearInterval(games[roomId].timer);
        delete games[roomId];
      }
    }
  });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    mongo: mongoose.connection?.readyState ?? "unknown",
    authMode: mongoReady() ? "mongo" : "memory",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "Server error" : (err.message || "Server error"),
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

function startServer(port) {
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} already in use. Trying port ${port + 1}...`);
      // attempt to listen on the next port
      startServer(port + 1);
    } else {
      // rethrow unexpected errors so they surface and crash the process
      throw err;
    }
  });
}

startServer(PORT);