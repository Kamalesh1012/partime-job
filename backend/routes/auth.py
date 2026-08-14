"""
Authentication routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models import (
    GoogleAuthRequest, UserResponse, UserType, 
    StudentProfileCreate, EmployerProfileCreate
)
from config import get_db
from typing import Optional
import os

router = APIRouter()

@router.post("/google-login", response_model=dict)
async def google_login(request: GoogleAuthRequest, db = Depends(get_db)):
    """
    Handle Google OAuth login
    """
    try:
        # TODO: Verify Google token using google.auth.transport.requests
        # For now, we'll assume token is valid
        
        # Check if user exists
        response = db.table("users").select("*").eq("email", "test@example.com").execute()
        
        return {
            "status": "success",
            "message": "Login successful",
            "token": "jwt_token_here",
            "user": {
                "id": "user_id",
                "email": "user@example.com",
                "user_type": request.user_type
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/register-student", response_model=dict)
async def register_student(
    user_data: UserResponse,
    profile_data: StudentProfileCreate,
    db = Depends(get_db)
):
    """
    Register a new student
    """
    try:
        # Create user
        user_response = db.table("users").insert({
            "email": user_data.email,
            "full_name": user_data.full_name,
            "user_type": "student",
            "profile_picture": user_data.profile_picture
        }).execute()
        
        user_id = user_response.data[0]["id"] if user_response.data else None
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Create student profile
        db.table("student_profiles").insert({
            "user_id": user_id,
            "phone": profile_data.phone,
            "location": profile_data.location,
            "bio": profile_data.bio,
            "skills": profile_data.skills,
            "availability": profile_data.availability
        }).execute()
        
        return {
            "status": "success",
            "message": "Student registered successfully",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/register-employer", response_model=dict)
async def register_employer(
    user_data: UserResponse,
    profile_data: EmployerProfileCreate,
    db = Depends(get_db)
):
    """
    Register a new employer
    """
    try:
        # Create user
        user_response = db.table("users").insert({
            "email": user_data.email,
            "full_name": user_data.full_name,
            "user_type": "employer",
            "profile_picture": user_data.profile_picture
        }).execute()
        
        user_id = user_response.data[0]["id"] if user_response.data else None
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Create employer profile
        db.table("employer_profiles").insert({
            "user_id": user_id,
            "company_name": profile_data.company_name,
            "company_email": profile_data.company_email,
            "phone": profile_data.phone,
            "location": profile_data.location,
            "description": profile_data.description,
            "website": profile_data.website,
            "logo_url": profile_data.logo_url,
            "industry": profile_data.industry,
            "is_verified": False
        }).execute()
        
        return {
            "status": "success",
            "message": "Employer registered successfully",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/logout")
async def logout():
    """
    Logout user
    """
    return {
        "status": "success",
        "message": "Logged out successfully"
    }

@router.get("/me", response_model=dict)
async def get_current_user():
    """
    Get current authenticated user
    """
    # TODO: Implement JWT verification
    return {
        "status": "success",
        "user": {}
    }
