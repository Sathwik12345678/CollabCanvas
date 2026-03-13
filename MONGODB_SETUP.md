# 🗄️ MongoDB Atlas Setup for Vercel + Oracle Deployment

Complete guide to set up MongoDB Atlas for your CollabCanvas backend.

---

## 📋 Prerequisites

- ✅ MongoDB Atlas account (free at https://www.mongodb.com/cloud/atlas)
- ✅ Your Oracle instance IP address
- ✅ Your Vercel deployment IP (optional)

---

## 🚀 PART 1: Create MongoDB Atlas Account

### Step 1: Sign Up

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Register"** or **"Sign In"** (if you have an account)
3. Create account with email/password or social login

### Step 2: Create Organization

1. After login, click **"Create an organization"**
2. Name it: `CollabCanvas`
3. Select your region
4. Click **"Next"**

### Step 3: Create a Project

1. Click **"New Project"** 
2. Project name: `collabcanvas`
3. Click **"Next"**
4. Click **"Create Project"**

---

## 🗄️ PART 2: Create a Cluster

### Step 1: Create Cluster

1. You should see "Create a Deployment" → Click **"Create"**
2. Choose deployment type → Select **"M0 Free"** (Always free)
3. Choose your cloud provider → **AWS** (recommended)
4. Choose region closest to you

### Step 2: Authentication

1. **Username:** `collabcanvas_user`
2. **Password:** Generate strong password (or use suggested)
   ```bash
   # Example strong password (20+ chars):
   CollabCanvas123!@#$%^&*()
   ```
3. **Save this password securely**
4. Click **"Create User"**

### Step 3: Network Whitelist

This allows your servers to connect to MongoDB.

1. Click **"Whitelist an IP Address"** (or go to Network Access)
2. Add these IPs:

   | IP Address | Description |
   |------------|-------------|
   | `YOUR_ORACLE_IP` | Your Oracle backend server |
   | `0.0.0.0/0` | Allow from anywhere (less secure) |

3. Click **"Confirm"**

### Step 4: Create Database

1. Click **"Create Database"**
2. Select **M0 (Free)** cluster tier
3. Choose region
4. Wait for database to initialize (2-5 minutes)

---

## 🔐 PART 3: Get Connection String

### Step 1: Find Connection String

1. After cluster is created, click **"Connect"**
2. Choose **"Connect your application"**
3. Select **"Node.js"** and version **4.0+**

### Step 2: Copy Connection String

You'll see something like:

```
mongodb+srv://collabcanvas_user:PASSWORD@collabcanvas.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Replace:**
- `PASSWORD` with your actual password
- Keep the rest as is

### Step 3: Add Database Name

Add `/collabcanvas` before the `?`:

```
mongodb+srv://collabcanvas_user:your-password@collabcanvas.xxxxx.mongodb.net/collabcanvas?retryWrites=true&w=majority
```

**Final format:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

---

## 🔗 PART 4: Add to Your Backend

### Step 1: Update Oracle Backend

SSH into your Oracle instance:

```bash
ssh -i /path/to/ssh-key.key ubuntu@YOUR_ORACLE_IP
cd collabcanvas/server
```

### Step 2: Update .env File

```bash
nano .env
```

Find this line:
```
MONGO_URI=
```

Replace with your MongoDB connection string:

```
MONGO_URI=mongodb+srv://collabcanvas_user:your-password@collabcanvas.xxxxx.mongodb.net/collabcanvas?retryWrites=true&w=majority
```

**IMPORTANT:** 
- Your password may have special characters like `@#$%`
- If it does, URL-encode them. E.g., `@` = `%40`, `#` = `%23`

### Step 3: Restart Backend

```bash
pm2 restart collabcanvas
pm2 logs collabcanvas
```

You should see:
```
✅ MongoDB Connected
```

---

## ⚙️ PART 5: MongoDB Configuration Best Practices

### Enable Backups

1. In MongoDB Atlas: **Cluster → Backup**
2. Click **"Enable Cloud Backups"**
3. Set retention to **35 days**
4. Backups are automatic every day

### Enable Monitoring

1. Go to **Monitoring**
2. Enable **Database Monitoring**
3. View metrics like:
   - Operations per second
   - Memory usage
   - Connection count

### Create Additional Users (Optional)

For security, create a read-only user:

1. **Database Access → Add New Database User**
2. Username: `collabcanvas_readonly`
3. Password: Generate
4. Add role: **readAnyDatabase**
5. Save

---

## 🧪 PART 6: Test Database Connection

### From Your Oracle Backend

```bash
# SSH into Oracle
ssh -i /path/to/ssh-key.key ubuntu@YOUR_ORACLE_IP
cd collabcanvas/server

# Test connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.log('❌ Error:', err.message));
"
```

Expected output: `✅ Connected to MongoDB!`

### From Local Machine

```bash
# Test connection string locally
npm install mongodb

node -e "
const { MongoClient } = require('mongodb');
const uri = 'YOUR_CONNECTION_STRING_HERE';

const client = new MongoClient(uri);
client.connect()
  .then(() => {
    console.log('✅ Connected to MongoDB!');
    client.close();
  })
  .catch(err => console.log('❌ Error:', err.message));
"
```

---

## 🔍 PART 7: Verify Data Creation

### Check Collections

1. In MongoDB Atlas, go to **Browse Collections**
2. After user signup, you should see:
   - Database: `collabcanvas`
   - Collection: `users`
   - Documents: Your signed-up users

### View User Data

1. Click on **users** collection
2. You'll see documents like:
   ```json
   {
     "_id": "....",
     "name": "John Doe",
     "email": "john@example.com",
     "password": "hashed_password...",
     "createdAt": "2024-03-06T10:30:00.000Z"
   }
   ```

---

## 🐛 PART 8: Troubleshooting

### Connection Refused

**Problem:** `MongoDB connection refused`

**Solutions:**
1. Verify IP whitelist includes your Oracle IP
2. Check username/password in connection string
3. Ensure MongoDB cluster is running
4. Wait 5 minutes for network rule propagation

### Authentication Failed

**Problem:** `Error: authentication failed`

**Solutions:**
1. Check username is `collabcanvas_user`
2. Verify password is correct
3. If password has special chars, URL-encode them
4. Reset password: **Database Access → Edit User**

### Connection Timeout

**Problem:** `Timeout waiting for connection`

**Solutions:**
1. Ensure your IP is whitelisted
2. Try whitelisting `0.0.0.0/0` temporarily for testing
3. Check firewall settings on Oracle instance
4. Verify Nginx is not blocking outbound

### Database Not Found

**Problem:** `Database does not exist`

**Solutions:**
1. Ensure `/collabcanvas` is in connection string
2. Collections auto-create on first write
3. If not created, data wasn't written (check server logs)

---

## 📊 Monitoring MongoDB

### View Metrics

1. Go to **Cluster → Metrics**
2. Watch:
   - **Connections:** Should be 1 (your backend)
   - **Operations/sec:** Activity on cluster
   - **Memory:** Should be low on free tier
   - **Disk usage:** Growth over time

### Check Activity

1. Go to **Activity Feed**
2. See recent operations
3. Verify your backend is reading/writing

### View Logs

1. Go to **Logs**
2. Filter by:
   - **Authentication & Authorization**
   - **Connection String Access History**
   - **Error Logs**

---

## 🔐 Security Best Practices

### Whitelist Only Necessary IPs

❌ **Don't do this (open to everyone):**
```
0.0.0.0/0
```

✅ **Do this instead:**
```
203.0.113.45        (Your Oracle instance)
203.0.113.46        (Your backup server, if any)
```

### Use Strong Passwords

✅ **Strong password example:**
```
CollabCanvasDB$Production#2024!@99
```

❌ **Don't use:** `password123`, `mongodb`, `123456`

### Enable Network Encryption

- ✅ MongoDB Atlas always uses TLS/SSL
- ✅ Connection strings start with `mongodb+srv://`
- ✅ All data in transit is encrypted

---

## 💾 PART 9: Backup Strategy

### Automatic Backups

MongoDB Atlas provides:
- ✅ Automatic daily backups
- ✅ 35-day retention (free tier)
- ✅ Point-in-time recovery

### Manual Backup (for critical data)

1. In MongoDB Atlas: **Backup → On-Demand Backup**
2. Click **"Create Backup Now"**
3. Backups are retained as long as cluster exists

### Restore from Backup

If needed:
1. **Backup → Restore**
2. Choose backup date
3. Restore to new cluster or existing
4. Follow restore wizard

---

## 📈 Scaling Tips

When you reach free tier limits:

| Metric | Free Tier | Paid Tier |
|--------|-----------|-----------|
| Storage | 512 MB | 100+ GB |
| Connections | Limited | Unlimited |
| Throughput | Limited | High |
| Cost | FREE | $0.10+/hour |

To upgrade:
1. **Cluster → Configuration**
2. Upgrade from M0 to M2, M5, etc.
3. Backups from M0 can restore to paid tiers

---

## ✅ MongoDB Checklist

Before going live:

- [ ] MongoDB cluster created (M0 free)
- [ ] User created with strong password
- [ ] IP whitelisted (your Oracle IP)
- [ ] Connection string verified
- [ ] Connection string in `.env`
- [ ] Backend restarted with new .env
- [ ] Test connection successful
- [ ] First user signup works
- [ ] Data appears in collections
- [ ] Backups enabled
- [ ] Monitor access configured

---

## 🔗 Useful MongoDB Atlas URLs

- **Dashboard:** https://cloud.mongodb.com/
- **Connection Wizard:** Cluster → Connect
- **Database Access:** Security → Database Access
- **Network Access:** Security → Network Access
- **Backup:** Cluster → Backup

---

## 📝 Connection String Format Reference

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER_NAME.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority&ssl=true

Example:
mongodb+srv://collabcanvas_user:MyPassword123@collabcanvas.a1b2c3d.mongodb.net/collabcanvas?retryWrites=true&w=majority
```

---

## 🎉 You're Connected!

Once your backend logs show:
```
✅ MongoDB Connected
```

Your database is ready for production use.

---

**Need help?** Check MongoDB Atlas documentation: https://docs.atlas.mongodb.com/

