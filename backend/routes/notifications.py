"""
Notifications routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from models import NotificationCreate, NotificationType
from config import get_db
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=dict)
async def create_notification(
    notification_data: NotificationCreate,
    db = Depends(get_db)
):
    """
    Create a notification
    """
    try:
        response = db.table("notifications").insert({
            "user_id": notification_data.user_id,
            "notification_type": notification_data.notification_type.value,
            "title": notification_data.title,
            "message": notification_data.message,
            "related_job_id": notification_data.related_job_id,
            "related_application_id": notification_data.related_application_id,
            "is_read": False
        }).execute()
        
        return {
            "status": "success",
            "message": "Notification created",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=dict)
async def get_notifications(
    user_id: str,
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get notifications for a user
    """
    try:
        query = db.table("notifications")\
            .select("*")\
            .eq("user_id", user_id)
        
        if unread_only:
            query = query.eq("is_read", False)
        
        response = query.order("created_at", desc=True)\
            .range(skip, skip + limit)\
            .execute()
        
        return {
            "status": "success",
            "data": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{notification_id}", response_model=dict)
async def get_notification(notification_id: str, db = Depends(get_db)):
    """
    Get a single notification
    """
    try:
        response = db.table("notifications")\
            .select("*")\
            .eq("id", notification_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "status": "success",
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{notification_id}/read", response_model=dict)
async def mark_as_read(notification_id: str, db = Depends(get_db)):
    """
    Mark notification as read
    """
    try:
        response = db.table("notifications")\
            .update({"is_read": True})\
            .eq("id", notification_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Notification marked as read",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/user/{user_id}/read-all", response_model=dict)
async def mark_all_as_read(user_id: str, db = Depends(get_db)):
    """
    Mark all notifications as read
    """
    try:
        db.table("notifications")\
            .update({"is_read": True})\
            .eq("user_id", user_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "All notifications marked as read"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(notification_id: str, db = Depends(get_db)):
    """
    Delete a notification
    """
    try:
        db.table("notifications")\
            .delete()\
            .eq("id", notification_id)\
            .execute()
        
        return {
            "status": "success",
            "message": "Notification deleted"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/send-application-status", response_model=dict)
async def send_application_status_notification(
    student_id: str,
    application_id: str,
    status: str,
    db = Depends(get_db)
):
    """
    Send application status notification
    """
    try:
        notification_messages = {
            "shortlisted": "Congratulations! You've been shortlisted for an interview.",
            "rejected": "Thank you for applying. We'll review your application.",
            "hired": "Great news! You've been hired for this position!"
        }
        
        message = notification_messages.get(status, "Your application status has been updated.")
        
        response = db.table("notifications").insert({
            "user_id": student_id,
            "notification_type": NotificationType.APPLICATION_STATUS.value,
            "title": f"Application Status Update",
            "message": message,
            "related_application_id": application_id,
            "is_read": False
        }).execute()
        
        return {
            "status": "success",
            "message": "Notification sent",
            "data": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
