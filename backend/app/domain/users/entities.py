from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from uuid import UUID


@dataclass(frozen=True)
class User:
    uid: UUID
    email: Optional[str] = None
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    auth_provider: Optional[str] = None  # 'google', 'apple', 'local'
    provider_id: Optional[str] = None  # OAuth provider's unique ID (e.g. Google ID, Apple ID)
    is_email_verified: bool = False
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


@dataclass(frozen=True)
class OAuthUserInfo:
    provider: str  # 'google' or 'apple'
    provider_id: str  # The unique ID from the provider
    email: Optional[str] = None
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    is_email_verified: bool = False


@dataclass(frozen=True)
class TokenPayload:
    """JWT token payload data"""

    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None


class JwtTokenError(Exception):
    """Base exception for JWT token related errors"""

    pass


class InvalidTokenTypeError(JwtTokenError):
    """Raised when token type is invalid"""

    pass


class InvalidTokenPayloadError(JwtTokenError):
    """Raised when token payload is invalid or missing required fields"""

    pass


class InvalidTokenError(JwtTokenError):
    """Raised when token cannot be decoded or verified"""

    pass
