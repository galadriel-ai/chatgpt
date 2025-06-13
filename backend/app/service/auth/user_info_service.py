from app.domain.users.entities import User
from app.service.auth.entities import UserInfoResponse, DetailedUserResponse


def execute(current_user: User) -> UserInfoResponse:
    """Get current authenticated user information"""
    return UserInfoResponse(
        user=DetailedUserResponse(
            uid=str(current_user.uid),
            email=current_user.email,
            name=current_user.name,
            profile_picture=current_user.profile_picture,
            auth_provider=current_user.auth_provider,
            is_email_verified=current_user.is_email_verified,
            created_at=current_user.created_at.isoformat()
            if current_user.created_at
            else None,
            last_login_at=(
                current_user.last_login_at.isoformat()
                if current_user.last_login_at
                else None
            ),
        )
    )
