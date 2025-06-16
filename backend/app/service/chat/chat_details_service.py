from app.domain.chat import get_chat_details_use_case
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.service.chat.entities import ChatDetailsResponse
from app.service.chat.entities import ChatMessage
from app.service.chat.entities import UserChatConfiguration
from app.service.utils import parse_uuid


async def execute(
    chat_id: str,
    user: User,
    chat_repository: ChatRepository,
    configuration_repository: ChatConfigurationRepository,
) -> ChatDetailsResponse:
    chat_details = await get_chat_details_use_case.execute(
        parse_uuid.parse(chat_id),
        user,
        chat_repository,
        configuration_repository,
    )

    return ChatDetailsResponse(
        id=str(chat_details.id),
        title=chat_details.title,
        created_at=int(chat_details.created_at.timestamp()),
        messages=[
            ChatMessage(
                id=str(m.id),
                role=m.role,
                content=m.content,
                model=m.model,
                attachment_ids=[str(a) for a in m.attachment_ids],
                image_url=m.image_url,
            )
            for m in chat_details.messages
        ],
        configuration=UserChatConfiguration(
            id=str(chat_details.configuration.id),
            user_name=chat_details.configuration.user_name,
            ai_name=chat_details.configuration.ai_name,
            description=chat_details.configuration.description,
            role=chat_details.configuration.role,
        )
        if chat_details.configuration
        else None,
    )
