# ⚡ Quick Start: Vercel + Oracle Deployment

**Complete this checklist in order. Estimated time: 1-2 hours**

---

## 🔧 PART 1: Local Preparation (10 mins)

- [ ] Create/update `client/vercel.json` (done ✅)
- [ ] Update `server/.env.production` with placeholder values
- [ ] Push to GitHub:
  ```bash
  git add .
  git commit -m "Deployment ready"
  git push origin main
  ```

---

## ☁️ PART 2: Oracle Cloud Setup (20 mins)

### Create Instance
- [ ] Create Oracle Cloud account (free tier)
- [ ] Create **Ubuntu 22.04** compute instance (Always Free)
- [ ] Download SSH key and save it safely
- [ ] Get instance **Public IP Address**

### Allow Traffic
- [ ] Go to VCN → Security Lists
- [ ] Add **Ingress Rules:**
  - [ ] Port 80 (HTTP)
  - [ ] Port 443 (HTTPS)
  - [ ] Port 5000 (Backend)

### Connect to Instance
```bash
# Once instance is running
chmod 600 /path/to/ssh-key.key
ssh -i /path/to/ssh-key.key ubuntu@YOUR_ORACLE_IP
```

---

## 🖥️ PART 3: Install on Oracle Instance (20 mins)

Run these commands **one by one** on your Oracle instance:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify

# 3. Install PM2 (process manager)
sudo npm install -g pm2

# 4. Install Nginx
sudo apt install -y nginx

# 5. Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📦 PART 4: Deploy Backend (15 mins)

Run these on your Oracle instance:

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/collabcanvas.git
cd collabcanvas/server

# 2. Install dependencies
npm install

# 3. Create .env file
nano .env
```

**Paste this into .env:**
```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://YOUR_MONGO_USERNAME:YOUR_MONGO_PASSWORD@YOUR_CLUSTER.mongodb.net/collabcanvas?retryWrites=true&w=majority
JWT_SECRET=<GENERATE_BELOW>
CLIENT_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
```

**Generate JWT_SECRET (copy output):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save file:** `Ctrl+X` → `Y` → `Enter`

```bash
# 4. Start backend
pm2 start server.js --name "collabcanvas"
pm2 status  # Verify running

