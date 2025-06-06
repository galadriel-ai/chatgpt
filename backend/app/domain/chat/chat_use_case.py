from copy import deepcopy
from typing import AsyncGenerator
from typing import List
from typing import Optional

from uuid_extensions import uuid7

import settings
from app.domain.chat.entities import Chat
from app.domain.chat.entities import ChatInput
from app.domain.chat.entities import ChatOutputChunk
from app.domain.chat.entities import ChunkOutput
from app.domain.chat.entities import ErrorChunk
from app.domain.chat.entities import Message
from app.domain.chat.entities import NewChatOutput
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository
from app.repository.llm_repository import LlmRepository
from app.service import error_responses

MAX_TITLE_LENGTH = 30

DEFAULT_MODEL = settings.LLM_MODEL
DEFAULT_SYSTEM_MESSAGE = "You are a helpful assistant."


async def execute(
    chat_input: ChatInput,
    user: User,
    llm_repository: LlmRepository,
    chat_repository: ChatRepository,
) -> AsyncGenerator[ChatOutputChunk, None]:
    chat = await _get_chat(chat_input, user, chat_repository)
    if not chat:
        yield ErrorChunk(
            error=error_responses.NotFoundAPIError("chat_id not found.").to_message()
        )
        return
    yield NewChatOutput(
        chat_id=chat.id,
    )

    # TODO: validate model
    model = chat_input.model or DEFAULT_MODEL

    messages = await _get_existing_messages(chat_input, chat, chat_repository)
    new_messages = await _get_new_messages(chat_input, chat, messages)

    llm_input_messages = [deepcopy(m) for m in messages]
    llm_input_messages.extend([deepcopy(m) for m in new_messages])

    llm_message = Message(
        id=uuid7(),
        chat_id=chat.id,
        role="assistant",
        content="",
        model=model,
    )
    async for chunk in llm_repository.completion(llm_input_messages, model):
        llm_message.content += chunk
        yield ChunkOutput(
            content=chunk,
        )
    new_messages.append(llm_message)
    await chat_repository.insert_messages(new_messages)


async def _get_new_messages(
    chat_input: ChatInput,
    chat: Chat,
    existing_messages: List[Message],
) -> List[Message]:
    new_messages = []
    if not existing_messages:
        new_messages.append(
            Message(
                id=uuid7(),
                chat_id=chat.id,
                role="system",
                content=DEFAULT_SYSTEM_MESSAGE,
                model=None,
            )
        )
    new_messages.append(
        Message(
            id=uuid7(),
            chat_id=chat.id,
            role="user",
            content=chat_input.content,
            model=None,
        )
    )
    return new_messages


async def _get_chat(chat_input, user, chat_repository) -> Optional[Chat]:
    if not chat_input.chat_id:
        chat = await _create_chat(chat_input, user, chat_repository)
    else:
        chat = await chat_repository.get(chat_input.chat_id)
    return chat


async def _create_chat(
    chat_input: ChatInput,
    user: User,
    chat_repository: ChatRepository,
) -> Chat:
    chat = Chat(
        id=uuid7(),
        user_id=user.uid,
        # Probably want a nicer title
        title=chat_input.content[:MAX_TITLE_LENGTH],
    #     TODO:
    )
    await chat_repository.insert(chat)
    return chat


async def _get_existing_messages(
    chat_input: ChatInput,
    chat: Chat,
    chat_repository: ChatRepository,
) -> List[Message]:
    return await chat_repository.get_messages(chat.id)
