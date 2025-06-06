from typing import List
from typing import Optional
from uuid import UUID
import json

import sqlalchemy

from app.domain.chat.entities import Chat
from app.domain.chat.entities import Message
from app.domain.chat.entities import ToolCall
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
    tool_call_id,
    tool_name,
    tool_calls,
    sequence_number,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :chat_id,
    :role,
    :content,
    :model,
    :tool_call_id,
    :tool_name,
    :tool_calls,
    :sequence_number,
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
    tool_call_id,
    tool_name,
    tool_calls,
    sequence_number,
    created_at
FROM message
WHERE chat_id = :chat_id
ORDER BY sequence_number;
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

        # Get the current max sequence number for this chat
        async with self._session_provider.get() as session:
            result = await session.execute(
                sqlalchemy.text(
                    "SELECT COALESCE(MAX(sequence_number), 0) FROM message WHERE chat_id = :chat_id"
                ),
                {"chat_id": messages[0].chat_id},
            )
            current_max = result.scalar() or 0

        async with self._session_provider.get() as session:
            for i, message in enumerate(messages, start=1):
                data = {
                    "id": message.id,
                    "chat_id": message.chat_id,
                    "role": message.role,
                    "content": message.content,
                    "model": message.model,
                    "tool_call_id": message.tool_call_id,
                    "tool_name": message.tool_name,
                    "tool_calls": json.dumps(
                        [tc.to_serializable_dict() for tc in message.tool_calls]
                    )
                    if message.tool_calls
                    else None,
                    "sequence_number": current_max + i,
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
                tool_calls = None
                if row.tool_calls:
                    tool_calls_data = json.loads(row.tool_calls)
                    tool_calls = [
                        ToolCall(id=tc["id"], function=tc["function"])
                        for tc in tool_calls_data
                    ]
                messages.append(
                    Message(
                        id=row.id,
                        chat_id=row.chat_id,
                        role=row.role,
                        content=row.content,
                        model=row.model,
                        tool_call_id=row.tool_call_id,
                        tool_name=row.tool_name,
                        tool_calls=tool_calls,
                    )
                )
        return messages
