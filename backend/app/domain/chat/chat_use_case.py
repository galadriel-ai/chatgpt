import json
from copy import deepcopy
from typing import AsyncGenerator
from typing import List
from typing import Optional
from uuid import UUID

from uuid_extensions import uuid7

from app import api_logger
from app.domain.chat import detect_intent_use_case
from app.domain.chat import get_system_prompt_use_case
from app.domain.chat.entities import Chat
from app.domain.chat.entities import ChatInput
from app.domain.chat.entities import ChatOutputChunk
from app.domain.chat.entities import ChunkOutput
from app.domain.chat.entities import ErrorChunk
from app.domain.chat.entities import BackgroundChunk
from app.domain.chat.entities import GenerationChunk
from app.domain.chat.entities import Intent
from app.domain.chat.entities import Message
from app.domain.chat.entities import Model
from app.domain.chat.entities import ModelConfig
from app.domain.chat.entities import ModelSpec
from app.domain.chat.entities import NewChatOutput
from app.domain.chat.entities import ToolCall
from app.domain.chat.entities import ToolOutput
from app.domain.chat.utils import get_images
from app.domain.generation.entities import GenerationInput
from app.domain.generation.entities import GenerationType
from app.domain.generation import generate_image_use_case
from app.domain.llm_tools.search import search_web
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
from app.domain.users import get_rate_limit_error_use_case
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.repository.file_repository import FileRepository
from app.repository.llm_repository import LlmRepository
from app.repository.generation_repository import GenerationRepository
from app.repository.wavespeed_repository import WavespeedRepository
from app.service import error_responses
from settings import SUPPORTED_MODELS
from app.exceptions import LlmError

logger = api_logger.get()

MAX_TITLE_LENGTH = 30


