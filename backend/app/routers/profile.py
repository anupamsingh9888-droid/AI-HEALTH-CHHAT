import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.supabase_service import get_supabase_service
from app.utils.security import get_current_user, AuthenticatedUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profile", tags=["Health Profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Retrieves the authenticated user's health profile.
    """
    supabase = get_supabase_service()
    data = supabase.get_profile(current_user.id)
    if not data:
        # Create initial default profile if not exists
        data = {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name or "Maya Rao",
            "age": 29,
            "gender": "Female",
            "height_cm": 167.0,
            "weight_kg": 62.4,
            "activity_level": "Moderately active",
            "health_goals": ["Better sleep", "Walk 10k steps"],
            "allergies": [],
            "current_medications": [],
            "sleep_goal_hours": 8.0,
        }
        supabase.upsert_profile(current_user.id, data)
    return data


@router.put("", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Updates the authenticated user's health profile.
    """
    supabase = get_supabase_service()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    updated = supabase.upsert_profile(current_user.id, update_data)
    return updated
