from app import dependencies
from app.domain.users.entities import User
from app.domain.users.oauth_use_case import OAuthService
from app.repository.user_repository import UserRepository
from app.service.auth import apple_auth_service
from app.service.auth import google_auth_service
from app.service.auth import user_info_service
from app.service.auth.authentication import validate_session_token

from app.service.auth.entities import (
    AppleAuthRequest,
    AuthResponse,
    GoogleAuthRequest,
    UserInfoResponse,
)
from fastapi import APIRouter, Depends

TAG = "Authentication"
router = APIRouter(prefix="/auth", tags=[TAG])


@router.post("/google", response_model=AuthResponse, summary="Google Sign In/Sign Up")
async def google_auth(
    auth_request: GoogleAuthRequest,
    user_repository: UserRepository = Depends(dependencies.get_user_repository),
    oauth_service: OAuthService = Depends(lambda: OAuthService()),
):
    """Authenticate user with Google OAuth"""
    return await google_auth_service.execute(
        auth_request,
        user_repository,
        oauth_service,
    )


@router.post("/apple", response_model=AuthResponse, summary="Apple Sign In/Sign Up")
async def apple_auth(
    auth_request: AppleAuthRequest,
    user_repository: UserRepository = Depends(dependencies.get_user_repository),
    oauth_service: OAuthService = Depends(lambda: OAuthService()),
):
    """Authenticate user with Apple Sign In"""
    return await apple_auth_service.execute(
        auth_request,
        user_repository,
        oauth_service,
    )


@router.post("/logout", summary="Logout User")
async def logout(
    current_user: User = Depends(validate_session_token),
):
    """Logout user (client should discard tokens)"""
    # TODO: Implement logout logic
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserInfoResponse, summary="Get Current User")
async def get_me(
    current_user: User = Depends(validate_session_token),
):
    """Get current authenticated user information"""
    return user_info_service.execute(current_user)
