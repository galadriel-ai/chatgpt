from typing import Optional
from uuid import UUID

import sqlalchemy

from app import api_logger
from app.domain.users.entities import User
from app.repository.connection import SessionProvider
from app.repository.utils import utcnow

SQL_INSERT = """
INSERT INTO user_profile (
    id,
    email,
    name,
    profile_picture,
    auth_provider,
    provider_id,
    is_email_verified,
    created_at,
    last_updated_at,
    last_login_at
)
VALUES (
    :id,
    :email,
    :name,
    :profile_picture,
    :auth_provider,
    :provider_id,
    :is_email_verified,
    :created_at,
    :last_updated_at,
    :last_login_at
);
"""

SQL_UPDATE = """
UPDATE user_profile 
SET 
    email = COALESCE(:email, email),
    name = COALESCE(:name, name),
    profile_picture = COALESCE(:profile_picture, profile_picture),
    auth_provider = COALESCE(:auth_provider, auth_provider),
    provider_id = COALESCE(:provider_id, provider_id),
    is_email_verified = COALESCE(:is_email_verified, is_email_verified),
    last_updated_at = :last_updated_at,
    last_login_at = :last_login_at
WHERE id = :id;
"""

SQL_GET_BY_ID = """
SELECT
    id,
    email,
    name,
    profile_picture,
    auth_provider,
    provider_id,
    is_email_verified,
    created_at,
    last_updated_at,
    last_login_at
FROM user_profile
WHERE id = :id;
"""

SQL_GET_BY_EMAIL = """
SELECT
    id,
    email,
    name,
    profile_picture,
    auth_provider,
    provider_id,
    is_email_verified,
    created_at,
    last_updated_at,
    last_login_at
FROM user_profile
WHERE email = :email;
"""

SQL_GET_BY_PROVIDER = """
SELECT
    id,
    email,
    name,
    profile_picture,
    auth_provider,
    provider_id,
    is_email_verified,
    created_at,
    last_updated_at,
    last_login_at
FROM user_profile
WHERE auth_provider = :auth_provider AND provider_id = :provider_id;
"""

logger = api_logger.get()


class UserRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    def _row_to_user(self, row) -> User:
        """Convert database row to User entity"""
        return User(
            uid=row.id,
            email=row.email,
            name=row.name,
            profile_picture=row.profile_picture,
            auth_provider=row.auth_provider,
            provider_id=row.provider_id,
            is_email_verified=row.is_email_verified,
            created_at=row.created_at,
            last_login_at=row.last_login_at,
        )

    async def insert(self, user: User):
        """Insert a new user"""
        data = {
            "id": user.uid,
            "email": user.email,
            "name": user.name,
            "profile_picture": user.profile_picture,
            "auth_provider": user.auth_provider,
            "provider_id": user.provider_id,
            "is_email_verified": user.is_email_verified,
            "created_at": user.created_at or utcnow(),
            "last_updated_at": utcnow(),
            "last_login_at": user.last_login_at or utcnow(),
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()

    async def update(self, user: User):
        """Update an existing user"""
        data = {
            "id": user.uid,
            "email": user.email,
            "name": user.name,
            "profile_picture": user.profile_picture,
            "auth_provider": user.auth_provider,
            "provider_id": user.provider_id,
            "is_email_verified": user.is_email_verified,
            "last_updated_at": utcnow(),
            "last_login_at": user.last_login_at or utcnow(),
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_UPDATE), data)
            await session.commit()

    async def get_by_id(self, user_profile_id: UUID) -> Optional[User]:
        """Get user by ID"""
        data = {"id": user_profile_id}
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET_BY_ID), data)
            row = result.first()
            if row:
                return self._row_to_user(row)
        return None

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        data = {"email": email}
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET_BY_EMAIL), data)
            row = result.first()
            if row:
                return self._row_to_user(row)
        return None

    async def get_by_provider(
        self, auth_provider: str, provider_id: str
    ) -> Optional[User]:
        """Get user by auth provider and provider ID"""
        data = {"auth_provider": auth_provider, "provider_id": provider_id}
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET_BY_PROVIDER), data)
            row = result.first()
            if row:
                return self._row_to_user(row)
        return None
