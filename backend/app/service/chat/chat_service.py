import json

from app.domain.chat import chat_use_case
from app.domain.chat.entities import ChatInput
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.repository.file_repository import FileRepository
from app.repository.llm_repository import LlmRepository
from app.service import error_responses
from app.service.chat.entities import ChatRequest
from app.service.utils import parse_uuid

MAX_MESSAGE_LENGTH = 30_000


async def execute(
    request: ChatRequest,
    user: User,
    llm_repository: LlmRepository,
    chat_repository: ChatRepository,
    file_repository: FileRepository,
    configuration_repository: ChatConfigurationRepository,
):
    chat_id = None
    if request.chat_id:
        try:
            chat_id = parse_uuid.parse(request.chat_id)
        except error_responses.APIErrorResponse as e:
            yield json.dumps({"error": e.to_message()})
            return

    if len(request.content) > MAX_MESSAGE_LENGTH:
        yield json.dumps(
            {
                "error": f"Input message is too long, max length is {MAX_MESSAGE_LENGTH} characters."
            }
        )
        return

    uuid_attachment_ids = [
        parse_uuid.parse(attachment_id) for attachment_id in request.attachment_ids
    ]
    chat_input = ChatInput(
        chat_id=chat_id,
        configuration_id=request.configuration_id,
        think_model=request.think_model,
        content=request.content,
        is_search_enabled=request.is_search_enabled,
        attachment_ids=uuid_attachment_ids,
    )

    async for chunk in chat_use_case.execute(
        chat_input,
        user,
        llm_repository,
        chat_repository,
        file_repository,
        configuration_repository,
    ):
        yield json.dumps(chunk.to_serializable_dict()) + "\n"
