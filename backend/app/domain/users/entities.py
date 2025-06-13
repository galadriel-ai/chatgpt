from dataclasses import dataclass
from enum import Enum
from typing import List
from typing import Literal
from datetime import datetime
from typing import Optional

from uuid import UUID


@dataclass
class MessageRateLimit:
    hours: Literal[24]
    unit: Literal["day"]


MESSAGE_RATE_LIMIT_TIMEFRAMES: List[MessageRateLimit] = [
    MessageRateLimit(
        hours=24,
        unit="day",
    )
]


class BillingPlan(str, Enum):
    FREE = "FREE"

    def get_max_user_message_count(self, rate_limit: MessageRateLimit) -> int:
        if rate_limit.unit == "day":
            if self == BillingPlan.FREE:
                return 80
        return 0


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
    # Once we get different plans, store it in DB
    billing_plan: BillingPlan = BillingPlan.FREE


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
