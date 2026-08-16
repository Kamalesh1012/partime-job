"""
Notifications routes - Full implementation for notifications management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings
from datetime import datetime

router = APIRouter()


class NotificationCreate(BaseModel):
    user_id: str
    notification_type: Optional[str] = "general"
    title: str
    message: str
    related_job_id: Optional[str] = None
    related_application_id: Optional[str] = None


async def get_db():
    from supabase import create_client
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_KEY
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    return create_client(supabase_url, supabase_key)


@router.get("", response_model=dict)
@router.get("/", response_model=dict)
async def list_all_notifications(
    user_id: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    List notifications with optional user_id filter
    """
    try:
        query = db.table("notifications").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        if unread_only:
            query = query.eq("is_read", False)

        res = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        return {
            "status": "success",
            "data": res.data or [],
            "total": len(res.data or [])
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("", status_code=201, response_model=dict)
@router.post("/", status_code=201, response_model=dict)
async def create_notification(
    notification_data: NotificationCreate,
    db = Depends(get_db)
):
    """
    Create a notification
    """
    try:
        res = db.table("notifications").insert({
            "user_id": notification_data.user_id,
            "notification_type": notification_data.notification_type,
            "title": notification_data.title,
            "message": notification_data.message,
            "related_job_id": notification_data.related_job_id,
            "related_application_id": notification_data.related_application_id,
            "is_read": False
        }).execute()

        return {
            "status": "success",
            "message": "Notification created",
            "data": res.data[0] if res.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/user/{user_id}", response_model=dict)
async def get_user_notifications(
    user_id: str,
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db = Depends(get_db)
):
    """
    Get notifications for a specific user
    """
    try:
        query = db.table("notifications").select("*").eq("user_id", user_id)
        if unread_only:
            query = query.eq("is_read", False)

        res = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        return {
            "status": "success",
            "data": res.data or [],
            "total": len(res.data or [])
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{notification_id}", response_model=dict)
async def get_notification_details(notification_id: str, db = Depends(get_db)):
    """
    Get details of a single notification
    """
    try:
        res = db.table("notifications").select("*").eq("id", notification_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {
            "status": "success",
            "data": res.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{notification_id}/read", response_model=dict)
async def mark_as_read(notification_id: str, db = Depends(get_db)):
    """
    Mark a notification as read
    """
    try:
        res = db.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
        return {
            "status": "success",
            "message": "Notification marked as read",
            "data": res.data[0] if res.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/user/{user_id}/read-all", response_model=dict)
async def mark_all_as_read(user_id: str, db = Depends(get_db)):
    """
    Mark all notifications for a user as read
    """
    try:
        res = db.table("notifications").update({"is_read": True}).eq("user_id", user_id).execute()
        return {
            "status": "success",
            "message": "All notifications marked as read"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(notification_id: str, db = Depends(get_db)):
    """
    Delete a notification
    """
    try:
        res = db.table("notifications").delete().eq("id", notification_id).execute()
        return {
            "status": "success",
            "message": "Notification deleted"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
