# Frontend Deployment on Vercel

This guide explains how to deploy the CollabCanvas frontend to Vercel.

## Prerequisites

- Vercel account (create at https://vercel.com)
- GitHub account (already connected to Vercel)
- Backend deployed (we're using: https://canvascollab-4.onrender.com)

## Quick Deployment Steps

### Step 1: Connect to Vercel with GitHub

1. Go to https://vercel.com/login
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Repository

1. In Vercel Dashboard, click **"Add New"** → **"Project"**
2. Search for **"Canvascollab"** repository
3. Click **"Import"**

### Step 3: Configure Build Settings

1. **Framework Preset:** Select **"Vite"** (it might auto-detect)
2. **Build Command:** `npm run build` ✓ (should be pre-filled)
3. **Output Directory:** `dist` ✓ (should be pre-filled)
4. **Install Command:** `npm install` ✓

### Step 4: Set Environment Variables

**IMPORTANT:** Before clicking Deploy, add environment variables:

1. Expand **"Environment Variables"** section
2. Add these variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://canvascollab-4.onrender.com` |
| `VITE_SOCKET_URL` | `https://canvascollab-4.onrender.com` |

3. Click **"Deploy"**

### Step 5: Wait for Deployment

- Vercel will automatically build and deploy from the `master` branch
- You'll get a live URL like: `https://canvascollab-xxxx.vercel.app`
- Deployment usually takes 1-2 minutes

## Automatic Deployments

After initial setup, every push to `master` branch will automatically redeploy.

To see deployments:
1. Go to your Vercel Dashboard
2. Click on the **Canvascollab** project
3. View deployment history under **"Deployments"** tab

## Connecting Frontend to Backend

The frontend is already configured to connect to the backend URLs you provided via environment variables:

```javascript
// client/src/api/api.js uses:
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// client/src/socket/socket.js uses:
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"
```

## Troubleshooting

### Issue: "VITE_API_URL is not defined"

**Solution:** Make sure you've set the environment variables in Vercel before deploying.

### Issue: Frontend can't connect to backend

**Solution:** 
1. Check that backend is running: `curl https://canvascollab-4.onrender.com/api/health`
2. Verify environment variables in Vercel project settings
3. Check browser console (F12) for CORS errors

### Issue: Build fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Make sure `npm run build` works locally: `cd client && npm run build`
3. Verify all dependencies are in package.json

## Manual Redeployment

To manually redeploy without code changes:
1. Go to Vercel Dashboard
2. Click on the Canvascollab project
3. Find the latest deployment
4. Click **"..."** → **"Redeploy"**

## Live URLs

- **Frontend:** will be provided after deployment
- **Backend:** https://canvascollab-4.onrender.com
- **Repository:** https://github.com/Sathwik12345678/Canvascollab

---

For more help, visit: https://vercel.com/docs
