import os
from datetime import datetime, timedelta

from app.domain.users.entities import (
    User,
    TokenPayload,
    InvalidTokenTypeError,
    InvalidTokenPayloadError,
    InvalidTokenError,
)
from jose import JWTError, jwt

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15


class JwtRepository:
    """Repository for JWT token operations - handles serialization/deserialization of user data in tokens"""

    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

    def create_access_token(self, user: User) -> str:
        """Serialize user data into a JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        payload = {
            "user_id": str(user.uid),
            "email": user.email,
            "name": user.name,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access",
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_access_token(self, token: str) -> TokenPayload:
        """Deserialize and verify JWT access token, return token payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            if payload.get("type") != "access":
                raise InvalidTokenTypeError("Invalid token type")

            user_id = payload.get("user_id")
            if user_id is None:
                raise InvalidTokenPayloadError(
                    "Invalid token payload - missing user_id"
                )

            return TokenPayload(
                user_id=user_id,
                email=payload.get("email"),
                name=payload.get("name"),
                exp=payload.get("exp"),
                iat=payload.get("iat"),
            )
        except JWTError:
            raise InvalidTokenError("Invalid access token - cannot decode or verify")


# Convenience functions for backward compatibility
def create_access_token(user: User) -> str:
    """Create an access token for the user"""
    repository = JwtRepository()
    return repository.create_access_token(user)


def verify_access_token(token: str) -> TokenPayload:
    """Verify and decode an access token"""
    repository = JwtRepository()
    return repository.verify_access_token(token)
