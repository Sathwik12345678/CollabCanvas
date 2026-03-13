# 🚀 Deployment Guide: Vercel Frontend + Oracle Backend

Complete step-by-step deployment process for CollabCanvas using Vercel for the frontend and Oracle Cloud for the backend.

---

## 📋 Prerequisites

Before you start, ensure you have:

- ✅ Git account (GitHub, GitLab, or Bitbucket)
- ✅ Vercel account (free at https://vercel.com)
- ✅ Oracle Cloud account (free tier available at https://www.oracle.com/cloud/free/)
- ✅ MongoDB Atlas account (free tier available)
- ✅ Node.js installed locally
- ✅ Terminal/Command line access
- ✅ A domain name (optional, but recommended)

---

## 🎯 High-Level Overview

```
Your Architecture:
┌─────────────────────────────────────────┐
│           Your Users/Clients            │
└────────────────────┬────────────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │  Vercel (Frontend)     │
         │  - React app           │
         │  - Static files        │
         │  - CDN delivery        │
         └────────────┬───────────┘
                      │
          ┌───────────┴───────────┐
          │ HTTPS Connection      │
          │ (Socket.IO + REST)    │
          │                       │
          ▼                       ▼
┌─────────────────────────────────────────┤
│     Oracle Cloud (Backend)              │
│  ┌───────────────────────────────────┐  │
│  │  Node.js/Express Server           │  │
│  │  • REST API                       │  │
│  │  • Socket.IO (WebSocket)          │  │
│  │  • Port 5000                      │  │
│  └───────────────────────────────────┘  │
│                   │                      │
│  ┌────────────────▼───────────────────┐  │
│  │  MongoDB Atlas (Database)          │  │
│  │  • Cloud-hosted                    │  │
│  │  • Automatic backups               │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📁 Part 1: Prepare Your Git Repository

### Step 1.1: Organize Your Folder Structure

Your repository should look like this:

```
collabcanvas/
├── client/                    # Frontend (deployed to Vercel)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json           # (We'll create this)
│
├── server/                    # Backend (deployed to Oracle)
│   ├── server.js
│   ├── models/
│   ├── package.json
│   └── .env.production        # (Don't commit)
│
├── .gitignore                 # Main gitignore
├── README.md
└── DEPLOYMENT.md
```

### Step 1.2: Create Vercel Configuration File

Create `client/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SOCKET_URL": "@VITE_SOCKET_URL",
    "VITE_API_URL": "@VITE_API_URL"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### Step 1.3: Push to GitHub

```bash
cd collabcanvas
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/collabcanvas.git
git push -u origin main
```

---

## ☁️ Part 2: Set Up Oracle Cloud Backend

### Step 2.1: Create Oracle Cloud Account & Instance

1. Go to https://www.oracle.com/cloud/free/
2. Create free account (always free tier includes compute)
3. Log in to Oracle Cloud Console

### Step 2.2: Create Compute Instance

1. **Navigate to Compute → Instances**
2. **Click "Create Instance"**
3. **Configure:**
   - **Name:** `collabcanvas-server`
   - **Image:** Ubuntu 22.04 (free tier eligible)
   - **Shape:** Ampere (ARM) - 4 OCPU, 24GB RAM (free option)
   - **Availability Domain:** Any
   - **Network:** Default VCN
   - **SSH Key:** Download and save `ssh-key-*.key`

4. **Click "Create"** and wait 2-3 minutes

### Step 2.3: Set Up Firewall Rules

1. **Go to Virtual Cloud Networks**
2. **Select Default VCN**
3. **Go to Security Lists → Default Security List**
4. **Add Ingress Rules:**

   | Protocol | Port | Source |
   |----------|------|--------|
   | TCP | 80 | 0.0.0.0/0 |
   | TCP | 443 | 0.0.0.0/0 |
   | TCP | 5000 | 0.0.0.0/0 |

5. **Click "Add Ingress Rule"** for each

### Step 2.4: Get Your Instance IP Address

1. **Go to Compute → Instances**
2. **Click on your instance name**
3. **Copy "Primary Private IP" or "Public IP Address"**

Save this IP (e.g., `203.0.113.45`)

### Step 2.5: Connect to Your instance via SSH

```bash
# Navigate to where you saved the SSH key
chmod 600 ssh-key-*.key

# Connect (replace IP)
ssh -i ssh-key-*.key ubuntu@203.0.113.45
```

---

## 🖥️ Part 3: Set Up Backend on Oracle Instance

### Step 3.1: Install Node.js and Dependencies

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### Step 3.2: Clone Your Repository

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/collabcanvas.git
cd collabcanvas/server

# Install dependencies
npm install

# Production dependencies only
npm install --production
```

### Step 3.3: Create Production Environment File

```bash
# Create .env file
nano .env
```

**Paste this content (update values):**

```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collabcanvas?retryWrites=true&w=majority
JWT_SECRET=<generate-using-command-below>
CLIENT_URL=https://your-domain.vercel.app
```

**Generate JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste as JWT_SECRET.

**Save file:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3.4: Start Server with PM2

```bash
# Start application
pm2 start server.js --name "collabcanvas"

# Configure startup on reboot
pm2 startup
pm2 save

# Verify it's running
pm2 status
pm2 logs
```

Expected output:
```
✅ Server running on port 5000
📝 Environment: production
```

### Step 3.5: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/collabcanvas
```

**Paste this:**

```nginx
upstream backend {
    server localhost:5000;
}

# Redirect HTTP to HTTPS (after SSL setup)
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL (we'll set this up next)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # API Routes
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://backend/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Save and enable:**

```bash
sudo ln -s /etc/nginx/sites-available/collabcanvas /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 3.6: Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace domain)
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### Step 3.7: Update Nginx Config with SSL

```bash
sudo nano /etc/nginx/sites-available/collabcanvas
```

Uncomment the SSL lines:

```nginx
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

**Restart Nginx:**

```bash
sudo systemctl restart nginx
```

### Step 3.8: Auto-Renew SSL Certificate

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## 🌐 Part 4: Deploy Frontend to Vercel

### Step 4.1: Connect GitHub to Vercel

1. Go to https://vercel.com
2. **Click "New Project"**
3. **Choose "Import Git Repository"**
4. **Select your GitHub repository** (`collabcanvas`)
5. **Click "Import"**

### Step 4.2: Configure Build Settings

In Vercel dashboard:

1. **Select "Framework Preset"** → Next.js / React
2. **Root Directory** → `./client`
3. **Build Command** → `npm run build`
4. **Output Directory** → `dist`
5. **Install Command** → `npm install`

### Step 4.3: Add Environment Variables

**In Vercel Dashboard:**

1. **Go to Settings → Environment Variables**
2. **Add these variables:**

   | Name | Value | Environments |
   |------|-------|--------------|
   | `VITE_SOCKET_URL` | `https://api.your-domain.com` | Production |
   | `VITE_API_URL` | `https://api.your-domain.com` | Production |
   | `VITE_SOCKET_URL` | `http://localhost:5000` | Preview/Development |
   | `VITE_API_URL` | `http://localhost:5000` | Preview/Development |

3. **Click "Save"**

### Step 4.4: Deploy

**Option A: Automatic (Recommended)**

```bash
# Vercel auto-deploys when you push to main
git add client/
git commit -m "Frontend ready for deployment"
git push origin main
```

**Option B: Manual from Vercel Dashboard**

1. **Click "Deploy"** button
2. **Wait for build** (2-5 minutes)
3. **Get deployment URL**

### Step 4.5: Verify Frontend Works

1. **Go to Vercel deployment URL**
2. **Try to sign up/login**
3. **Check browser console** (F12) for errors
4. **If errors, check environment variables**

---

## 🔗 Part 5: Configure Custom Domain

### Step 5.1: DNS Setup (at your domain registrar)

**For your domain provider (GoDaddy, Namecheap, etc.):**

1. **Point to Oracle Backend:**
   - Create `A` record: `api.your-domain.com` → Oracle instance IP
   
2. **Point to Vercel Frontend:**
   - Add Vercel domains as instructed in Vercel Dashboard

### Step 5.2: Configure Oracle Backend Domain

```bash
# SSH into Oracle instance
ssh -i ssh-key-*.key ubuntu@ORACLE_IP

# Edit Nginx config
sudo nano /etc/nginx/sites-available/collabcanvas
```

Replace `your-domain.com` with `api.your-domain.com`

```nginx
server_name api.your-domain.com;
```

**Restart Nginx:**

```bash
sudo systemctl restart nginx
sudo certbot certonly --nginx -d api.your-domain.com
```

### Step 5.3: Update Vercel Environment Variables

1. **In Vercel Dashboard:**
2. **Settings → Environment Variables**
3. **Update:**
   - `VITE_SOCKET_URL` = `https://api.your-domain.com`
   - `VITE_API_URL` = `https://api.your-domain.com`

4. **Redeploy** (push to main or click Deploy)

---

## ✅ Part 6: Testing & Verification

### Step 6.1: Test Backend Health Check

```bash
# Should return 200 OK
curl -X GET https://api.your-domain.com/

# Expected response:
# {"status":"ok","message":"Server is running"}
```

### Step 6.2: Test Frontend

1. Open `https://your-domain.vercel.app`
2. **Try Signup** (should work)
3. **Try Login** (should work)
4. **Check browser console** (F12) - no CORS errors
5. **Create a room** and verify connection

### Step 6.3: Test WebSocket Connection

Open browser console (F12) and paste:

```javascript
const socket = io('https://api.your-domain.com', {
    reconnection: true
});
socket.on('connect', () => console.log('✅ Connected:', socket.id));
socket.on('connect_error', (err) => console.log('❌ Error:', err));
```

Expected output: `✅ Connected: [socket-id]`

---

## 🔒 Part 7: Post-Deployment Configuration

### Step 7.1: Set Up Monitoring

```bash
# SSH into Oracle instance
ssh -i ssh-key-*.key ubuntu@ORACLE_IP

# Check server status
pm2 status
pm2 logs collabcanvas

# Update PM2 to auto-restart on crash
pm2 restart collabcanvas --watch
pm2 save
```

### Step 7.2: Configure MongoDB Backups

1. Go to MongoDB Atlas
2. **Cluster → Backup**
3. **Enable "Continuous Cloud Backups"**
4. **Set retention to 35 days**

### Step 7.3: Set Up Error Monitoring (Optional)

```bash
# SSH into Oracle instance
ssh -i ssh-key-*.key ubuntu@ORACLE_IP

# Install Sentry (optional error tracking)
cd collabcanvas/server
npm install @sentry/node
```

### Step 7.4: Enable Auto-Restart on Reboot

```bash
# SSH into Oracle instance
pm2 startup
pm2 save

# Verify
sudo systemctl status pm2-ubuntu
```

---

## 📊 Part 8: Environment Variables Checklist

### Backend (.env on Oracle)

✅ Ensure these are set:

```
NODE_ENV=production
PORT=5000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<generated-secret>
CLIENT_URL=https://your-domain.vercel.app
```

### Frontend (Vercel Environment Variables)

✅ Ensure these are set:

```
VITE_SOCKET_URL=https://api.your-domain.com
VITE_API_URL=https://api.your-domain.com
```

---

## 🚨 Troubleshooting

### Frontend shows "Cannot connect to server"

**Solution:**
1. Check Vercel environment variables
2. Verify backend is running: `pm2 status`
3. Check browser console for exact error
4. Verify domain DNS is pointing to Oracle IP

### WebSocket connection fails

**Solution:**
1. Check Nginx config for Socket.IO settings
2. Verify firewall allows port 5000
3. Check PM2 logs: `pm2 logs collabcanvas`
4. Restart service: `pm2 restart collabcanvas`

### SSL Certificate errors

**Solution:**
1. Check certificate expiry: `sudo certbot certificates`
2. Force renewal: `sudo certbot renew --force-renewal`
3. Restart Nginx: `sudo systemctl restart nginx`

### High memory/CPU usage

**Solution:**
1. Check processes: `pm2 monit`
2. Restart server: `pm2 restart collabcanvas`
3. Check for memory leaks in logs: `pm2 logs`

### "502 Bad Gateway"

**Solution:**
1. SSH into Oracle and check: `pm2 status`
2. Restart: `pm2 restart collabcanvas`
3. Check Nginx: `sudo systemctl status nginx`
4. Restart Nginx: `sudo systemctl restart nginx`

---

## 📈 Monitoring Commands

Keep these handy for daily monitoring:

```bash
# SSH into Oracle instance
ssh -i ssh-key-*.key ubuntu@ORACLE_IP

# Check service status
pm2 status

# View recent logs
pm2 logs collabcanvas --tail 20

# Monitor in real-time
pm2 monit

# Check Nginx status
sudo systemctl status nginx

# Check SSL cert expiry
sudo certbot certificates

# Restart everything
pm2 restart all
sudo systemctl restart nginx
```

---

## 💰 Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| Oracle Cloud | FREE | Always free tier |
| Vercel | FREE | Free tier for hobbyists |
| MongoDB Atlas | FREE | 512MB for free tier |
| Domain | $10-15/yr | Optional, from Namecheap/GoDaddy |
| SSL | FREE | Let's Encrypt |
| **Total** | **~$10-15/yr** | Just for domain |

---

## ✨ Final Checklist Before Going Live

- [ ] Backend running on Oracle instance
- [ ] Frontend deployed on Vercel
- [ ] Custom domain configured
- [ ] SSL certificate installed
- [ ] Environment variables set correctly
- [ ] Frontend connects to backend
- [ ] WebSocket connections work
- [ ] Sign up/Login functionality works
- [ ] Database backups enabled
- [ ] Monitoring set up
- [ ] Error logs accessible

---

## 🎉 You're Live!

Your CollabCanvas app is now deployed:

- **Frontend:** `https://your-domain.vercel.app`
- **Backend API:** `https://api.your-domain.com`
- **WebSocket:** `wss://api.your-domain.com/socket.io`

### Next Steps:

1. Share with friends to test
2. Monitor logs regularly
3. Set up backups
4. Add more features
5. Scale as needed

---

## 🔗 Quick Reference Links

- **Vercel Dashboard:** https://vercel.com
- **Oracle Cloud Console:** https://cloud.oracle.com
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Let's Encrypt:** https://letsencrypt.org/
- **PM2 Docs:** https://pm2.keymetrics.io/

---

**Questions?** Check the troubleshooting section above or refer to the individual service documentation.

**Happy deploying! 🚀**
