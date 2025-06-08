from typing import Optional
from uuid import UUID

from app import dependencies
from app.domain.users.entities import User, JwtTokenError
from app.repository.jwt_repository import verify_access_token
from app.repository.user_repository import UserRepository

from app.service import error_responses
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_repository: UserRepository = Depends(dependencies.get_user_repository),
) -> User:
    """Get current authenticated user from JWT token"""
    try:
        # Verify the access token
        token_payload = verify_access_token(credentials.credentials)

        # Get user from database
        user = await user_repository.get_by_id(UUID(token_payload.user_id))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return user

    except JwtTokenError as e:
        # Convert domain JWT exceptions to HTTP exceptions
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials"
        )


async def validate_session_token(
    request: Request = None,
    token: str = None,
    user_repository: UserRepository = Depends(dependencies.get_user_repository),
) -> Optional[User]:
    """
    Validate session token and return user if valid, None if invalid

    Args:
        request: FastAPI request object (to extract token from headers)
        token: JWT token string (if provided directly)
        user_repository: User repository for database operations

    Returns:
        User object if token is valid, None if invalid
    """
    try:
        # Extract token from request headers or use provided token
        jwt_token = token
        if not jwt_token and request:
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                jwt_token = authorization.split(" ")[1]

        if not jwt_token:
            return None

        # Verify the access token
        token_payload = verify_access_token(jwt_token)

        # Get user from database
        user = await user_repository.get_by_id(UUID(token_payload.user_id))
        return user

    except Exception:
        # Return None for any validation error (invalid token, user not found, etc.)
        return None


async def require_valid_session(user: Optional[User] = Depends(validate_session_token)) -> User:
    """
    Dependency that requires a valid session token
    Similar to get_current_user but uses validate_session_token internally
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid session token.",
        )
    return user
