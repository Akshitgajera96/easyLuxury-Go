# 🚀 Complete Render Deployment Guide for EasyLuxury-Go

This guide will walk you through deploying your full-stack MERN application (MongoDB + Express + React + Node.js) to Render.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. ✅ **GitHub Account** - Your code must be in a GitHub repository
2. ✅ **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. ✅ **MongoDB Atlas** - Your database is already configured (connection string in backend/.env)
4. ✅ **MapTiler API Key** - For live bus tracking (you already have one)

---

## 🎯 Deployment Strategy

We'll deploy **TWO services** on Render:

1. **Backend Service** (Web Service) - Node.js/Express API with Socket.IO
2. **Frontend Service** (Static Site) - React application built with Vite

---

## 📦 Step 1: Prepare Your Repository

### 1.1 Push Your Code to GitHub

```bash
# Navigate to your project root
cd c:\Users\gajer\OneDrive\Desktop\easyLuxury-Go

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/easyLuxury-Go.git

# Push to GitHub
git push -u origin main
```

> **Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

### 1.2 Verify Files Are Ready

Make sure these files exist in your repository:
- ✅ `render.yaml` (already created)
- ✅ `backend/package.json`
- ✅ `frontend/package.json`
- ✅ `backend/server.js`
- ✅ `frontend/vite.config.ts`

---

## 🔧 Step 2: Deploy Backend Service

### 2.1 Create Backend Web Service

