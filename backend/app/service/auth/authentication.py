from typing import Optional
from uuid import UUID

from app import dependencies, api_logger

from app.domain.users.entities import User, JwtTokenError
from app.repository.jwt_repository import verify_access_token
from app.repository.user_repository import UserRepository

from fastapi import Depends, HTTPException, status

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()


logger = api_logger.get()


async def validate_session_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_repository: UserRepository = Depends(dependencies.get_user_repository),
) -> User:
    try:
        # Verify the access token
        token_payload = verify_access_token(credentials.credentials)

        # Get user from database
        user = await user_repository.get_by_id(UUID(token_payload.user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
            )

        return user

    except JwtTokenError as e:
        # Convert domain JWT exceptions to HTTP exceptions
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


async def require_valid_session(
    user: Optional[User] = Depends(validate_session_token),
) -> User:
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
