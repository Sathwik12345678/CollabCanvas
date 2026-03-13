# CollabCanvas - Deployment Guide

CollabCanvas is a real-time collaborative drawing and chat application built with React, Node.js, and WebRTC.

## 📋 Prerequisites

- Node.js 16+ (https://nodejs.org/)
- npm or yarn
- MongoDB Atlas account (https://www.mongodb.com/products/platform/cloud)
- Git

## 🏗️ Project Structure

```
collabcanvas/
├── client/                 # React frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── server/                 # Node.js backend (Express)
    ├── config/
    ├── models/
    ├── routes/
    ├── package.json
    └── server.js
```

## 🚀 Quick Start (Development)

### 1. Server Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secure_secret_key
# NODE_ENV=development
```

**Start server:**
```bash
npm run dev
```
Server runs on `http://localhost:5000`

### 2. Client Setup

```bash
cd client

# Install dependencies
npm install

# Client is already configured with .env file
# It should point to http://localhost:5000 for development
```

**Start development server:**
```bash
npm run dev
```
Client runs on `http://localhost:5173` (or next available port)

## 📦 Production Deployment

### Environment-Specific Configuration

**Server Production (.env):**
```
NODE_ENV=production
PORT=5000
MONGO_URI=<your-mongodb-production-uri>
JWT_SECRET=<generate-a-strong-random-secret>
CLIENT_URL=https://your-domain.com
```

**Client Production (.env.production):**
```
VITE_SOCKET_URL=https://your-api-domain.com
VITE_API_URL=https://your-api-domain.com
```

### Option 1: Heroku Deployment

#### Server Deployment:

1. **Install Heroku CLI** (https://devcenter.heroku.com/articles/heroku-cli)

2. **Login and create app:**
```bash
heroku login
heroku create your-app-name
```

3. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=<your-mongodb-uri>
heroku config:set JWT_SECRET=<strong-random-key>
heroku config:set CLIENT_URL=<your-client-url>
```

4. **Deploy:**
```bash
git push heroku main
```

#### Client Deployment (Vercel):

1. **Install Vercel CLI** (https://vercel.com/docs/cli)

2. **Deploy:**
```bash
vercel --prod
```

### Option 2: Docker Deployment

**Docker Compose (`docker-compose.yml`):**
```yaml
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGO_URI: ${MONGO_URI}
      JWT_SECRET: ${JWT_SECRET}
      CLIENT_URL: ${CLIENT_URL}
    restart: unless-stopped

  client:
    build: ./client
    ports:
      - "80:80"
    environment:
      VITE_SOCKET_URL: http://localhost:5000
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

### Option 3: Manual VPS Deployment (AWS/DigitalOcean)

1. **SSH into VPS:**
```bash
ssh root@your-server-ip
```

2. **Install Node.js:**
```bash
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install nginx (reverse proxy):**
```bash
sudo apt-get install nginx
```

4. **Clone repository:**
```bash
git clone <your-repo-url> /var/www/collabcanvas
cd /var/www/collabcanvas/server
npm install
```

5. **Setup PM2 (process manager):**
```bash
npm install -g pm2
pm2 start server.js --name "collabcanvas"
pm2 startup
pm2 save
```

6. **Setup nginx reverse proxy:**
```
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## 🔐 Security Best Practices

- ✅ Always use `.env.example` for reference
- ✅ Never commit `.env` files to Git
- ✅ Use strong, randomly generated JWT_SECRET
- ✅ For production, use HTTPS (enable with Let's Encrypt)
- ✅ Set proper CORS origins in `CLIENT_URL`
- ✅ Validate all user inputs on the server
- ✅ Keep dependencies updated: `npm audit fix`

## 📊 Environment Variables Reference

### Server (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `PORT` | No | 5000 | Server port |
| `MONGO_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `CLIENT_URL` | No | http://localhost:5173 | Client URL for CORS |

### Client (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SOCKET_URL` | No | http://localhost:5000 | Socket.IO server URL |
| `VITE_API_URL` | No | http://localhost:5000 | API base URL |

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 API Endpoints

### Authentication
- `POST /api/signup` - Create new account
- `POST /api/login` - Login user
- `GET /` - Health check

### WebSocket Events (Socket.IO)

**Connection:**
- `join-room` - Join a collaboration room
- `disconnect` - Leave room

**Collaboration:**
- `drawing` - Drawing data
- `cursor-move` - Cursor position
- `chat-message` - Chat message
- `add-note` - Add sticky note

**Game:**
- `start-game` - Start drawing game
- `stop-game` - End game
- `guess` - Guess word
- `round-start` - New round started

**Admin Controls:**
- `admin-mute-user` - Mute specific user
- `admin-camera-off-user` - Turn off user camera

## 🐛 Troubleshooting

### CORS Errors
- Check `CLIENT_URL` in server `.env`
- Ensure frontend and backend are on same/allowed domains

### WebSocket Connection Failed
- Verify Socket.IO URL in client `.env`
- Check firewall/port settings
- Ensure websocket transport is not blocked

### MongoDB Connection Error
- Verify `MONGO_URI` connection string
- Check IP whitelist on MongoDB Atlas
- Ensure database credentials are correct

### 404 Not Found Errors
- Client routing handled by React Router
- Check `vite.config.js` for correct build config
- Ensure static assets are in `public/` folder

## 📚 Resources

- [Node.js Docs](https://nodejs.org/docs/)
- [React Docs](https://react.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express Guide](https://expressjs.com/)

## 📄 License

ISC

## 👤 Support

For issues, please open a GitHub issue or contact support.
