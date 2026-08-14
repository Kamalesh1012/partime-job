# WorkMate Chennai - Complete Setup Guide

## 🎯 Quick Start

This guide will help you set up and run WorkMate Chennai locally and deploy it to production.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** 16+ (with npm)
- **Python** 3.8+
- **Git**
- **Supabase Account** (free tier available)
- **Google Cloud Project** with OAuth configured
- **Netlify Account** (for frontend deployment)
- **Vercel Account** (for backend deployment)

---

## 🔧 Step 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Note your **Project URL** and **Anon Key**

### 2. Create Database Tables

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the SQL from `SETUP_DATABASE.sql` file (provided in backend)
3. Or run each table creation script individually

### 3. Configure Policies (if needed)

```sql
-- Enable RLS if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- etc.
```

---

## 🔐 Step 2: Google OAuth Setup

### 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g., "WorkMate Chennai")
3. Enable **Google+ API** and **Google Identity Services API**

### 2. Create OAuth Credentials

1. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
2. Choose "Web application"
3. Add Authorized JavaScript Origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `https://your-netlify-domain.netlify.app`

4. Add Authorized Redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:8000`
   - `https://your-netlify-domain.netlify.app`
   - `https://your-vercel-domain.vercel.app`

5. Copy **Client ID** and **Client Secret**

---

## 🚀 Step 3: Frontend Setup (Local)

### 1. Navigate to Frontend

```bash
cd "c:\Users\KAMALESH\Desktop\job portal\frontend"
```

### 2. Create Environment File

Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Install Dependencies

```bash
npm install
```

All necessary packages are already in `package.json`:
- react & react-dom
- react-router-dom (routing)
- axios (HTTP client)
- zustand (state management)
- tailwindcss (styling)

### 4. Start Development Server

```bash
npm run dev
```

Access at: **http://localhost:5173**

### 5. Build for Production

```bash
npm run build
```

---

## ⚙️ Step 4: Backend Setup (Local)

### 1. Navigate to Backend

```bash
cd "c:\Users\KAMALESH\Desktop\job portal\backend"
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Create Environment File

Create `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_random_secret_key_32_chars_minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Start Development Server

```bash
python -m uvicorn main:app --reload
```

Access at: **http://localhost:8000**
API Docs at: **http://localhost:8000/docs**

---

## 📊 Step 5: Database Verification

### Check Connection

1. Open API Docs: http://localhost:8000/docs
2. Click "Try it out" on `/health` endpoint
3. You should see `"status": "healthy"`

### Test Database

1. In API Docs, try the `/jobs` endpoint
2. Should return empty array initially

---

## 🧪 Step 6: Local Testing

### Test Frontend + Backend Integration

1. **Start Backend** (in terminal 1):
   ```bash
   cd backend
   .\venv\Scripts\Activate.ps1
   python -m uvicorn main:app --reload
   ```

2. **Start Frontend** (in terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Pages**:
   - Home: http://localhost:5173 (should show jobs loading)
   - API: http://localhost:8000/docs (try endpoints)

### Check Console for Errors

- Frontend: Press F12 → Console (watch for API errors)
- Backend: Check terminal output for errors

---

## 🌐 Step 7: Frontend Deployment (Netlify)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - WorkMate Chennai"
git remote add origin https://github.com/yourusername/workmate-chennai.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select GitHub → Select repository
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

### 3. Set Environment Variables

In Netlify Dashboard → Site Settings → Build & Deploy → Environment:

```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Deploy

- Click "Deploy site"
- Wait for build to complete
- Your frontend is live!

---

## 🔧 Step 8: Backend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy Backend

```bash
cd "c:\Users\KAMALESH\Desktop\job portal"
vercel
```

Follow the prompts:
- Project name: `workmate-api`
- Framework: `Other`
- Root directory: `backend`

### 3. Add Environment Variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add SECRET_KEY
```

### 4. Redeploy with Environment Variables

```bash
vercel --prod
```

Your API is now at: `https://workmate-api.vercel.app`

---

## 🔄 Step 9: Update Frontend with Production API

### Update Frontend Environment

After backend is deployed, update `.env.local` on Netlify:

1. Go to Netlify Site Settings → Build & Deploy → Environment Variables
2. Update `VITE_API_BASE_URL` to: `https://your-vercel-domain.vercel.app/api`
3. Redeploy by pushing to GitHub

---

## ✅ Step 10: Post-Deployment Checklist

- [ ] Frontend accessible at https://your-netlify-domain.netlify.app
- [ ] Backend API accessible at https://your-vercel-domain.vercel.app/api
- [ ] API Docs working at https://your-vercel-domain.vercel.app/docs
- [ ] Google OAuth working (try login)
- [ ] Jobs loading on homepage
- [ ] No CORS errors in browser console
- [ ] Supabase connection stable

---

## 🐛 Troubleshooting

### CORS Errors

**Problem**: `Access to XMLHttpRequest blocked by CORS`

**Solution**: Update `backend/main.py` CORS origins:

```python
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://your-netlify-domain.netlify.app",  # Add this
]
```

### Database Connection Issues

**Problem**: `Supabase connection failed`

**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
2. Check Supabase project is active
3. Verify tables exist in database
4. Check connection in API docs

### Google OAuth Not Working

**Problem**: `Google sign-in fails`

**Solution**:
1. Verify Google Client ID is correct
2. Add redirect URI to Google Cloud Console
3. Check that OAuth is enabled in Google project
4. Clear browser cookies and try again

### Environment Variables Not Loaded

**Problem**: `API returning errors about missing credentials`

**Solution**:
1. Verify `.env` file exists in backend folder
2. Restart development server
3. Check environment variables in deployment platform

---

## 📱 Testing Checklist

### Homepage
- [ ] Jobs load correctly
- [ ] Search works
- [ ] Location filter works
- [ ] Categories display properly
- [ ] Dark mode toggle works

### Authentication
- [ ] Google login redirects correctly
- [ ] Token stored in localStorage
- [ ] Logout clears token

### Student Dashboard
- [ ] Shows recent applications
- [ ] Displays recommended jobs
- [ ] Shows notifications
- [ ] Quick actions work

### Job Details
- [ ] Job information displays
- [ ] Apply button works
- [ ] Save job button works

---

## 📚 Next Steps After Deployment

1. **Complete Remaining Features**:
   - Finish EmployerDashboard component
   - Implement AdminDashboard
   - Add passport-size photo upload and Aadhaar verification workflow (secure, admin-only access)
   - Implement email notifications

2. **Enhance Security**:
   - Add rate limiting
   - Implement CAPTCHA for forms
   - Add content validation
   - Setup backup automation

3. **Performance**:
   - Setup CDN for assets
   - Implement caching strategies
   - Optimize database queries
   - Add monitoring/analytics

4. **Scale**:
   - Setup load balancing
   - Implement job queue for notifications
   - Add search indexing
   - Setup auto-scaling

---

## 🤝 Support & Resources

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Vercel Docs](https://vercel.com/docs)

---

## ✨ You're All Set!

Your WorkMate Chennai platform is now deployed and ready to connect students and employers in Chennai! 🎉

For questions or issues, refer to the main [README.md](./README.md)
