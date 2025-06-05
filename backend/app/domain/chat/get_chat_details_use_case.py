from uuid import UUID

from app.domain.chat.entities import ChatDetails
from app.repository.chat_repository import ChatRepository
from app.service import error_responses


async def execute(
    chat_id: UUID,
    chat_repository: ChatRepository,
) -> ChatDetails:
    chat = await chat_repository.get(chat_id)
    if not chat:
        raise error_responses.NotFoundAPIError()
    messages = await chat_repository.get_messages(chat.id)
    return ChatDetails(
        id=chat.id,
        user_id=chat.user_id,
        title=chat.title,
        messages=messages,
    )
