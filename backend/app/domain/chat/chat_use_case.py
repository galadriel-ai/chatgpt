from copy import deepcopy
from typing import AsyncGenerator
from typing import List
from typing import Optional
import json

from uuid_extensions import uuid7

import settings
from app.domain.chat.entities import Chat
from app.domain.chat.entities import ChatInput
from app.domain.chat.entities import ChatOutputChunk
from app.domain.chat.entities import ChunkOutput
from app.domain.chat.entities import ErrorChunk
from app.domain.chat.entities import Message
from app.domain.chat.entities import ToolCall
from app.domain.chat.entities import NewChatOutput
from app.domain.chat.entities import ToolOutput
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository
from app.repository.llm_repository import LlmRepository
from app.service import error_responses
from app.domain.llm_tools.search import search_web
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
from app import api_logger

logger = api_logger.get()

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
        attachment_ids=[],
    )

    while True:
        final_tool_calls = {}
        current_tool_call_id = None

        try:
            async for chunk in llm_repository.completion(
                llm_input_messages, model, chat_input.is_search_enabled
            ):
                if isinstance(chunk, ChunkOutput):
                    llm_message.content += chunk.content
                    yield chunk
                elif isinstance(chunk, ToolOutput):
                    if chunk.tool_call_id:
                        current_tool_call_id = chunk.tool_call_id

                    tool_call_id = chunk.tool_call_id or current_tool_call_id
                    if not tool_call_id:
                        logger.warning("Received tool output without tool_call_id")
                        continue

                    if tool_call_id not in final_tool_calls:
                        final_tool_calls[tool_call_id] = {
                            "id": tool_call_id,
                            "name": chunk.name,
                            "arguments": "",
                        }

                    if chunk.arguments:
                        final_tool_calls[tool_call_id]["arguments"] += chunk.arguments
                        try:
                            args = json.loads(
                                final_tool_calls[tool_call_id]["arguments"]
                            )
                            if (
                                final_tool_calls[tool_call_id]["name"]
                                == SEARCH_TOOL_DEFINITION["function"]["name"]
                            ):
                                # Create and persist the assistant's tool call message
                                tool_call = ToolCall(
                                    id=tool_call_id,
                                    function={
                                        "name": SEARCH_TOOL_DEFINITION["function"][
                                            "name"
                                        ],
                                        "arguments": final_tool_calls[tool_call_id][
                                            "arguments"
                                        ],
                                    },
                                )
                                tool_call_message = Message(
                                    id=uuid7(),
                                    chat_id=chat.id,
                                    role="assistant",
                                    tool_calls=[tool_call],
                                    tool_call=tool_call,
                                )
                                yield chunk  # yield the tool call message to show user that we are searching
                                new_messages.append(tool_call_message)
                                llm_input_messages.append(tool_call_message)

                                logger.info(f"Searching web for: {args['query']}")
                                try:
                                    result = await search_web(
                                        args["query"], llm_repository.search_client
                                    )
                                    tool_message = Message(
                                        id=uuid7(),
                                        chat_id=chat.id,
                                        role="tool",
                                        content=result,
                                        tool_call=tool_call,
                                    )
                                    new_messages.append(tool_message)
                                    llm_input_messages.append(tool_message)
                                    # finally yield the tool output with the result
                                    yield ToolOutput(
                                        tool_call_id=tool_call_id,
                                        name=chunk.name,
                                        arguments=chunk.arguments,
                                        result=result,
                                    )
                                except Exception as e:
                                    logger.error(f"Search failed: {str(e)}")
                                    yield ErrorChunk(error=str(e))
                                    break
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            logger.error(f"LLM completion failed: {str(e)}")
            yield ErrorChunk(error=str(e))
            break

        if not final_tool_calls:
            break

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
            attachment_ids=chat_input.attachment_ids,
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
    return await chat_repository.insert(user.uid, chat_input.content[:MAX_TITLE_LENGTH])


async def _get_existing_messages(
    chat_input: ChatInput,
    chat: Chat,
    chat_repository: ChatRepository,
) -> List[Message]:
    return await chat_repository.get_messages(chat.id)
