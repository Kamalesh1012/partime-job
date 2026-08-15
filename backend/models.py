"""
Pydantic models for request/response validation
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr


# ==================== Authentication Models ====================

class UserType(str, Enum):
    STUDENT = "student"
    EMPLOYER = "employer"
    ADMIN = "admin"


class GoogleAuthRequest(BaseModel):
    token: str
    user_type: UserType


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    user_type: UserType
    profile_picture: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Student Profile Models ====================

class StudentProfileCreate(BaseModel):
    phone: str
    location: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    skills: List[str] = []
    availability: str = "part-time"
    education: Optional[str] = None
    college: Optional[str] = None
    preferred_categories: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    available_days: Optional[str] = None
    available_hours: Optional[str] = None
    expected_salary: Optional[float] = None
    previous_experience: Optional[str] = None
    aadhaar_verification_status: Optional[str] = "not_submitted"


class StudentProfileUpdate(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    skills: Optional[List[str]] = None
    availability: Optional[str] = None
    education: Optional[str] = None
    college: Optional[str] = None
    preferred_categories: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    available_days: Optional[str] = None
    available_hours: Optional[str] = None
    expected_salary: Optional[float] = None
    previous_experience: Optional[str] = None
    aadhaar_verification_status: Optional[str] = None


class StudentProfileResponse(StudentProfileCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# ==================== Employer Profile Models ====================

class EmployerProfileCreate(BaseModel):
    company_name: str
    company_email: str
    phone: str
    location: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: str
    is_verified: bool = False


class EmployerProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None


class EmployerProfileResponse(EmployerProfileCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# ==================== Job Models ====================

class JobCategory(str, Enum):
    DATA_ENTRY = "data_entry"
    CUSTOMER_SUPPORT = "customer_support"
    RETAIL_SALES = "retail_sales"
    CAFE_STAFF = "cafe_staff"
    RESTAURANT_CREW = "restaurant_crew"
    EVENT_STAFF = "event_staff"
    DELIVERY_PARTNER = "delivery_partner"
    TUTOR = "tutor"
    OFFICE_ASSISTANT = "office_assistant"
    DIGITAL_MARKETING = "digital_marketing"
    CONTENT_WRITER = "content_writer"
    GRAPHIC_DESIGNER = "graphic_designer"
    VIDEO_EDITOR = "video_editor"
    WEEKEND = "weekend"
    FREELANCE = "freelance"


class ChennaiLocation(str, Enum):
    OMR = "omr"
    SHOLINGANALLUR = "sholinganallur"
    VELACHERY = "velachery"
    GUINDY = "guindy"
    TAMBARAM = "tambaram"
    T_NAGAR = "t_nagar"
    ADYAR = "adyar"
    ANNA_NAGAR = "anna_nagar"
    PORUR = "porur"
    PERUNGUDI = "perungudi"
    AMBATTUR = "ambattur"
    MEDAVAKKAM = "medavakkam"


class JobType(str, Enum):
    PART_TIME = "part_time"
    WEEKEND = "weekend"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"
    TEMPORARY = "temporary"


class JobCreate(BaseModel):
    title: str
    description: str
    category: JobCategory
    job_type: JobType
    location: ChennaiLocation
    salary_min: float
    salary_max: float
    salary_currency: str = "INR"
    experience_required: str = "0-1 years"
    skills_required: List[str] = []
    application_deadline: Optional[datetime] = None
    is_active: bool = True


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[JobCategory] = None
    job_type: Optional[JobType] = None
    location: Optional[ChennaiLocation] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    experience_required: Optional[str] = None
    skills_required: Optional[List[str]] = None
    application_deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class JobResponse(JobCreate):
    id: str
    employer_id: str
    applications_count: int = 0
    created_at: datetime
    updated_at: datetime


# ==================== Application Models ====================

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    HIRED = "hired"


class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    id: str
    student_id: str
    job_id: str
    status: ApplicationStatus
    cover_letter: Optional[str]
    applied_at: datetime
    updated_at: datetime


# ==================== Saved Job Models ====================

class SavedJobCreate(BaseModel):
    job_id: str


class SavedJobResponse(BaseModel):
    id: str
    student_id: str
    job_id: str
    saved_at: datetime


# ==================== Notification Models ====================

class NotificationType(str, Enum):
    APPLICATION_STATUS = "application_status"
    NEW_JOB = "new_job"
    JOB_REMINDER = "job_reminder"
    INTERVIEW = "interview"
    GENERAL = "general"


class NotificationCreate(BaseModel):
    user_id: str
    notification_type: NotificationType
    title: str
    message: str
    related_job_id: Optional[str] = None
    related_application_id: Optional[str] = None


class NotificationResponse(NotificationCreate):
    id: str
    is_read: bool
    created_at: datetime


# ==================== Search / Filter Models ====================

class JobSearchFilter(BaseModel):
    category: Optional[JobCategory] = None
    location: Optional[ChennaiLocation] = None
    job_type: Optional[JobType] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    search_query: Optional[str] = None
    page: int = 1
    limit: int = 20