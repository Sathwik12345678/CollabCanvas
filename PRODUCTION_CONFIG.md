# Production Configuration Guide

This guide provides step-by-step instructions for preparing CollabCanvas for production deployment.

## 📋 Pre-Deployment Checklist

### 1. Code Quality
- [ ] Run `npm run lint` and fix all warnings
- [ ] Check no hardcoded credentials remain
- [ ] Review error messages are user-friendly
- [ ] Verify all API endpoints have validation

### 2. Environment Setup
- [ ] Create production `.env` file with proper values
- [ ] Generate strong JWT_SECRET (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Set NODE_ENV=production
- [ ] Verify all required environment variables are set

### 3. Database
- [ ] Create MongoDB Atlas cluster
- [ ] Add IP whitelist (or 0.0.0.0 for any)
- [ ] Create database user with strong password
- [ ] Test connection from production server
- [ ] Enable backups in MongoDB Atlas

### 4. Security
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up firewall rules
- [ ] Configure CORS correctly (specific domain, not wildcard)
- [ ] Enable rate limiting if needed
- [ ] Set up DDoS protection

### 5. Monitoring
- [ ] Set up error logging (e.g., Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Create alerts for critical errors

## 🔐 Generating Secrets

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate Secure Password
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 📦 Building for Production

### Client Build
```bash
cd client
npm run build
```

This creates an optimized `dist/` folder with:
- Minified JavaScript
- CSS bundling
- Asset optimization
- Build size analysis

### Server Preparation
```bash
cd server
npm install --production  # Only production dependencies
npm audit fix              # Fix known vulnerabilities
```

## 🚀 Server Startup Configuration

### Using PM2 (Recommended)
```bash
npm install -g pm2

# Start application
pm2 start server.js --name "collabcanvas" --watch

# Enable startup on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Using Systemd (Linux)
Create `/etc/systemd/system/collabcanvas.service`:
```ini
[Unit]
Description=CollabCanvas Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/collabcanvas/server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable collabcanvas
systemctl start collabcanvas
systemctl status collabcanvas
```

## 🌐 Nginx Configuration

### Reverse Proxy Setup
```nginx
upstream collabcanvas_backend {
    server localhost:5000;
}

upstream collabcanvas_frontend {
    server localhost:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate (Let's Encrypt recommended)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_types text/css text/javascript application/javascript;
    gzip_level 9;

    # API Routes
    location /api {
        proxy_pass http://collabcanvas_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://collabcanvas_backend/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://collabcanvas_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets - cache forever
    location ~* \.(css|js|png|jpg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## 🔒 SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## 📊 Production Environment Variables

### Server `.env.production`
```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collabcanvas?retryWrites=true&w=majority
JWT_SECRET=<generate-strong-secret-here>
CLIENT_URL=https://yourdomain.com
```

### Client Build-time Variables
```bash
# .env.production
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

## 🧪 Testing Production Setup

### Test Server Health
```bash
curl -X GET https://yourdomain.com
curl -X GET https://yourdomain.com/api/health
```

### Test WebSocket Connection
```javascript
// In browser console
const socket = io('https://yourdomain.com', {
    reconnection: true
});
socket.on('connect', () => console.log('Connected'));
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/

# Using wrk
wrk -t12 -c400 -d30s https://yourdomain.com/
```

## 📈 Performance Optimization

### Client-side
- ✅ Code splitting enabled in Vite
- ✅ CSS minification
- ✅ JavaScript minification
- ✅ Image optimization
- ✅ Lazy loading for routes

### Server-side
- ✅ Connection pooling for MongoDB
- ✅ Response compression (gzip)
- ✅ Caching strategies
- ✅ Database indexes

## 🚨 Monitoring & Logging

### Using PM2 Plus
```bash
pm2 plus
# Provides real-time monitoring, logging, and performance analysis
```

### Using Sentry (Error Tracking)
```bash
npm install @sentry/node

# In server.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Log Aggregation
```bash
# Using pm2-log aggregation
pm2 install pm2-auto-install
```

## 🔄 Backup Strategy

### MongoDB Backups
- Enable continuous backups in MongoDB Atlas
- Set backup retention to 35 days
- Test restore procedures monthly

### Database Dump
```bash
# Local backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/collabcanvas"

# Automated backup (cron job)
0 2 * * * /usr/local/bin/mongodump --uri="..." --out /backups/mongodump-$(date +\%Y\%m\%d)
```

## 🆘 Troubleshooting Production Issues

### High Memory Usage
```bash
pm2 monit  # Check memory and CPU
pm2 kill   # Force restart if needed
```

### WebSocket Connection Issues
- Check Nginx socket.io configuration
- Verify proxy_buffering is off
- Enable proxy upgrade headers

### Database Connection Errors
- Verify IP whitelist in MongoDB Atlas
- Check network connectivity
- Verify credentials in .env

### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -enddate -noout -in /path/to/cert.pem

# Force renewal
sudo certbot renew --force-renewal
```

## ✅ Final Checklist Before Going Live

- [ ] Environment variables all set correctly
- [ ] Database backups configured
- [ ] SSL certificate installed
- [ ] Monitoring/logging configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error pages configured
- [ ] Favicon and branding set
- [ ] DNS records configured
- [ ] Email notifications set up
- [ ] CDN configured (optional)
- [ ] Database indexes created
- [ ] Load testing completed
- [ ] Backup restore tested
- [ ] Team trained on deployment

## 🎉 You're Production Ready!

Your CollabCanvas application is ready for production. Monitor the application closely for the first few days to catch any issues early.

---

**Emergency Contacts:**
- Database: MongoDB Support
- Server: Your hosting provider support
- Monitoring: Check PM2 dashboard

