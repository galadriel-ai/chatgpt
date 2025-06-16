from datetime import datetime
from datetime import timedelta
from typing import List
from typing import Optional
from uuid import UUID

import sqlalchemy

from app.domain.chat.entities import ChatConfiguration
from app.domain.chat.entities import ChatConfigurationInput
from app.domain.chat.entities import ChatConfigurationSummary
from app.domain.chat.entities import Message
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

SQL_UPDATE = """
UPDATE chat_configuration
SET 
    user_name = :user_name,
    ai_name = :ai_name,
    description = :description,
    role = :role,
    last_updated_at = :last_updated_at
WHERE id = :id;
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
    cc.id,
    cc.user_name,
    cc.ai_name,
    cc.description,
    cc.role,
    cc.user_profile_id,
    ccs.id AS summary_id,
    ccs.summary,
    ccs.last_summarized_at
FROM chat_configuration cc
LEFT JOIN chat_configuration_summary ccs ON ccs.chat_configuration_id = cc.id
WHERE 
    cc.id = :id 
    AND cc.user_profile_id = :user_id;
"""

SQL_GET_CHARACTERS_NEEDING_SUMMARIZATION = """
SELECT 
    cc.id AS configuration_id,
    cc.user_profile_id,
    cc.user_name,
    cc.ai_name,
    cc.description,
    cc.role,
    ccs.id AS summary_id,
    ccs.summary,
    ccs.last_summarized_at
FROM chat_configuration cc
LEFT JOIN chat_configuration_summary ccs ON ccs.chat_configuration_id = cc.id
WHERE 
    ccs.last_summarized_at < :last_summarized_at OR ccs.last_summarized_at IS NULL;
"""

SQL_GET_MESSAGES_BY_CONFIGURATION = """
SELECT 
        m.id,
    m.chat_id,
    m.role,
    m.attachment_ids,
    m.content,
    m.model
FROM message m
LEFT JOIN chat c ON m.chat_id = c.id
WHERE
    (m.created_at > :starting_from OR :starting_from IS NULL)
    AND c.chat_configuration_id = :configuration_id
    AND m.role != 'system'
    AND m.tool_calls IS NULL
ORDER BY m.id;
"""

SQL_UPSERT_SUMMARY = """
INSERT INTO chat_configuration_summary (
    id, 
    chat_configuration_id, 
    summary, 
    last_summarized_at, 
    created_at, 
    last_updated_at
) VALUES (
    :id, 
    :chat_configuration_id, 
    :summary, 
    :last_summarized_at, 
    :created_at, 
    :last_updated_at
) ON CONFLICT (chat_configuration_id)
DO UPDATE SET summary = :summary, last_summarized_at = :last_summarized_at,  last_updated_at = :last_updated_at;
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

    async def update(
        self, configuration: ChatConfigurationInput, configuration_id: UUID
    ) -> UUID:
        utc_now = utcnow()
        data = {
            "id": configuration_id,
            "user_name": configuration.user_name,
            "ai_name": configuration.ai_name,
            "description": configuration.description,
            "role": configuration.role,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_UPDATE), data)
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
    ) -> Optional[ChatConfigurationSummary]:
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
                return ChatConfigurationSummary(
                    id=row.id,
                    user_name=row.user_name,
                    ai_name=row.ai_name,
                    description=row.description,
                    role=row.role,
                    user_profile_id=row.user_profile_id,
                    summary_id=row.summary_id,
                    summary=row.summary,
                    last_summarized_at=row.last_summarized_at,
                )
        return None

    async def get_characters_needing_summarization(
        self, last_summarized_at_seconds_ago: int
    ) -> List[ChatConfigurationSummary]:
        last_summarized_at = utcnow() - timedelta(
            seconds=last_summarized_at_seconds_ago
        )
        data = {
            "last_summarized_at": last_summarized_at,
        }
        results = []
        async with self._session_provider_read.get() as session:
            rows = await session.execute(
                sqlalchemy.text(SQL_GET_CHARACTERS_NEEDING_SUMMARIZATION), data
            )
            for row in rows:
                results.append(
                    ChatConfigurationSummary(
                        id=row.configuration_id,
                        user_name=row.user_name,
                        ai_name=row.ai_name,
                        description=row.description,
                        role=row.role,
                        user_profile_id=row.user_profile_id,
                        summary_id=row.summary_id,
                        summary=row.summary,
                        last_summarized_at=row.last_summarized_at,
                    )
                )
        return results

    async def get_chat_messages_by_configuration(
        self, configuration_id: UUID, starting_from: Optional[datetime]
    ) -> List[Message]:
        data = {
            "configuration_id": configuration_id,
            "starting_from": starting_from,
        }
        results = []
        async with self._session_provider_read.get() as session:
            rows = await session.execute(
                sqlalchemy.text(SQL_GET_MESSAGES_BY_CONFIGURATION), data
            )
            for row in rows:
                results.append(
                    Message(
                        id=row.id,
                        chat_id=row.chat_id,
                        role=row.role,
                        attachment_ids=row.attachment_ids,
                        content=row.content,
                        model=row.model,
                        tool_call=None,
                        tool_calls=None,
                    )
                )
        return results

    async def upsert_summary(
        self,
        summary: str,
        last_summarized_at: datetime,
        configuration_id: UUID,
    ):
        utc_now = utcnow()
        data = {
            "id": uuid7(),
            "chat_configuration_id": configuration_id,
            "summary": summary,
            "last_summarized_at": last_summarized_at,
            "created_at": utc_now,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_UPSERT_SUMMARY), data)
            await session.commit()