# 5. Enable auto-restart
pm2 startup
pm2 save
```

---

## 🌐 PART 5: Setup Nginx & SSL (20 mins)

On your Oracle instance:

```bash
# 1. Create Nginx config
sudo nano /etc/nginx/sites-available/collabcanvas
```

**Paste this:**
```nginx
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name api.YOUR_DOMAIN.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.YOUR_DOMAIN.com;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io {
        proxy_pass http://backend/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Save:** `Ctrl+X` → `Y` → `Enter`

```bash
# 2. Enable site
sudo ln -s /etc/nginx/sites-available/collabcanvas /etc/nginx/sites-enabled/

# 3. Test & restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 4. Get SSL certificate (replace domain)
sudo certbot certonly --nginx -d api.YOUR_DOMAIN.com

# 5. Update Nginx config with SSL paths
sudo nano /etc/nginx/sites-available/collabcanvas
```

**Add after `listen 443 ssl http2;`:**
```nginx
ssl_certificate /etc/letsencrypt/live/api.YOUR_DOMAIN.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.YOUR_DOMAIN.com/privkey.pem;
```

**Save and restart:**
```bash
sudo systemctl restart nginx
```

---

## 🚀 PART 6: Deploy Frontend on Vercel (15 mins)

### Connect Vercel to GitHub

1. Go to https://vercel.com
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Select your **collabcanvas** repository
5. Click **"Import"**

### Configure Project

1. **Root Directory:** Select `client` from dropdown
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. Click **"Deploy"** and wait...

Once deployed, you'll get a URL like: `https://collabcanvas-xxxxx.vercel.app`

---

## 🔗 PART 7: Connect Frontend to Backend (10 mins)

### Add Environment Variables in Vercel

1. In Vercel Dashboard: **Settings → Environment Variables**
2. Add two variables:

   **Production:**
   ```
   VITE_SOCKET_URL = https://api.YOUR_DOMAIN.com
   VITE_API_URL = https://api.YOUR_DOMAIN.com
   ```

   **Development/Preview:**
   ```
   VITE_SOCKET_URL = http://localhost:5000
   VITE_API_URL = http://localhost:5000
   ```

3. **Deployments → Redeploy** the latest deployment

---

## 🌍 PART 8: Connect Your Domain (if you have one)

### At Your Domain Registrar (GoDaddy, Namecheap, etc.)

**Create A Records:**

```
Subdomain: api
Type: A
Value: YOUR_ORACLE_IP_ADDRESS

Subdomain: www (optional, for Vercel)
Type: CNAME
Value: cname.vercel-dns.com
```

**Wait 24 hours for DNS to propagate** (usually 5-30 mins)

### Verify Connection

```bash
# Test backend is responding
curl -X GET https://api.YOUR_DOMAIN.com/

# Should return:
# {"status":"ok","message":"Server is running"}
```

---

## ✅ PART 9: Test Everything (10 mins)

### Test Backend

- [ ] Visit `https://api.YOUR_DOMAIN.com/` → See JSON response
- [ ] SSH into Oracle and check: `pm2 status` → Should show "online"
- [ ] Check logs: `pm2 logs collabcanvas`

### Test Frontend

- [ ] Visit your Vercel URL: `https://YOUR_VERCEL_DOMAIN.vercel.app`
- [ ] Try to **Sign Up** → Should work
- [ ] Try to **Login** → Should work
- [ ] Open browser console (F12) → No CORS errors

### Test WebSocket

Paste in browser console (F12):

```javascript
const socket = io('https://api.YOUR_DOMAIN.com');
socket.on('connect', () => console.log('✅ WebSocket Connected!'));
socket.on('connect_error', (err) => console.log('❌ Error:', err));
```

Should see: `✅ WebSocket Connected!`

---

## 🎯 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't SSH to Oracle | Check security group rules, use correct IP, verify SSH key permissions |
| Backend not responding | SSH in and run `pm2 status` then `pm2 logs` |
| WebSocket errors | Verify Nginx config has Socket.IO proxy settings |
| CORS errors | Update `CLIENT_URL` in backend `.env` |
| Vercel build fails | Check `client/package.json` dependencies, verify `npm run build` works locally |
| SSL certificate issue | Run `sudo certbot renew --force-renewal` |

---

## 🔑 Important IPs & Domains to Save

```
Oracle Instance IP:     203.0.113.45 (example, replace with yours)
Backend Domain:         api.your-domain.com
Frontend URL:           your-project.vercel.app
MongoDB Connection:     mongodb+srv://...

SSH Key Location:       /path/to/ssh-key.key
Backend Port:           5000
Frontend Static Build:  client/dist/
```

---

## 📊 Post-Deployment Checklist

- [ ] Backend running on Oracle
- [ ] Frontend on Vercel
- [ ] Custom domain pointing to Oracle IP
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] WebSocket connections work
- [ ] Signup/Login working
- [ ] Database backups enabled (MongoDB Atlas)
- [ ] PM2 auto-restart configured
- [ ] SSL auto-renewal configured

---

## 🎉 Success!

Your app is now live at:
- **Frontend:** `https://your-domain.vercel.app`
- **Backend:** `https://api.your-domain.com`

**Bookmark this command to check server status:**

```bash
ssh -i /path/to/ssh-key.key ubuntu@YOUR_ORACLE_IP && pm2 status
```

---

**Estimated Costs:**
- ✅ Oracle Cloud: FREE (Always free tier)
- ✅ Vercel: FREE (hobbyist tier)
- ✅ MongoDB: FREE (512MB)
- ✅ Domain: $10-15/year (optional)
- **Total: FREE to $15/year**

---

**Need help with a specific step? Go back to the full guide: `VERCEL_ORACLE_DEPLOYMENT.md`**

**Now you're live! Share your app! 🚀**
