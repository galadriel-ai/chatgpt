from typing import List
from typing import Optional
from uuid import UUID

import sqlalchemy

from app.domain.chat.entities import Chat
from app.domain.chat.entities import Message
from app.repository.connection import SessionProvider
from app.repository.utils import utcnow

SQL_INSERT = """
INSERT INTO chat (
    id,
    user_profile_id,
    title,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :user_id,
    :title,
    :created_at,
    :last_updated_at
);
"""

SQL_GET = """
SELECT 
    id,
    user_profile_id,
    title,
    created_at
FROM chat
WHERE id = :id;
"""

SQL_GET_BY_USER = """
SELECT 
    id,
    user_profile_id,
    title,
    created_at
FROM chat
ORDER BY id DESC;
"""

SQL_INSERT_MESSAGE = """
INSERT INTO message (
    id,
    chat_id,
    role,
    content,
    model,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :chat_id,
    :role,
    :content,
    :model,
    :created_at,
    :last_updated_at
);
"""

SQL_GET_MESSAGES = """
SELECT 
    id,
    chat_id,
    role,
    content,
    model,
    created_at
FROM message
WHERE chat_id = :chat_id
ORDER BY id;
"""


class ChatRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    async def insert(self, chat: Chat) -> None:
        utc_now = utcnow()
        data = {
            "id": chat.id,
            "user_id": chat.user_id,
            "title": chat.title,
            "created_at": utc_now,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()

    async def get(self, chat_id: UUID) -> Optional[Chat]:
        data = {
            "id": chat_id,
        }
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET), data)
            row = result.first()
            if row:
                return Chat(
                    id=row.id,
                    user_id=row.user_profile_id,
                    title=row.title,
                )
        return None

    async def get_by_user(self, user_id: UUID) -> List[Chat]:
        data = {
            "user_id": user_id,
        }
        chats = []
        async with self._session_provider_read.get() as session:
            rows = await session.execute(sqlalchemy.text(SQL_GET_BY_USER), data)
            for row in rows:
                chats.append(
                    Chat(
                        id=row.id,
                        user_id=row.user_profile_id,
                        title=row.title,
                    )
                )
        return chats

    async def insert_messages(self, messages: List[Message]) -> None:
        utc_now = utcnow()

        async with self._session_provider.get() as session:
            for message in messages:
                data = {
                    "id": message.id,
                    "chat_id": message.chat_id,
                    "role": message.role,
                    "content": message.content,
                    "model": message.model,
                    "created_at": utc_now,
                    "last_updated_at": utc_now,
                }
                await session.execute(sqlalchemy.text(SQL_INSERT_MESSAGE), data)
            await session.commit()

    async def get_messages(self, chat_id: UUID) -> List[Message]:
        data = {
            "chat_id": chat_id,
        }
        messages = []
        async with self._session_provider_read.get() as session:
            rows = await session.execute(sqlalchemy.text(SQL_GET_MESSAGES), data)
            for row in rows:
                messages.append(
                    Message(
                        id=row.id,
                        chat_id=row.chat_id,
                        role=row.role,
                        content=row.content,
                        model=row.model,
                    )
                )
        return messages
