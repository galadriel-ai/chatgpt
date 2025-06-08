from typing import Optional
from uuid import UUID

from app.domain.users.entities import OAuthUserInfo, User
from app.repository.user_repository import UserRepository
from app.repository.utils import utcnow
from uuid_extensions import uuid7


async def execute(
    oauth_user_info: OAuthUserInfo,
    additional_user_data: dict,
    user_repository: UserRepository,
) -> User:
    """
    Unified domain use case for OAuth authentication - handles user creation/update logic
    for any OAuth provider (Google, Apple, etc.)

    Args:
        oauth_user_info: Verified user info from OAuth provider
        additional_user_data: Additional user data from the request (name, profile_picture for Apple)
        user_repository: Repository for user operations
    """

    # Check if user exists by provider and provider ID or email
    user = await user_repository.get_by_provider(
        oauth_user_info.provider, oauth_user_info.provider_id
    )

    # If not found by provider ID, try by email
    if not user and oauth_user_info.email:
        user = await user_repository.get_by_email(oauth_user_info.email)

    if user:
        # Update existing user with OAuth info if needed
        updated_user = _update_existing_user(user, oauth_user_info, additional_user_data)
        await user_repository.update(updated_user)
        return updated_user
    else:
        # Create new user
        new_user = _create_new_user(oauth_user_info, additional_user_data)
        await user_repository.insert(new_user)
        return new_user


def _update_existing_user(
    user: User, oauth_user_info: OAuthUserInfo, additional_user_data: dict
) -> User:
    """Update existing user with OAuth information"""

    # Use OAuth info or additional data, falling back to existing user data
    name = oauth_user_info.name or additional_user_data.get("name") or user.name

    profile_picture = (
        oauth_user_info.profile_picture
        or additional_user_data.get("profile_picture")
        or user.profile_picture
    )

    return User(
        uid=user.uid,
        email=user.email or oauth_user_info.email,
        name=name,
        profile_picture=profile_picture,
        auth_provider=user.auth_provider or oauth_user_info.provider,
        provider_id=user.provider_id or oauth_user_info.provider_id,
        is_email_verified=user.is_email_verified or oauth_user_info.is_email_verified,
        created_at=user.created_at,
        last_login_at=utcnow(),
    )


def _create_new_user(oauth_user_info: OAuthUserInfo, additional_user_data: dict) -> User:
    """Create new user from OAuth information"""

    # Use OAuth info or additional data for name and profile picture
    name = oauth_user_info.name or additional_user_data.get("name")
    profile_picture = oauth_user_info.profile_picture or additional_user_data.get("profile_picture")

    return User(
        uid=uuid7(),
        email=oauth_user_info.email,
        name=name,
        profile_picture=profile_picture,
        auth_provider=oauth_user_info.provider,
        provider_id=oauth_user_info.provider_id,
        is_email_verified=oauth_user_info.is_email_verified,
        created_at=utcnow(),
        last_login_at=utcnow(),
    )
