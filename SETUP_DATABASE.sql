-- WorkMate India – Part-Time Jobs & Local Services
-- Database Schema for Supabase PostgreSQL
-- Run these queries in your Supabase SQL Editor

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('worker', 'technician', 'employer', 'customer', 'student', 'admin')),
    profile_picture TEXT,
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(150),
    pin_code VARCHAR(10),
    preferred_language VARCHAR(50) DEFAULT 'English',
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_identity_verified BOOLEAN DEFAULT FALSE,
    is_face_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_users_pin_code ON users(pin_code);

-- ============================================
-- 2. WORKER / STUDENT PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    phone VARCHAR(20),
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(150),
    pin_code VARCHAR(10),
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
    aadhaar_doc_path TEXT,
    skills TEXT[] DEFAULT '{}',
    availability VARCHAR(50) DEFAULT 'immediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_city ON student_profiles(city);
CREATE INDEX IF NOT EXISTS idx_student_profiles_state ON student_profiles(state);

-- ============================================
-- 3. EMPLOYER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255),
    phone VARCHAR(20),
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(150),
    pin_code VARCHAR(10),
    location VARCHAR(255),
    description TEXT,
    website TEXT,
    logo_url TEXT,
    industry VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_is_verified ON employer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_city ON employer_profiles(city);

-- ============================================
-- 4. TECHNICIAN PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS technician_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    service_categories TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 1,
    hourly_rate NUMERIC(10, 2) DEFAULT 350.00,
    visiting_charge NUMERIC(10, 2) DEFAULT 199.00,
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(150),
    pin_code VARCHAR(10),
    service_radius_km INTEGER DEFAULT 15,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    total_reviews INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    badge_type VARCHAR(50) DEFAULT 'Verified Pro ✓',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tech_profiles_user_id ON technician_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_city ON technician_profiles(city);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_state ON technician_profiles(state);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_rating ON technician_profiles(rating DESC);

-- ============================================
-- 5. JOBS TABLE (Pan-India Part-time & Local Work)
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    job_type VARCHAR(50) DEFAULT 'Part-time',
    shift VARCHAR(50) DEFAULT 'Flexible',
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(150),
    pin_code VARCHAR(10),
    location VARCHAR(255),
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    salary_currency VARCHAR(10) DEFAULT 'INR',
    payment_frequency VARCHAR(50) DEFAULT 'Per Day',
    experience_required VARCHAR(100),
    skills_required TEXT[] DEFAULT '{}',
    openings INTEGER DEFAULT 1,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_weekend BOOLEAN DEFAULT FALSE,
    application_deadline TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================
-- 6. APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'rejected', 'hired', 'completed')),
    cover_letter TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- ============================================
-- 7. SERVICE REQUESTS (Technician Bookings)
-- ============================================
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    technician_id UUID REFERENCES technician_profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    service_title VARCHAR(255) NOT NULL,
    problem_description TEXT,
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(150),
    pin_code VARCHAR(10),
    service_address TEXT NOT NULL,
    preferred_date DATE,
    preferred_time_slot VARCHAR(50) DEFAULT 'Morning (9 AM - 12 PM)',
    estimated_cost NUMERIC(10, 2) DEFAULT 299.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'on_the_way', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_tech ON service_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_city ON service_requests(city);

-- ============================================
-- 8. ACTIVE JOBS (Live Job Tracking & Safety)
-- ============================================
CREATE TABLE IF NOT EXISTS active_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    job_title VARCHAR(255) NOT NULL,
    current_status VARCHAR(50) DEFAULT 'accepted' CHECK (current_status IN ('accepted', 'on_the_way', 'arrived', 'work_started', 'work_completed', 'incident_reported', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    location_address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    emergency_contact_alerted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_jobs_worker ON active_jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_active_jobs_status ON active_jobs(current_status);

-- ============================================
-- 9. EMERGENCY CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50) DEFAULT 'Family',
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- ============================================
-- 10. INCIDENTS & SOS LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_case_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    active_job_id UUID REFERENCES active_jobs(id) ON DELETE SET NULL,
    incident_type VARCHAR(50) DEFAULT 'SOS_TRIGGER',
    location_address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    emergency_contacts_notified TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'investigating', 'resolved')),
    evidence_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_case_id ON incidents(incident_case_id);

-- ============================================
-- 11. REVIEWS & RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_user_id);

-- ============================================
-- 12. SAVED JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_student_id ON saved_jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);

-- ============================================
-- 13. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    related_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    related_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    related_service_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- 14. REPORTS TABLE (Moderation)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    report_type VARCHAR(50),
    admin_action VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
