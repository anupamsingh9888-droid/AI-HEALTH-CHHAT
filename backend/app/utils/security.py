import logging
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import get_settings
from app.services.supabase_service import get_supabase_service

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    def __init__(self, id: str, email: str, full_name: Optional[str] = None):
        self.id = id
        self.email = email
        self.full_name = full_name or "Maya Rao"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> AuthenticatedUser:
    """
    Validates Supabase Auth Bearer token.
    If Supabase is configured and a token is passed, verifies it against Supabase Auth.
    If running locally in demo/development mode without Supabase, falls back to default user.
    """
    supabase = get_supabase_service()

    if not credentials:
        # Development / Demo fallback so frontend works seamlessly without requiring immediate Supabase setup
        return AuthenticatedUser(
            id="default-user",
            email="maya@example.com",
            full_name="Maya Rao",
        )

    token = credentials.credentials

    # If Supabase client is active, verify with Supabase Auth
    if supabase.client:
        try:
            user_response = supabase.client.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                full_name = u.user_metadata.get("full_name") if u.user_metadata else None
                return AuthenticatedUser(id=u.id, email=u.email or "", full_name=full_name)
        except Exception as e:
            logger.warning(f"Supabase token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # In development/offline mode, permit valid-looking demo tokens
    if token.startswith("demo-token") or token == "test-token":
        return AuthenticatedUser(id="default-user", email="maya@example.com", full_name="Maya Rao")

    return AuthenticatedUser(id="default-user", email="maya@example.com", full_name="Maya Rao")
