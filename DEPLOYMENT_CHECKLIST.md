# 🚀 Render Deployment Checklist

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All dependencies are in package.json (backend & frontend)
- [ ] `.env` files are NOT committed to GitHub
- [ ] `render.yaml` file exists in root
- [ ] MongoDB Atlas is accessible (IP whitelist: 0.0.0.0/0)
- [ ] MapTiler API key is valid

## Backend Deployment

- [ ] Create Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set Root Directory to `backend`
- [ ] Set Build Command to `npm install`
- [ ] Set Start Command to `npm start`
- [ ] Add all environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
  - [ ] MONGO_URI
  - [ ] JWT_SECRET
  - [ ] ADMIN_EMAIL
  - [ ] ADMIN_PASSWORD
  - [ ] ADMIN_PASSWORD_HASH
  - [ ] MAX_LOGIN_ATTEMPTS
  - [ ] LOGIN_RATE_LIMIT_WINDOW
  - [ ] EMAIL_USER
  - [ ] EMAIL_PASSWORD
  - [ ] FRONTEND_URL (add after frontend deployment)
- [ ] Deploy backend
- [ ] Copy backend URL (e.g., https://easyluxury-backend.onrender.com)
- [ ] Test health endpoint: `/api/v1/health`

## Frontend Deployment

- [ ] Create Static Site on Render
- [ ] Connect same GitHub repository
- [ ] Set Root Directory to `frontend`
- [ ] Set Build Command to `npm install && npm run build`
- [ ] Set Publish Directory to `dist`
- [ ] Add environment variables:
  - [ ] VITE_API_BASE_URL (backend URL + /api/v1)
  - [ ] VITE_SOCKET_URL (backend URL without /api/v1)
  - [ ] VITE_MAPTILER_API_KEY
- [ ] Add Rewrite Rule: `/*` → `/index.html`
- [ ] Deploy frontend
- [ ] Copy frontend URL

## Post-Deployment

- [ ] Update backend FRONTEND_URL with frontend URL
- [ ] Wait for backend to redeploy automatically
- [ ] Test frontend loads correctly
- [ ] Test admin login
- [ ] Test customer login
- [ ] Test trip search
- [ ] Test booking flow
- [ ] Test real-time seat selection
- [ ] Test Socket.IO connection
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify no CORS errors

## MongoDB Atlas Configuration

- [ ] Go to MongoDB Atlas dashboard
- [ ] Network Access → IP Access List
- [ ] Add IP Address: `0.0.0.0/0` (Allow from anywhere)
- [ ] Confirm database connection is working

## Testing

- [ ] Backend health check: `https://YOUR-BACKEND.onrender.com/api/v1/health`
- [ ] Frontend loads: `https://YOUR-FRONTEND.onrender.com`
- [ ] Login as Admin: admin@easyLuxuryGo.com / Admin@12345
- [ ] Login as Customer: rohit@example.com / customer123
- [ ] Search trips works
- [ ] Seat selection is real-time
- [ ] Payment flow works
- [ ] Wallet operations work
- [ ] Admin dashboard loads
- [ ] No console errors

## Monitoring

- [ ] Bookmark Render dashboard links
- [ ] Check backend logs for errors
- [ ] Check frontend build logs
- [ ] Monitor MongoDB Atlas metrics
- [ ] Set up UptimeRobot (optional, for free tier)

## Final Verification

- [ ] All features work as in local development
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All API calls successful

## Your Deployment URLs

Fill in after deployment:

**Backend URL:** `https://_____________________________.onrender.com`

**Frontend URL:** `https://_____________________________.onrender.com`

**MongoDB URI:** Already configured

**Deployment Date:** _______________

---

## Quick Commands for Updates

```bash
# After making changes
git add .
git commit -m "Your update message"
git push origin main

# Render will auto-deploy
```

---

## Support Links

- Render Dashboard: https://dashboard.render.com
- MongoDB Atlas: https://cloud.mongodb.com
- GitHub Repo: https://github.com/YOUR_USERNAME/easyLuxury-Go
- Deployment Guide: See RENDER_DEPLOYMENT_GUIDE.md

---

**Status:** [ ] Deployment Complete ✅
