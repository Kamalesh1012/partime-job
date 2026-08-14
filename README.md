# WorkMate Chennai - Full Stack Job Portal

A production-ready full-stack web application connecting students, freshers, and job seekers in Chennai with verified part-time, weekend, internship, freelance, and temporary job opportunities.

## 🎯 Project Architecture

```
Frontend → Backend → Database & Auth
React + Vite  →  FastAPI  →  Supabase PostgreSQL + Google OAuth
Netlify         Vercel        Supabase
```

## 📋 Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Deployment**: Netlify

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth + JWT
- **Deployment**: Vercel

### Database & Auth
- **Database**: Supabase PostgreSQL
- **Authentication**: Google Sign-In + JWT
- **File Storage**: Supabase Storage (for profile photos and private documents such as identity verification)

## 📁 Project Structure

```
job portal/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── JobCard.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── EmployerDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── JobDetailsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   │   └── useTheme.js
│   │   ├── store/
│   │   │   └── index.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
│
├── backend/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── jobs.py
│   │   ├── applications.py
│   │   ├── profiles.py
│   │   ├── admin.py
│   │   └── notifications.py
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── requirements.txt
│   ├── .env.example
│   └── venv/
│
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git
- Supabase Account
- Google OAuth Credentials
- Netlify & Vercel Accounts

### 1. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update .env.local with your values
# VITE_API_BASE_URL=http://localhost:8000/api
# VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Start development server
npm run dev
# Access at http://localhost:5173
```

### 2. Backend Setup

```bash
cd backend

# Activate virtual environment
source venv/Scripts/activate  # On Windows
# or
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key
# GOOGLE_CLIENT_ID=your_google_client_id
# SECRET_KEY=your_secret_key

# Start development server
python -m uvicorn main:app --reload
# Access API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 3. Database Setup (Supabase)

#### Create Tables

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('student', 'employer', 'admin')),
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Profiles Table
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    photo_url TEXT,
    education VARCHAR(255),
    college VARCHAR(255),
    preferred_categories TEXT[] DEFAULT '{}',
    preferred_locations TEXT[] DEFAULT '{}',
    available_days VARCHAR(255),
    available_hours VARCHAR(255),
    expected_salary NUMERIC(10,2),
    previous_experience TEXT,
    aadhaar_verification_status VARCHAR(50) DEFAULT 'not_submitted',
    skills TEXT[] DEFAULT '{}',
    availability VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employer Profiles Table
CREATE TABLE employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_email VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(255),
    description TEXT,
    website TEXT,
    logo_url TEXT,
    industry VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    job_type VARCHAR(50),
    location VARCHAR(100),
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    salary_currency VARCHAR(10) DEFAULT 'INR',
    experience_required VARCHAR(100),
    skills_required TEXT[] DEFAULT '{}',
    application_deadline TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'rejected', 'hired')),
    cover_letter TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Jobs Table
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    related_job_id UUID REFERENCES jobs(id),
    related_application_id UUID REFERENCES applications(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id),
    reason TEXT,
    report_type VARCHAR(50),
    admin_action VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Environment Variables

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🎨 Frontend Features

### Pages Implemented
- ✅ **HomePage**: Landing page with job listings, search, categories
- ⏳ **LoginPage**: Google OAuth + Email login
- ⏳ **StudentDashboard**: Recommended jobs, saved jobs, applications
- ⏳ **EmployerDashboard**: Job postings, applicants, analytics
- ⏳ **AdminDashboard**: Verify employers, remove fake jobs, analytics
- ⏳ **JobDetailsPage**: Full job details, apply button
- ⏳ **ProfilePage**: Edit profile, upload passport-size photo and Aadhaar verification (optional)

### Components
- ✅ **Navbar**: Navigation with dark mode toggle
- ✅ **Footer**: Company info & links
- ⏳ **JobCard**: Reusable job listing component
- ⏳ **Application Modal**: Apply for jobs
- ⏳ **Filter Panel**: Filter jobs by category, location, salary

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google-login` - Google OAuth login
- `POST /api/auth/register-student` - Register student
- `POST /api/auth/register-employer` - Register employer
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List all jobs with filters
- `GET /api/jobs/trending` - Get trending jobs
- `GET /api/jobs/search` - Search jobs by keyword
- `GET /api/jobs/{id}` - Get job details
- `POST /api/jobs` - Create job (employer)
- `PUT /api/jobs/{id}` - Update job (employer)
- `DELETE /api/jobs/{id}` - Delete job (employer)

