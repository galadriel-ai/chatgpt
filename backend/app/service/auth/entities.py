from dataclasses import dataclass
from typing import Optional

from pydantic import BaseModel


class UserResponse(BaseModel):
    """User data in authentication responses"""

    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    auth_provider: Optional[str] = None
    is_email_verified: bool = False


class UserInfoResponse(BaseModel):
    """Detailed user information response"""

    user: "DetailedUserResponse"


class DetailedUserResponse(BaseModel):
    """Detailed user data including timestamps"""

    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    auth_provider: Optional[str] = None
    is_email_verified: bool = False
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: str
    name: str
    email: str
    google_id: str
    profile_picture: Optional[str] = None


class AppleAuthRequest(BaseModel):
    identity_token: str
    authorization_code: str
    name: Optional[str] = None
    email: Optional[str] = None
    apple_id: str


class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: str
    refresh_token: Optional[str] = None


@dataclass(frozen=True)
class TokenPayload:
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