async def execute(
    chat_input: ChatInput,
    user: User,
    llm_repository: LlmRepository,
    chat_repository: ChatRepository,
    file_repository: FileRepository,
    configuration_repository: ChatConfigurationRepository,
    generation_repository: GenerationRepository,
    wavespeed_repository: WavespeedRepository,
) -> AsyncGenerator[ChatOutputChunk, None]:
    chat = await _get_chat(chat_input, user, chat_repository, configuration_repository)
    if not chat:
        yield ErrorChunk(
            error=error_responses.NotFoundAPIError("chat_id not found.").to_message()
        )
        return

    intent = await detect_intent_use_case.execute(chat_input.content, llm_repository)
    images = await get_images(chat_input.attachment_ids, file_repository)
    model_type = (
        Model.THINK_MODEL
        if chat_input.think_model
        else Model.VLM_MODEL
        if images
        else Model.DEFAULT_MODEL
    )
    model = ModelSpec(
        type=model_type,
        config=ModelConfig(),
    )
    if model.type.value not in SUPPORTED_MODELS:
        yield ErrorChunk(
            error=f"Unsupported model type, supported model types are {', '.join(SUPPORTED_MODELS.keys())}. But got {model.type.value}"
        )
        return
    if rate_limit_error := await get_rate_limit_error_use_case.execute(
        user, chat_repository
    ):
        yield ErrorChunk(error=rate_limit_error)
        return

    yield NewChatOutput(
        chat_id=chat.id,
    )

    system_prompt = await get_system_prompt_use_case.execute(
        chat_input, user, configuration_repository
    )
    messages = await _get_existing_messages(chat, system_prompt, chat_repository)
    new_messages = await _get_new_messages(chat_input, chat, messages, system_prompt)

    match intent:
        case Intent.IMAGE_GENERATION:
            generation_output = await generate_image_use_case.execute(
                user,
                GenerationInput(
                    type=GenerationType.IMAGE,
                    prompt=chat_input.content,
                    chat_id=chat.id,
                ),
                generation_repository,
                wavespeed_repository,
            )
            yield GenerationChunk(
                generation_id=str(generation_output.id),
                generation_message="Generating image...",
            )
            await chat_repository.insert_messages(new_messages)
            return
        case _:
            if images:
                yield BackgroundChunk(background_processing="Processing image(s)...")
            if chat_input.think_model:
                yield BackgroundChunk(background_processing="Thinking...")

    llm_input_messages = [deepcopy(m) for m in messages]
    llm_input_messages.extend([deepcopy(m) for m in new_messages])

    llm_message = Message(
        id=uuid7(),
        chat_id=chat.id,
        role="assistant",
        content="",
        model=model.type.value,
        attachment_ids=[],
    )

    messages_to_llm = [m.to_llm_ready_dict() for m in llm_input_messages[:-1]]
    messages_to_llm.append(llm_input_messages[-1].to_llm_ready_dict_with_images(images))

    try:
        while True:
            final_tool_calls = {}
            current_tool_call_id = None

            async for chunk in llm_repository.completion(
                messages_to_llm, model, chat_input.is_search_enabled or False
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
                                logger.info(f"Searching the web for: {args['query']}")
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
                                    attachment_ids=[],
                                )
                                yield BackgroundChunk(
                                    background_processing="Searching the web..."
                                )
                                new_messages.append(tool_call_message)
                                messages_to_llm.append(
                                    tool_call_message.to_llm_ready_dict()
                                )

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
                                        attachment_ids=[],
                                    )
                                    new_messages.append(tool_message)
                                    messages_to_llm.append(
                                        tool_message.to_llm_ready_dict()
                                    )
                                    # finally yield the tool output with the result
                                    yield ToolOutput(
                                        tool_call_id=tool_call_id,
                                        name=chunk.name,
                                        arguments=chunk.arguments,
                                        result=result,
                                    )
                                except Exception as e:
                                    logger.error(f"Search failed: {str(e)}")
                                    yield ErrorChunk(
                                        error="Failed to search the web. Please try again."
                                    )
                                    break
                        except json.JSONDecodeError:
                            continue

            if not final_tool_calls:
                break

        new_messages.append(llm_message)
        await chat_repository.insert_messages(new_messages)
    except LlmError as e:
        yield ErrorChunk(error=e.message)
    except Exception:
        yield ErrorChunk(
            error="An unexpected error occurred. Please try again in a few moments."
        )


async def _get_new_messages(
    chat_input: ChatInput,
    chat: Chat,
    existing_messages: List[Message],
    system_prompt: str,
) -> List[Message]:
    new_messages = []
    if not existing_messages:
        new_messages.append(
            Message(
                id=uuid7(),
                chat_id=chat.id,
                role="system",
                content=system_prompt,
                model=None,
                attachment_ids=[],
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


async def _get_chat(
    chat_input: ChatInput,
    user: User,
    chat_repository: ChatRepository,
    configuration_repository: ChatConfigurationRepository,
) -> Optional[Chat]:
    if not chat_input.chat_id:
        chat = await _create_chat(
            chat_input, user, chat_repository, configuration_repository
        )
    else:
        chat = await chat_repository.get(chat_input.chat_id)
    return chat


async def _create_chat(
    chat_input: ChatInput,
    user: User,
    chat_repository: ChatRepository,
    configuration_repository: ChatConfigurationRepository,
) -> Chat:
    configuration_id: Optional[UUID] = None
    if chat_input.configuration_id:
        configuration = await configuration_repository.get_by_id_and_user(
            chat_input.configuration_id, user.uid
        )
        if configuration:
            # Should error if not found?
            configuration_id = configuration.id
    return await chat_repository.insert(
        user.uid, chat_input.content[:MAX_TITLE_LENGTH], configuration_id
    )


async def _get_existing_messages(
    chat: Chat,
    system_prompt: str,
    chat_repository: ChatRepository,
) -> List[Message]:
    messages = await chat_repository.get_messages(chat.id)
    if messages and messages[0].role == "system":
        messages[0].content = system_prompt
    return messages