1. **Go to Render Dashboard:** [https://dashboard.render.com](https://dashboard.render.com)

2. **Click "New +" → "Web Service"**

3. **Connect Your GitHub Repository:**
   - Click "Connect account" if first time
   - Select `easyLuxury-Go` repository
   - Click "Connect"

4. **Configure Backend Service:**

   | Field | Value |
   |-------|-------|
   | **Name** | `easyluxury-backend` |
   | **Region** | Choose closest to you (e.g., Oregon, Ohio, Frankfurt) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Plan** | `Free` |

5. **Add Environment Variables:**

   Click "Advanced" → "Add Environment Variable" and add these:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Required |
   | `PORT` | `10000` | Render uses port 10000 |
   | `MONGO_URI` | `mongodb+srv://gajeraakshit53_db_user:lvbGcIFW0ul5Bao6@akshit.thyfwea.mongodb.net/easyLuxuryGo?retryWrites=true&w=majority` | Your MongoDB connection |
   | `JWT_SECRET` | `easyLuxuryGo_SecureJWT_2024_akshit_@#$%^&*()_production_key` | Keep secure |
   | `ADMIN_EMAIL` | `admin@easyLuxuryGo.com` | Admin login |
   | `ADMIN_PASSWORD` | `Admin@12345` | Admin password |
   | `ADMIN_PASSWORD_HASH` | `$2a$12$JP3JNA1LXeLriLPsqruMIOZ/3OJDukgo9Q5lfCvvTqj.8r4bF3GLe` | Pre-hashed |
   | `MAX_LOGIN_ATTEMPTS` | `5` | Security |
   | `LOGIN_RATE_LIMIT_WINDOW` | `15` | Security |
   | `EMAIL_USER` | `smitgadhiya35@gmail.com` | Email notifications |
   | `EMAIL_PASSWORD` | `Smit@1234` | Email password |
   | `FRONTEND_URL` | *(Leave empty for now, add after frontend deployment)* | Will be your frontend URL |

6. **Click "Create Web Service"**

7. **Wait for Deployment** (5-10 minutes)

8. **Copy Your Backend URL:**
   - Once deployed, you'll see a URL like: `https://easyluxury-backend.onrender.com`
   - **SAVE THIS URL** - you'll need it for frontend configuration

9. **Test Your Backend:**
   - Visit: `https://easyluxury-backend.onrender.com/api/v1/health`
   - You should see: `{"success": true, "data": {...}}`

---

## 🎨 Step 3: Deploy Frontend Service

### 3.1 Create Frontend Static Site

1. **Go to Render Dashboard:** [https://dashboard.render.com](https://dashboard.render.com)

2. **Click "New +" → "Static Site"**

3. **Connect Same GitHub Repository:**
   - Select `easyLuxury-Go` repository
   - Click "Connect"

4. **Configure Frontend Service:**

   | Field | Value |
   |-------|-------|
   | **Name** | `easyluxury-frontend` |
   | **Region** | Same as backend (e.g., Oregon) |
   | **Branch** | `main` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

5. **Add Environment Variables:**

   Click "Advanced" → "Add Environment Variable":

   | Key | Value | Notes |
   |-----|-------|-------|
   | `VITE_API_BASE_URL` | `https://easyluxury-backend.onrender.com/api/v1` | Your backend URL from Step 2.8 |
   | `VITE_SOCKET_URL` | `https://easyluxury-backend.onrender.com` | Your backend URL (without /api/v1) |
   | `VITE_MAPTILER_API_KEY` | `SdB5QsxRfJUAfdzMgw5u` | Your MapTiler key |

   > **IMPORTANT:** Replace `easyluxury-backend.onrender.com` with YOUR actual backend URL from Step 2.8

6. **Add Rewrite Rule for React Router:**

   Under "Advanced" → "Redirects/Rewrites":
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Type:** `Rewrite`

7. **Click "Create Static Site"**

8. **Wait for Deployment** (5-10 minutes)

9. **Copy Your Frontend URL:**
   - Once deployed, you'll see a URL like: `https://easyluxury-frontend.onrender.com`
   - **This is your live application URL!**

---

## 🔄 Step 4: Update Backend with Frontend URL

### 4.1 Add Frontend URL to Backend

1. **Go to Backend Service:**
   - Dashboard → Select `easyluxury-backend`

2. **Environment Variables:**
   - Find `FRONTEND_URL` variable
   - Update value to: `https://easyluxury-frontend.onrender.com`
   - (Replace with YOUR actual frontend URL from Step 3.9)

3. **Save Changes** - This will trigger a redeploy (automatic)

---

## ✅ Step 5: Test Your Deployment

### 5.1 Test Backend Endpoints

Open these URLs in your browser:

1. **Health Check:**
   ```
   https://easyluxury-backend.onrender.com/api/v1/health
   ```
   Should return: `{"success": true, ...}`

2. **Root Endpoint:**
   ```
   https://easyluxury-backend.onrender.com/
   ```
   Should return welcome message

### 5.2 Test Frontend Application

1. **Open Your Frontend URL:**
   ```
   https://easyluxury-frontend.onrender.com
   ```

2. **Test Login:**
   - Click "Login"
   - Use admin credentials:
     - Email: `admin@easyLuxuryGo.com`
     - Password: `Admin@12345`

3. **Test Features:**
   - Search trips
   - View dashboard (as admin)
   - Test real-time seat selection
   - Check live bus tracking

### 5.3 Check Browser Console

- Open Developer Tools (F12)
- Check Console for errors
- Verify API calls are going to: `https://easyluxury-backend.onrender.com/api/v1`
- Check Network tab for Socket.IO connection

---

## 🎉 Deployment Complete!

Your application is now live:
- **Frontend:** `https://easyluxury-frontend.onrender.com`
- **Backend API:** `https://easyluxury-backend.onrender.com/api/v1`
- **Database:** MongoDB Atlas (managed separately)

---

## 🔍 Troubleshooting

### Backend Issues

#### "Build Failed" Error

**Problem:** Dependencies not installing

**Solution:**
```bash
# Check backend/package.json exists
# Verify Build Command is: npm install
# Check Start Command is: npm start
```

#### "Application Failed to Start"

**Problem:** Environment variables missing

**Solution:**
- Verify ALL environment variables are set (see Step 2.5)
- Especially check: `MONGO_URI`, `JWT_SECRET`, `PORT`

#### "Database Connection Failed"

**Problem:** MongoDB connection string incorrect

**Solution:**
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` to allow all)
- Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access From Anywhere

### Frontend Issues

#### "Blank Page" or "404 on Refresh"

**Problem:** React Router not configured

**Solution:**
- Check Rewrite Rule is set (Step 3.6)
- Source: `/*`, Destination: `/index.html`, Type: `Rewrite`

#### "API Calls Failing" or "CORS Error"

**Problem:** Backend URL not configured correctly

**Solution:**
- Check `VITE_API_BASE_URL` in frontend environment variables
- Ensure it includes `/api/v1` at the end
- Check `FRONTEND_URL` is set in backend environment variables
- Verify both services are deployed successfully

#### "Build Failed" in Frontend

**Problem:** Build command or dependencies issue

**Solution:**
```bash
# Verify Build Command is: npm install && npm run build
# Check Publish Directory is: dist
# Ensure frontend/package.json has "build" script
```

### Socket.IO Issues

#### "Real-time Features Not Working"

**Problem:** Socket.IO connection failed

**Solution:**
- Check `VITE_SOCKET_URL` is set correctly (backend URL without /api/v1)
- Verify Socket.IO is allowed through CORS (already configured)
- Check browser console for WebSocket errors

### Free Tier Limitations

#### "Service Spinning Down"

**Problem:** Render free tier services sleep after 15 minutes of inactivity

**Solution:**
- First request after sleep takes ~30 seconds
- Consider upgrading to paid tier for 24/7 uptime
- Or use a service like UptimeRobot to ping every 14 minutes

---

## 🔒 Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` files to GitHub
- ✅ Use Render's environment variables feature
- ✅ Keep JWT_SECRET secure and random

### 2. MongoDB Security

- ✅ Use MongoDB Atlas (managed service)
- ✅ Set IP whitelist in production (currently set to all)
- ✅ Use strong database passwords

### 3. API Security

- ✅ Rate limiting is already configured
- ✅ CORS is configured to allow only your frontend
- ✅ JWT authentication is implemented

---

## 📊 Monitoring & Logs

### View Logs

1. **Backend Logs:**
   - Dashboard → `easyluxury-backend` → Logs tab
   - Check for startup messages and errors

2. **Frontend Logs:**
   - Dashboard → `easyluxury-frontend` → Logs tab
   - Check for build errors

### Monitor Performance

1. **Render Metrics:**
   - Dashboard → Select service → Metrics tab
   - View CPU, memory, and request metrics

2. **MongoDB Atlas:**
   - [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
   - Monitor database connections and queries

---

## 🔄 Updating Your Application

### Deploy Updates

1. **Make Changes Locally:**
   ```bash
   # Make your code changes
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **Automatic Deployment:**
   - Render automatically detects GitHub pushes
   - Backend and frontend redeploy automatically
   - Watch logs to confirm deployment success

### Manual Redeploy

1. **Go to Service Dashboard**
2. **Click "Manual Deploy" → "Deploy latest commit"**

---

## 💰 Cost Breakdown

### Free Tier (Current Setup)

- **Backend Web Service:** Free (750 hours/month)
- **Frontend Static Site:** Free (100 GB bandwidth/month)
- **MongoDB Atlas:** Free (512 MB storage)
- **Total:** $0/month

### Limitations

- Backend sleeps after 15 min inactivity
- 750 hours = ~31 days (single instance)
- Slower startup after sleep (~30 seconds)

### Paid Tier (Optional Upgrade)

- **Backend Web Service:** $7/month (always on)
- **Frontend Static Site:** Still free
- **Benefits:** 24/7 uptime, faster performance

---

## 📱 Custom Domain (Optional)

### Add Custom Domain

1. **Purchase Domain** (e.g., from Namecheap, GoDaddy)

2. **Add to Frontend:**
   - Dashboard → `easyluxury-frontend` → Settings → Custom Domains
   - Add domain: `www.yourdomain.com`
   - Follow DNS configuration instructions

3. **Add to Backend:**
   - Dashboard → `easyluxury-backend` → Settings → Custom Domains
   - Add domain: `api.yourdomain.com`

4. **Update Environment Variables:**
   - Frontend: `VITE_API_BASE_URL` → `https://api.yourdomain.com/api/v1`
   - Backend: `FRONTEND_URL` → `https://www.yourdomain.com`

---

## 🆘 Getting Help

### Render Support

- **Documentation:** [render.com/docs](https://render.com/docs)
- **Community:** [community.render.com](https://community.render.com)
- **Status:** [status.render.com](https://status.render.com)

### Your Application

- Check logs in Render dashboard
- Test endpoints with Postman/Insomnia
- Check browser console for frontend errors

---

## 🎯 Quick Reference URLs

After deployment, bookmark these:

- **Live App:** `https://easyluxury-frontend.onrender.com`
- **API Health:** `https://easyluxury-backend.onrender.com/api/v1/health`
- **Backend Dashboard:** `https://dashboard.render.com/web/YOUR_BACKEND_ID`
- **Frontend Dashboard:** `https://dashboard.render.com/static/YOUR_FRONTEND_ID`
- **MongoDB Atlas:** `https://cloud.mongodb.com`

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] Backend service deployed successfully
- [ ] Frontend service deployed successfully
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Login works (admin, staff, customer)
- [ ] Search trips works
- [ ] Booking flow works
- [ ] Real-time seat selection works
- [ ] Socket.IO connected
- [ ] Database operations work
- [ ] No CORS errors in console
- [ ] Mobile responsive design works
- [ ] All environment variables set

---

## 🚀 Next Steps

1. **Test thoroughly** - Try all features
2. **Share your link** - Send to friends/testers
3. **Monitor logs** - Check for errors
4. **Set up monitoring** - Use UptimeRobot for free tier
5. **Consider paid tier** - For production use

---

## 📝 Notes

- Free tier services sleep after 15 min inactivity
- First request after sleep takes ~30 seconds
- MongoDB Atlas free tier is sufficient for testing
- Socket.IO works on Render free tier
- All features should work identically to local development

---

**Congratulations! Your EasyLuxury-Go application is now live on Render! 🎉**

For questions or issues, check the Troubleshooting section or Render's documentation.
