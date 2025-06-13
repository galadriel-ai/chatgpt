from app.domain.users import create_user_use_case
from app.domain.users.oauth_use_case import OAuthService
from app.repository.jwt_repository import create_access_token
from app.repository.user_repository import UserRepository
from app.service.auth.entities import AuthResponse, GoogleAuthRequest, UserResponse
from app import api_logger

logger = api_logger.get()


async def execute(
    auth_request: GoogleAuthRequest,
    user_repository: UserRepository,
    oauth_service: OAuthService,
) -> AuthResponse:
    """Execute Google authentication process"""

    logger.debug(f"Google authentication request: {auth_request}")

    # Verify Google token and get unified user info
    oauth_user_info = await oauth_service.verify_google_token(
        auth_request.id_token, auth_request.google_id, auth_request.email
    )

    # Prepare additional user data from the request
    additional_user_data = {
        "name": auth_request.name,
        "profile_picture": auth_request.profile_picture,
    }

    # Execute unified domain use case
    user = await create_user_use_case.execute(
        oauth_user_info, additional_user_data, user_repository
    )

    # Generate access token
    access_token = create_access_token(user)

    return AuthResponse(
        message="Authentication successful",
        user=UserResponse(
            uid=str(user.uid),
            email=user.email,
            name=user.name,
            profile_picture=user.profile_picture,
            auth_provider=user.auth_provider,
            is_email_verified=user.is_email_verified,
        ),
        access_token=access_token,
        refresh_token=None,
    )
