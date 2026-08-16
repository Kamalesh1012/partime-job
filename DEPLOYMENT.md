WorkMate Chennai — Production Deployment Guide

Overview
--------
This document describes step-by-step how to deploy the WorkMate Chennai application to production using:

- Supabase: Database (Postgres), Authentication, Storage
- Vercel: FastAPI backend
- Netlify: React + Vite frontend

High-level flow
---------------
Browser → Netlify frontend → Vercel backend (API) → Supabase (DB/Auth/Storage)

Important security notes
------------------------
- Never put SUPABASE_SERVICE_ROLE_KEY or other secrets in frontend env or commit them.
- Aadhaar documents MUST be stored in a private Supabase storage bucket and only accessed server-side.
- Use HttpOnly Secure cookies for refresh tokens and SameSite=None for cross-site cookies in production (Netlify↔Vercel requires HTTPS).

Step 1 — Supabase project setup
--------------------------------
1. Create a Supabase project at https://app.supabase.com.
2. From the Supabase dashboard, go to SQL Editor and run the SQL in supabase/schema.sql (this repo path: supabase/schema.sql).
   - This creates tables: users, student_profiles, employer_profiles, jobs, applications, saved_jobs, notifications, reports, refresh_tokens.
3. In Supabase > Storage create two buckets:
   - profile-photos (public or private per your privacy decision; public simplifies serving photo URLs)
   - aadhaar-documents (set this bucket to PRIVATE — no public access)
4. In Supabase > Authentication > Settings > External OAuth Providers, enable Google provider and leave Client ID / Secret blank for now.

Step 2 — Google OAuth configuration (Supabase)
----------------------------------------------
Supabase needs Google Client ID/Secret configured for the Google provider.

1. Create OAuth credentials in Google Cloud Console (Web application) under project `workmate-chennai`.
   - Authorized JavaScript origins:
     - `https://bucolic-sunflower-10231c.netlify.app`
     - `https://rvuxitlbjpulbwsgduwz.supabase.co`
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Authorized redirect URIs:
     - `https://rvuxitlbjpulbwsgduwz.supabase.co/auth/v1/callback`
2. Copy Google Client ID and Client Secret.
3. In Supabase Dashboard → Authentication → Providers → Google:
   - Paste Google Client ID and Client Secret, then click Save.
4. In Supabase → Authentication → URL Configuration:
   - Site URL: `https://bucolic-sunflower-10231c.netlify.app`
   - Redirect URLs: `http://localhost:5173/**`, `http://127.0.0.1:5173/**`, `https://bucolic-sunflower-10231c.netlify.app/**`

Step 3 — RLS & Policies (recommended)
-------------------------------------
1. Consider enabling Row Level Security (RLS) for sensitive tables. Example policies to start (adjust as needed):

- users (SELECT): allow if auth.uid() = id OR role is admin
- student_profiles (SELECT/UPDATE): allow the profile owner to read/update their row; allow admin to read/update
- applications: allow student to read their own; allow employer to read applications for their jobs; allow admin
- refresh_tokens: allow backend (service role) only — do not allow client access

I can provide concrete SQL policy templates if you want — tell me which tables to lock down first.

