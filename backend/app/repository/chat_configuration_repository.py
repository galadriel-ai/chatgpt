from typing import Optional
from uuid import UUID

import sqlalchemy

from app.domain.chat.entities import ChatConfiguration
from app.domain.chat.entities import ChatConfigurationInput
from app.repository.connection import SessionProvider
from app.repository.utils import utcnow
from uuid_extensions import uuid7

SQL_INSERT = """
INSERT INTO chat_configuration (
    id,
    user_profile_id,
    user_name,
    ai_name,
    description,
    role,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :user_id,
    :user_name,
    :ai_name,
    :description,
    :role,
    :created_at,
    :last_updated_at
);
"""

SQL_GET_LATEST_BY_USER = """
SELECT
    id,
    user_name,
    ai_name,
    description,
    role
FROM chat_configuration
WHERE user_profile_id = :user_id
ORDER BY id DESC
LIMIT 1;
"""

SQL_GET_BY_ID_AND_USER = """
SELECT
    id,
    user_name,
    ai_name,
    description,
    role
FROM chat_configuration
WHERE 
    id = :id 
    AND user_profile_id = :user_id;
"""


class ChatConfigurationRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    async def insert(
        self, configuration: ChatConfigurationInput, user_id: UUID
    ) -> UUID:
        utc_now = utcnow()
        configuration_id = uuid7()
        data = {
            "id": configuration_id,
            "user_id": user_id,
            "user_name": configuration.user_name,
            "ai_name": configuration.ai_name,
            "description": configuration.description,
            "role": configuration.role,
            "created_at": utc_now,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()
        return configuration_id

    async def get_latest_by_user_id(self, user_id: UUID) -> Optional[ChatConfiguration]:
        data = {
            "user_id": user_id,
        }
        async with self._session_provider_read.get() as session:
            result = await session.execute(
                sqlalchemy.text(SQL_GET_LATEST_BY_USER), data
            )
            row = result.first()
            if row:
                return ChatConfiguration(
                    id=row.id,
                    user_name=row.user_name,
                    ai_name=row.ai_name,
                    description=row.description,
                    role=row.role,
                )
        return None

    async def get_by_id_and_user(
        self, configuration_id: UUID, user_id: UUID
    ) -> Optional[ChatConfiguration]:
        data = {
            "id": configuration_id,
            "user_id": user_id,
        }
        async with self._session_provider_read.get() as session:
            result = await session.execute(
                sqlalchemy.text(SQL_GET_BY_ID_AND_USER), data
            )
            row = result.first()
            if row:
                return ChatConfiguration(
                    id=row.id,
                    user_name=row.user_name,
                    ai_name=row.ai_name,
                    description=row.description,
                    role=row.role,
                )
        return None
