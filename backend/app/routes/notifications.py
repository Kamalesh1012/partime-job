"""
SEWAA India - Notifications Center API
Handles user notifications, real-time activity alerts, application updates, and read status management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter()

# Resilient in-memory notifications store
_LOCAL_NOTIFICATIONS = [
    {
        "id": "notif-init-01",
        "user_id": "demo-worker",
        "notification_type": "welcome",
        "title": "Welcome to SEWAA India! 🇮🇳",
        "message": "Find flexible part-time gigs, daily wage opportunities, and technician services near your doorstep.",
        "is_read": False,
        "created_at": "2026-08-16T08:00:00",
        "related_job_id": None,
        "related_application_id": None,
    },
    {
        "id": "notif-init-02",
        "user_id": "demo-worker",
        "notification_type": "app_shortlisted",
        "title": "Application Shortlisted ⭐",
        "message": "Nilgiris Supermarket shortlisted your application for 'Supermarket Cashier & Billing Assistant'.",
        "is_read": False,
        "created_at": "2026-08-16T14:30:00",
        "related_job_id": "job-chn-omr-02",
        "related_application_id": "app-demo-01",
    },
    {
        "id": "notif-init-03",
        "user_id": "demo-worker",
        "notification_type": "app_accepted",
        "title": "Application Accepted! 🎉",
        "message": "QuickCart Logistics accepted your application for 'E-Commerce Delivery Associate'. Report at 4:30 PM.",
        "is_read": True,
        "created_at": "2026-08-15T12:00:00",
        "related_job_id": "job-chn-shol-01",
        "related_application_id": "app-demo-02",
    },
]


def create_in_memory_notification(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    related_job_id: Optional[str] = None,
    related_application_id: Optional[str] = None,
) -> dict:
    """Helper to dispatch in-app notifications from jobs, applications, or services"""
    notif_id = f"notif-{int(datetime.utcnow().timestamp())}-{uuid.uuid4().hex[:4]}"
    record = {
        "id": notif_id,
        "user_id": user_id,
        "notification_type": notif_type,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat(),
        "related_job_id": related_job_id,
        "related_application_id": related_application_id,
    }
    _LOCAL_NOTIFICATIONS.insert(0, record)
    return record


class NotificationCreate(BaseModel):
    user_id: str
    notification_type: Optional[str] = "general"
    title: str
    message: str
    related_job_id: Optional[str] = None
    related_application_id: Optional[str] = None


# ==================== Endpoints ====================

@router.get("", response_model=dict)
@router.get("/", response_model=dict)
async def list_notifications(
    user_id: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List notifications with optional user filter"""
    results = _LOCAL_NOTIFICATIONS
    if user_id:
        results = [n for n in results if n.get("user_id") == user_id or user_id in ("demo-worker", "guest")]
    if unread_only:
        results = [n for n in results if not n.get("is_read", False)]

    paginated = results[skip:skip + limit]
    return {
        "status": "success",
        "count": len(results),
        "unread_count": len([n for n in results if not n.get("is_read", False)]),
        "data": paginated,
    }


@router.get("/user/{user_id}", response_model=dict)
async def get_user_notifications(
    user_id: str,
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all notifications for a specific user"""
    results = [
        n for n in _LOCAL_NOTIFICATIONS
        if n.get("user_id") == user_id or user_id in ("demo-worker", "guest", "verified-user")
    ]
    if unread_only:
        results = [n for n in results if not n.get("is_read", False)]

    paginated = results[skip:skip + limit]
    return {
        "status": "success",
        "count": len(results),
        "unread_count": len([n for n in results if not n.get("is_read", False)]),
        "data": paginated,
    }


@router.post("", status_code=201, response_model=dict)
@router.post("/", status_code=201, response_model=dict)
async def create_notification(payload: NotificationCreate):
    """Create a new notification"""
    record = create_in_memory_notification(
        user_id=payload.user_id,
        notif_type=payload.notification_type or "general",
        title=payload.title,
        message=payload.message,
        related_job_id=payload.related_job_id,
        related_application_id=payload.related_application_id,
    )
    return {
        "status": "success",
        "message": "Notification created",
        "data": record,
    }


@router.get("/{notification_id}", response_model=dict)
async def get_notification_detail(notification_id: str):
    """Get single notification details"""
    match = next((n for n in _LOCAL_NOTIFICATIONS if n.get("id") == notification_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {
        "status": "success",
        "data": match,
    }


@router.put("/{notification_id}/read", response_model=dict)
async def mark_as_read(notification_id: str):
    """Mark single notification as read"""
    match = next((n for n in _LOCAL_NOTIFICATIONS if n.get("id") == notification_id), None)
    if match:
        match["is_read"] = True
        return {"status": "success", "message": "Notification marked as read", "data": match}

    return {"status": "success", "message": "Notification marked as read"}


@router.put("/user/{user_id}/read-all", response_model=dict)
async def mark_all_as_read(user_id: str):
    """Mark all notifications as read for a user"""
    count = 0
    for n in _LOCAL_NOTIFICATIONS:
        if n.get("user_id") == user_id or user_id in ("demo-worker", "guest"):
            n["is_read"] = True
            count += 1

    return {
        "status": "success",
        "message": f"Marked {count} notifications as read",
        "marked_count": count,
    }


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(notification_id: str):
    """Delete a notification"""
    global _LOCAL_NOTIFICATIONS
    _LOCAL_NOTIFICATIONS = [n for n in _LOCAL_NOTIFICATIONS if n.get("id") != notification_id]
    return {
        "status": "success",
        "message": "Notification deleted successfully",
    }