Step 4 — Backend preparing for Vercel
------------------------------------
Checklist:
- Ensure backend/main.py is the FastAPI entrypoint and mounts routers at /api/* (this repo already mounts routers under /api/*).
- Ensure CORS uses FRONTEND_URL from env and allow_credentials=True.
- Ensure SUPABASE_SERVICE_ROLE_KEY is only used server-side (never sent to client).
- Confirm vercel.json exists and points at backend/main.py (this repo includes vercel.json).

Vercel environment variables (set these in the Vercel Dashboard for the project):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY  <-- VERY SENSITIVE: only in Vercel env, not in repo
- JWT_SECRET
- JWT_ACCESS_TOKEN_EXPIRE_MINUTES
- JWT_REFRESH_TOKEN_EXPIRE_DAYS
- FRONTEND_URL  (set to Netlify URL)
- ENVIRONMENT=production

Step 5 — Frontend preparing for Netlify
--------------------------------------
Checklist:
- netlify.toml already configured to build frontend/dist and route /api/* to https://your-vercel-backend-url.com/api/:splat. Update that URL after you deploy the Vercel backend.
- Add an SPA fallback redirect so that client-side routing works (netlify.toml contains a /* -> /index.html rule). Confirm netlify.toml is in repo.

Netlify environment variables (set these in Netlify site settings -> Build & deploy -> Environment):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_URL (set to https://your-vercel-backend-url.com/api)
- VITE_GOOGLE_CLIENT_ID (optional for UI SDK; actual Google provider configured in Supabase)

Important: Do NOT add SUPABASE_SERVICE_ROLE_KEY to Netlify.

Step 6 — Aadhaar upload handling (server-side)
---------------------------------------------
Implementation guidance already present in backend routes (profiles/aadhaar upload). Production steps:
- Ensure aadhaar-documents bucket is private.
- The backend must use SUPABASE_SERVICE_ROLE_KEY to upload files to that private bucket and store the internal path in student_profiles.aadhaar_doc_path.
- The backend must not return aadhaar_doc_path or any Aadhaar number to employers or to public APIs. Only admin endpoints may retrieve the path and, using the server service key, download the file for verification.
- On Vercel, set SUPABASE_SERVICE_ROLE_KEY in project env; backend code reads it from env.

Step 7 — Cookie & CORS production settings
-----------------------------------------
- FRONTEND_URL must be set to your Netlify site URL in the Vercel environment variables.
- Cookies (refresh token) must be set with: HttpOnly; Secure=true; SameSite=None; Path=/; Domain=your-netlify-domain (if necessary). Because Netlify and Vercel are different hosts, SameSite=None and Secure are required.
- Ensure backend CORSMiddleware allow_credentials=True and allow_origins includes the Netlify URL.

Step 8 — Deployment order (production)
--------------------------------------
1. Supabase: Create project, run supabase/schema.sql, create storage buckets, configure Google OAuth provider (Client ID/Secret), add redirect URLs.
2. Vercel: Create project linked to repo, add the Vercel environment variables (listed above), deploy backend. After deploy, note the Vercel URL (e.g., https://your-backend.vercel.app).
3. Netlify: Create site from repo (frontend Directory), set build settings (command: npm --prefix frontend run build, publish: frontend/dist), set Netlify environment variables (VITE_* values), deploy.
4. Update Vercel FRONTEND_URL env to the Netlify URL (if you already deployed Vercel earlier, re-deploy or redeploy environment to pick up the updated FRONTEND_URL).
5. Update netlify.toml API redirect target to the Vercel API (or leave as runtime env VITE_API_URL used by the frontend). Redeploy if necessary.
6. Verify end-to-end flows.

Checklist of clicks/configuration you will perform (manual steps)
---------------------------------------------------------------
Supabase dashboard:
- Create project
- Go to SQL Editor → paste & run supabase/schema.sql
- Storage → Create bucket: profile-photos (public or private)
- Storage → Create bucket: aadhaar-documents (PRIVATE)
- Authentication → Providers → Google → paste Google Client ID & Secret
- Authentication → Settings → Redirect URLs → add Netlify & Vercel URLs

Vercel:
- Import project from GitHub (select backend/main.py as entry)
- Settings → Environment Variables → add the variables listed under "Vercel environment variables"
- Deploy (or redeploy)

Netlify:
- Create new site from Git → select repository
- Site settings → Build & deploy → Build command: npm --prefix frontend run build; Publish directory: frontend/dist
- Environment variables → add VITE_* variables
- Deploy site

What I changed in the repository (files added/updated)
-----------------------------------------------------
- netlify.toml — added SPA redirect and API redirect placeholder (update with your Vercel URL)
- frontend/.env.example — public Vite variables example
- backend/.env.example — recommended server env variables example (placeholders only)
- supabase/schema.sql — already present and verified (includes refresh_tokens table and Aadhaar fields)
- DEPLOYMENT.md — this deployment guide (created in project root)

Pre-deployment code issues to check/fix before deploy
----------------------------------------------------
- Ensure backend uses environment variables exactly as Vercel env keys (SUPABASE_* names, JWT_SECRET, FRONTEND_URL). Compare backend/app/core/config.py to confirm variable names.
- Verify backend CORS uses FRONTEND_URL from env and allow_credentials=True.
- Confirm all endpoints that handle file uploads are using service-role key server-side to write to private buckets.
- Verify that no code logs tokens or secrets (search for prints of token values).
- Confirm that the frontend uses VITE_API_URL to call the backend and that apiClient uses credentials when calling /api/auth/refresh.

If you want, next steps I can take now (no secrets in chat):
- Produce concrete SQL RLS policies for users, student_profiles, jobs, applications, refresh_tokens and storage policies for aadhaar-documents (I will give SQL you can paste into Supabase SQL Editor).
- Add a small admin endpoint and instruction to fetch private Aadhaar files server-side (already scaffold exists; I can finalize it so admin UI can call /api/admin/aadhaar/{student_id}/download — this will require SUPABASE_SERVICE_ROLE_KEY in Vercel env).

Questions/Notes
---------------
- You said Aadhaar should not be part of signup; the current code stores Aadhaar as optional and sets aadhaar_verification_status default to 'not_submitted' — this matches your requirement.
- I did NOT paste or request service-role keys in chat. You will add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.

If you confirm, next actions I will perform (pick one):
- Generate recommended SQL RLS policies and Storage policies (I recommend doing this next so you can paste them into Supabase SQL Editor).
- Finalize a small admin endpoint for downloading Aadhaar docs (server-side only) and add instructions where to set SUPABASE_SERVICE_ROLE_KEY in Vercel.

---

If you want the RLS policies now, say "Provide RLS SQL" and I will generate them ready-to-run in the Supabase SQL Editor.
