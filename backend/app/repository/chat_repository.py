from typing import List
from typing import Optional
from uuid import UUID
import json

import sqlalchemy
from uuid_extensions import uuid7

from app.domain.chat.entities import Chat
from app.domain.chat.entities import Message
from app.domain.chat.entities import ToolCall
from app.repository import utils
from app.repository.connection import SessionProvider
from app.repository.utils import utcnow

SQL_INSERT = """
INSERT INTO chat (
    id,
    chat_configuration_id,
    user_profile_id,
    title,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :chat_configuration_id,
    :user_id,
    :title,
    :created_at,
    :last_updated_at
);
"""

SQL_GET = """
SELECT 
    id,
    chat_configuration_id,
    user_profile_id,
    title,
    created_at
FROM chat
WHERE id = :id;
"""

SQL_GET_BY_USER = """
SELECT 
    id,
    chat_configuration_id,
    user_profile_id,
    title,
    created_at
FROM chat
WHERE user_profile_id = :user_id
ORDER BY id DESC;
"""

SQL_INSERT_MESSAGE = """
INSERT INTO message (
    id,
    chat_id,
    role,
    content,
    image_url,
    model,
    attachment_ids,
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
    :image_url,
    :model,
    :attachment_ids,
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
    image_url,
    model,
    tool_call_id,
    tool_name,
    tool_calls,
    sequence_number,
    attachment_ids,
    created_at
FROM message
WHERE chat_id = :chat_id
ORDER BY sequence_number;
"""

SQL_GET_MESSAGE_COUNT_BY_USER = """
SELECT 
    COUNT(m.id) AS count
FROM message m
LEFT JOIN chat c ON m.chat_id = c.id
WHERE 
    c.user_profile_id = :user_id
    AND m.role = 'user'
    AND m.id > :min_message_id;
"""


class ChatRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    async def insert(
        self, user_id: UUID, title: str, configuration_id: Optional[UUID]
    ) -> Chat:
        utc_now = utcnow()
        chat = Chat(
            id=uuid7(),
            configuration_id=configuration_id,
            user_id=user_id,
            title=title,
            created_at=utc_now,
        )
        data = {
            "id": chat.id,
            "chat_configuration_id": chat.configuration_id,
            "user_id": chat.user_id,
            "title": chat.title,
            "created_at": utc_now,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()
        return chat

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
                    configuration_id=row.chat_configuration_id,
                    user_id=row.user_profile_id,
                    title=row.title,
                    created_at=row.created_at,
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
                        configuration_id=row.chat_configuration_id,
                        user_id=row.user_profile_id,
                        title=row.title,
                        created_at=row.created_at,
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
                    "image_url": message.image_url,
                    "model": message.model,
                    "tool_call_id": message.tool_call.id if message.tool_call else None,
                    "tool_name": message.tool_call.function["name"]
                    if message.tool_call
                    else None,
                    "tool_calls": json.dumps(
                        [tc.to_serializable_dict() for tc in message.tool_calls]
                    )
                    if message.tool_calls
                    else None,
                    "sequence_number": current_max + i,
                    "attachment_ids": message.attachment_ids,
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

                tool_call = None
                if row.tool_call_id and row.tool_name:
                    tool_call = ToolCall(
                        id=row.tool_call_id, function={"name": row.tool_name}
                    )

                messages.append(
                    Message(
                        id=row.id,
                        chat_id=row.chat_id,
                        role=row.role,
                        content=row.content,
                        image_url=row.image_url,
                        model=row.model,
                        tool_call=tool_call,
                        tool_calls=tool_calls,
                        attachment_ids=row.attachment_ids,
                    )
                )
        return messages

    async def get_message_count_by_user(
        self, user_id: UUID, hours_back: int = 24
    ) -> int:
        data = {"user_id": user_id, "min_message_id": utils.historic_uuid(hours_back)}
        async with self._session_provider_read.get() as session:
            result = await session.execute(
                sqlalchemy.text(SQL_GET_MESSAGE_COUNT_BY_USER), data
            )
            row = result.first()
            if row:
                return row.count
        return 0