### Applications
- `POST /api/applications` - Apply for job
- `GET /api/applications/student/{id}` - Get student applications
- `GET /api/applications/job/{id}` - Get job applications (employer)
- `PUT /api/applications/{id}` - Update application status (employer)
- `DELETE /api/applications/{id}` - Withdraw application

### Profiles
- `GET /api/profiles/student/{id}` - Get student profile
- `PUT /api/profiles/student/{id}` - Update student profile
- `GET /api/profiles/employer/{id}` - Get employer profile
- `PUT /api/profiles/employer/{id}` - Update employer profile
- `POST /api/profiles/saved-jobs/{id}` - Save job
- `DELETE /api/profiles/saved-jobs/{id}` - Unsave job
- `GET /api/profiles/saved-jobs/{id}` - Get saved jobs

### Notifications
- `GET /api/notifications/user/{id}` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

### Admin
- `GET /api/admin/employers` - Get unverified employers
- `POST /api/admin/employers/{id}/verify` - Verify employer
- `DELETE /api/admin/jobs/{id}` - Remove fake job
- `GET /api/admin/analytics` - Get platform analytics

## 🌍 Chennai Job Locations

Supported locations for job filtering:
- OMR
- Sholinganallur
- Velachery
- Guindy
- Tambaram
- T Nagar
- Adyar
- Anna Nagar
- Porur
- Perungudi
- Ambattur
- Medavakkam

## 💼 Job Categories

- Data Entry
- Customer Support
- Retail Sales
- Cafe Staff
- Restaurant Crew
- Event Staff
- Delivery Partner
- Tutor
- Office Assistant
- Digital Marketing
- Content Writer
- Graphic Designer
- Video Editor
- Weekend Jobs
- Freelance Projects

## 📱 Job Types

- Part-Time
- Weekend
- Internship
- Freelance
- Temporary

## 🚀 Deployment

### Frontend (Netlify)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to netlify.com
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Deploy**
   - Netlify automatically deploys on push to main

### Backend (Vercel)

1. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "backend/main.py"
       }
     ]
   }
   ```

2. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Add Environment Variables**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Add all variables from .env file

## 🔑 Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:5173`
   - `https://your-netlify-domain.netlify.app`
   - `http://localhost:8000`

## 📦 Dependencies

### Frontend
```
react
react-router-dom
axios
zustand
tailwindcss
@tailwindcss/forms
postcss
autoprefixer
```

### Backend
```
fastapi
uvicorn
python-jose[cryptography]
pydantic
supabase
python-dotenv
```

## 🧪 Testing

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
python -m uvicorn main:app --reload  # Start dev server with hot reload
```

## 🐛 Troubleshooting

### CORS Issues
- Update CORS origins in `backend/main.py`
- Ensure frontend URL is added to allowed origins

### Supabase Connection
- Verify SUPABASE_URL and SUPABASE_KEY in .env
- Check that database tables exist
- Review Supabase logs for errors

### Google OAuth Issues
- Verify Google Client ID and Secret
- Check redirect URIs in Google Cloud Console
- Ensure OAuth is enabled in your app

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Netlify Deployment Guide](https://docs.netlify.com)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 📄 License

MIT License - Feel free to use this project for educational and commercial purposes.

## 👥 Support

For issues, questions, or contributions, please create an issue on GitHub or contact the development team.

---

**WorkMate Chennai** - Connecting Talent with Opportunities in Chennai 🚀
#   p a r t i m e - j o b  
 #   p a r t i m e - j o b  
 