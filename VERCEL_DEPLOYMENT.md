# Vercel Frontend Deployment Guide

## Step 1: Sign Up / Log In to Vercel

1. Go to https://vercel.com/
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub repositories

---

## Step 2: Import Your Project

1. On the Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find and select your repository: **`university-grade-portal`**
3. Click **"Import"**

---

## Step 3: Configure Project Settings

### **Framework Preset**
- Vercel should auto-detect **Vite** - if not, select it manually

### **Root Directory** ⚠️ IMPORTANT
1. Click **"Edit"** next to "Root Directory"
2. Select **`react-grade`** folder
3. This tells Vercel to build only the frontend, not the entire repo

### **Build Settings** (Should auto-fill, but verify):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## Step 4: Add Environment Variables

Click **"Environment Variables"** section and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://university-grade-portal.onrender.com/api` |

**Important**: Replace `university-grade-portal` with your actual Render service name if different.

---

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your URL (e.g., `https://university-grade-portal.vercel.app`)

---

## Step 6: Update Backend CORS

After deployment, update your Render backend:

1. Go to Render Dashboard → Your Service → **Environment**
2. Find `FRONTEND_URL` variable
3. Update it to your Vercel URL: `https://university-grade-portal.vercel.app`
4. Click **"Save Changes"**
5. Render will redeploy automatically

---

## Step 7: Test Your Application

1. Visit your Vercel URL
2. Try logging in with your admin credentials
3. Check if the frontend can communicate with the backend

---

## Troubleshooting

### Build Fails
- Check the build logs in Vercel
- Ensure `react-grade` is set as Root Directory
- Verify `package.json` has a `build` script

### CORS Errors
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- No trailing slash in the URL

### API Connection Errors
- Verify `VITE_API_URL` includes `/api` at the end
- Check that your Render backend is running

---

## Quick Reference

**Your URLs:**
- Frontend: `https://[your-project].vercel.app`
- Backend: `https://university-grade-portal.onrender.com`
- API: `https://university-grade-portal.onrender.com/api`

**Environment Variables:**
- Vercel: `VITE_API_URL=https://university-grade-portal.onrender.com/api`
- Render: `FRONTEND_URL=https://[your-project].vercel.app`
