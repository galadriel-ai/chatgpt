from app.domain.chat import get_chat_details_use_case
from app.repository.chat_repository import ChatRepository
from app.service.chat.entities import ChatDetailsResponse
from app.service.chat.entities import ChatMessage
from app.service.utils import parse_uuid


async def execute(
    chat_id: str,
    chat_repository: ChatRepository,
) -> ChatDetailsResponse:
    chat_details = await get_chat_details_use_case.execute(
        parse_uuid.parse(chat_id), chat_repository
    )

    return ChatDetailsResponse(
        id=str(chat_details.id),
        title=chat_details.title,
        messages=[
            ChatMessage(
                id=str(m.id),
                role=m.role,
                content=m.content,
                model=m.model,
                attachment_ids=[str(a) for a in m.attachment_ids],
            )
            for m in chat_details.messages
        ],
    )
