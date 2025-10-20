# ⚡ Render Deployment Quick Start Guide

**5-minute guide to deploy EasyLuxury-Go to Render**

---

## 🎯 What You'll Deploy

- **Backend:** Node.js API (Express + Socket.IO)
- **Frontend:** React App (Vite)
- **Database:** MongoDB Atlas (already configured)

---

## 📝 Quick Steps

### 1️⃣ Push to GitHub (2 minutes)

```bash
cd c:\Users\gajer\OneDrive\Desktop\easyLuxury-Go
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2️⃣ Deploy Backend (3 minutes)

1. Go to [render.com](https://render.com) → Sign up/Login
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → Select `easyLuxury-Go` repository
4. Configure:
   - **Name:** `easyluxury-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables (click "Advanced"):

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://gajeraakshit53_db_user:lvbGcIFW0ul5Bao6@akshit.thyfwea.mongodb.net/easyLuxuryGo
JWT_SECRET=easyLuxuryGo_SecureJWT_2024_akshit_@#$%^&*()_production_key
ADMIN_EMAIL=admin@easyLuxuryGo.com
ADMIN_PASSWORD=Admin@12345
ADMIN_PASSWORD_HASH=$2a$12$JP3JNA1LXeLriLPsqruMIOZ/3OJDukgo9Q5lfCvvTqj.8r4bF3GLe
EMAIL_USER=smitgadhiya35@gmail.com
EMAIL_PASSWORD=Smit@1234
FRONTEND_URL=
```

6. Click **"Create Web Service"**
7. **Wait 5-10 minutes** for deployment
8. **Copy your backend URL:** `https://easyluxury-backend-XXXX.onrender.com`

### 3️⃣ Deploy Frontend (3 minutes)

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   - **Name:** `easyluxury-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add Environment Variables:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com/api/v1
VITE_SOCKET_URL=https://YOUR-BACKEND-URL.onrender.com
VITE_MAPTILER_API_KEY=SdB5QsxRfJUAfdzMgw5u
```

> Replace `YOUR-BACKEND-URL` with URL from step 2.8

5. Add **Rewrite Rule** (under Advanced):
   - Source: `/*`
   - Destination: `/index.html`
   - Type: `Rewrite`
6. Click **"Create Static Site"**
7. **Copy your frontend URL:** `https://easyluxury-frontend-XXXX.onrender.com`

### 4️⃣ Update Backend with Frontend URL (1 minute)

1. Go to Backend Service → Environment
2. Update `FRONTEND_URL` with your frontend URL from step 3.7
3. Save → Auto-redeploys

---

## ✅ Test Your Deployment

1. **Backend Health Check:**
   ```
   https://YOUR-BACKEND-URL.onrender.com/api/v1/health
   ```
   Should return: `{"success": true, ...}`

2. **Frontend:**
   ```
   https://YOUR-FRONTEND-URL.onrender.com
   ```
   Should load the homepage

3. **Login as Admin:**
   - Email: `admin@easyLuxuryGo.com`
   - Password: `Admin@12345`

---

## 🔥 Important Notes

### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Network Access** → **IP Access List** → Add IP
3. Add `0.0.0.0/0` (Allow from anywhere)
4. This allows Render to connect to your database

### Free Tier Limitations
- ⚠️ Backend sleeps after 15 minutes of inactivity
- ⚠️ First request after sleep takes ~30 seconds
- ✅ Perfect for testing and demos
- 💡 Upgrade to paid tier ($7/month) for 24/7 uptime

---

## 🛠️ Your Deployment URLs

Fill these in after deployment:

**Backend:** `https://___________________________.onrender.com`

**Frontend:** `https://___________________________.onrender.com`

---

## 🐛 Common Issues & Fixes

### "Build Failed"
- Check build command is correct
- Verify package.json exists in correct directory

### "CORS Error"
- Ensure `FRONTEND_URL` is set in backend
- Check URL format (no trailing slash)

### "Database Connection Failed"
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `MONGO_URI` is correct in backend env vars

### "Blank Page on Frontend"
- Ensure Rewrite Rule is set (/*  → /index.html)
- Check browser console for errors

---

## 📚 Full Documentation

- **Complete Guide:** See `RENDER_DEPLOYMENT_GUIDE.md`
- **Checklist:** See `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting:** See full guide for detailed solutions

---

## 🚀 Updates After Deployment

```bash
# Make changes
git add .
git commit -m "Your update"
git push origin main

# Render auto-deploys! 🎉
```

---

## 💡 Pro Tips

1. **Bookmark your Render dashboard** for quick access to logs
2. **Use UptimeRobot** (free) to ping your app every 14 min (prevents sleep)
3. **Check logs** if something doesn't work - they're very helpful!
4. **Test locally first** - ensure everything works before deploying

---

## ⏱️ Total Time: ~10-15 minutes

✅ **Backend:** 5-10 minutes
✅ **Frontend:** 5-10 minutes
✅ **Configuration:** 1-2 minutes

---

**Need help?** Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions!

**Deployment Date:** _______________

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete ✅
