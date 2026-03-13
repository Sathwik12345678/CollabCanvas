# CollabCanvas 🎨
check [Live link](https://collab-canvas-liard.vercel.app/)
A real-time collaborative drawing, sketching, and chat application built with React, Node.js, Express, and WebRTC.

![CollabCanvas](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-16+-blue)

## ✨ Features

- 🎨 **Real-time Drawing** - Collaborate with others on a shared canvas
- 💬 **Live Chat** - Built-in messaging system for room participants
- 📝 **Sticky Notes** - Create and move collaborative sticky notes
- 👥 **Participant Management** - See who's in the room
- 📹 **Video Integration** - WebRTC video panel support
- 🎮 **Drawing Game** - Play guess-the-drawing games with friends
- 👑 **Admin Controls** - Room admins can manage participants
- 🔐 **User Authentication** - Secure login and signup system
- ⚡ **Real-time Sync** - Instant synchronization using Socket.IO

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Framer Motion** - Animations
- **React Router** - Routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.IO** - WebSocket communication
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📥 Installation

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- MongoDB Atlas account (free tier available)

### Clone Repository
```bash
git clone <repository-url>
cd collabcanvas
```

### Server Setup
```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI and JWT secret
nano .env
```

### Client Setup
```bash
cd client

# Install dependencies
npm install

# Create .env file (optional, uses defaults)
cp .env.example .env
```

## 🚀 Running Locally

### Start Server
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

### Start Client (in another terminal)
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

Visit `http://localhost:5173` in your browser.

## 📖 Usage

1. **Create Account** - Sign up with name, email, and password
2. **Create/Join Room** - Enter or create a collaboration room
3. **Invite Others** - Share the room URL with collaborators
4. **Draw & Chat** - Use the canvas to draw and chat with others
5. **Add Sticky Notes** - Collaborate using sticky notes
6. **Play Games** - Start a drawing game to play with room members

## 🔧 Configuration

### Environment Variables

**Server (.env):**
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collabcanvas
JWT_SECRET=your_secure_secret_key_here
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_SOCKET_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
```

## 📁 Project Structure

```
collabcanvas/
├── client/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── api/               # API utilities
│   │   ├── socket/            # Socket.IO configuration
│   │   ├── styles/            # CSS files
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── index.html             # HTML template
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/                # Database config
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── server.js              # Main server file
│   └── package.json
│
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

## 📚 API Documentation

### Authentication Endpoints

**Sign Up**
```
POST /api/signup
Body: { name, email, password }
Response: { message: "Signup successful" }
```

**Login**
```
POST /api/login
Body: { email, password }
Response: { token, name, userId }
```

### WebSocket Events

#### Room Events
- `join-room` - Join a room with username
- `room-users` - Receive list of room participants
- `user-left` - Notification when user leaves

#### Drawing Events
- `drawing` - Send drawing data
- `clear-board` - Clear the canvas
- `cursor-move` - Update cursor position

#### Chat Events
- `chat-message` - Send/receive chat messages
- `add-note` - Create sticky note
- `move-note` - Move sticky note
- `update-note` - Update note content
- `delete-note` - Delete sticky note

#### Game Events
- `start-game` - Start drawing game
- `stop-game` - End game
- `round-start` - New round begins
- `your-word` - Word to draw (drawer only)
- `guess` - Submit guess
- `correct-guess` - Correct answer submitted
- `timer` - Round time remaining
- `game-ended` - Game finished with scores

## 🔐 Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Input validation on server
- CORS protection
- Environment variables for sensitive data
- Secure MongoDB credentials

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md#-security-best-practices)

## 🧪 Development

### Linting
```bash
cd client
npm run lint
```

### Build for Production

**Client:**
```bash
cd client
npm run build
```

**Server:**
Production-ready as-is. Run with `NODE_ENV=production`

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Heroku
- Vercel
- Docker
- AWS/DigitalOcean VPS
- Manual VPS setup

## 🐛 Known Issues & Workarounds

- **CORS errors**: Verify `CLIENT_URL` in server `.env`
- **WebSocket connection failures**: Check Socket.IO URL in client env
- **Drawing lag**: Reduce drawing frequency or optimize line rendering

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -am 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC License - see LICENSE file for details

## 🤝 Support

- Open an issue on GitHub
- Check [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting) for troubleshooting

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Socket.IO Guide](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [MongoDB Guide](https://docs.mongodb.com/)

## 🙏 Acknowledgments

Built with ❤️ using modern web technologies.

---

**Made with ❤️ by the CollabCanvas team**


