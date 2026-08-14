from fastapi import APIRouter

router = APIRouter()

@router.get('/')
async def list_notifications(user_id: str = None):
    # Placeholder: return sample notifications
    return [{"id":"1","title":"Interview Scheduled","message":"Interview on Monday"}]
