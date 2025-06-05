import json

from app.domain.chat import chat_use_case
from app.domain.chat.entities import ChatInput
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository
from app.repository.llm_repository import LlmRepository
from app.service import error_responses
from app.service.chat.entities import ChatRequest
from app.service.utils import parse_uuid


async def execute(
    request: ChatRequest,
    user: User,
    llm_repository: LlmRepository,
    chat_repository: ChatRepository
):
    chat_id = None
    if request.chat_id:
        try:
            chat_id = parse_uuid.parse(request.chat_id)
        except error_responses.APIErrorResponse as e:
            yield json.dumps(
                {"error": e.to_message()}
            )
            return

    chat_input = ChatInput(
        chat_id=chat_id,
        model=request.model,
        content=request.content
    )

    async for chunk in chat_use_case.execute(
        chat_input,
        user,
        llm_repository,
        chat_repository,
    ):
        yield json.dumps(chunk.to_serializable_dict()) + "\n"
