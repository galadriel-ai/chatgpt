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
    created_at,
    last_updated_at
)
VALUES (
    :id,
    :email,
    :created_at,
    :last_updated_at
);
"""

SQL_GET_ALL = """
SELECT
    id,
    email,
    created_at,
    last_updated_at
FROM user_profile;
"""


logger = api_logger.get()


class UserRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    async def insert(
        self,
        user: User,
    ):
        data = {
            "id": user.uid,
            "email": user.email,
            "created_at": utcnow(),
            "last_updated_at": utcnow(),
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()

    async def get_by_id(self, user_profile_id: UUID) -> Optional[User]:
        data = {
            "id": user_profile_id,
        }
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET_ALL), data)
            row = result.first()
            if row:
                return User(
                    uid=row.id,
                    email=row.email,
                )
        return None
