from app.domain.users import create_user_use_case
from app.domain.users.oauth_use_case import OAuthService
from app.repository.jwt_repository import create_access_token
from app.repository.user_repository import UserRepository
from app.service.auth.entities import AppleAuthRequest, AuthResponse, UserResponse
from app import api_logger

logger = api_logger.get()


async def execute(
    auth_request: AppleAuthRequest,
    user_repository: UserRepository,
    oauth_service: OAuthService,
) -> AuthResponse:
    """Execute Apple authentication process"""

    logger.debug(f"Apple authentication request: {auth_request}")

    # Verify Apple token and get unified user info
    oauth_user_info = await oauth_service.verify_apple_token(
        auth_request.identity_token, auth_request.apple_id
    )

    # Prepare additional user data from the request (Apple doesn't provide these in token)
    additional_user_data = {
        "name": auth_request.name,
        "email": auth_request.email,  # Apple might provide email in request but not in token
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
