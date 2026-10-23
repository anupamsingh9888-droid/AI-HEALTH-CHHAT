import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserSignUp, UserLogin, TokenResponse, UserResponse
from app.services.supabase_service import get_supabase_service
from app.utils.security import get_current_user, AuthenticatedUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(body: UserSignUp):
    """
    Registers a new user via Supabase Auth.
    """
    supabase = get_supabase_service()

    if supabase.client:
        try:
            res = supabase.client.auth.sign_up({
                "email": body.email,
                "password": body.password,
                "options": {
                    "data": {"full_name": body.full_name or body.email.split("@")[0]}
                }
            })
            if res.user:
                token = res.session.access_token if res.session else "demo-token-session"
                return TokenResponse(
                    access_token=token,
                    user=UserResponse(
                        id=res.user.id,
                        email=res.user.email,
                        full_name=body.full_name,
                        created_at=res.user.created_at,
                    )
                )
        except Exception as e:
            logger.error(f"Supabase signup error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Offline / Local Demo mode
    return TokenResponse(
        access_token="demo-token-local-dev",
        user=UserResponse(
            id="default-user",
            email=body.email,
            full_name=body.full_name or "Maya Rao",
            created_at="2026-10-23T00:00:00Z"
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    """
    Authenticates a user via Supabase Auth.
    """
    supabase = get_supabase_service()

    if supabase.client:
        try:
            res = supabase.client.auth.sign_in_with_password({
                "email": body.email,
                "password": body.password
            })
            if res.user and res.session:
                full_name = res.user.user_metadata.get("full_name") if res.user.user_metadata else None
                return TokenResponse(
                    access_token=res.session.access_token,
                    user=UserResponse(
                        id=res.user.id,
                        email=res.user.email,
                        full_name=full_name or "User",
                        created_at=res.user.created_at,
                    )
                )
        except Exception as e:
            logger.error(f"Supabase login error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials."
            )

    # Local / Demo credentials
    return TokenResponse(
        access_token="demo-token-local-dev",
        user=UserResponse(
            id="default-user",
            email=body.email,
            full_name="Maya Rao",
            created_at="2026-10-23T00:00:00Z"
        )
    )


@router.post("/logout")
async def logout(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Signs out the current session.
    """
    supabase = get_supabase_service()
    if supabase.client:
        try:
            supabase.client.auth.sign_out()
        except Exception as e:
            logger.warning(f"Error signing out of Supabase: {e}")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns information about the current authenticated user.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
    )
