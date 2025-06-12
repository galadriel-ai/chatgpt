from app.domain.chat import get_chats_use_case
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.service.chat.entities import ChatsResponse
from app.service.chat.entities import UserChat
from app.service.chat.entities import UserChatConfiguration


async def execute(
    user: User,
    chat_repository: ChatRepository,
    configuration_repository: ChatConfigurationRepository,
) -> ChatsResponse:
    chats_output = await get_chats_use_case.execute(user, chat_repository, configuration_repository)
    return ChatsResponse(
        chats=[
            UserChat(
                id=str(c.id),
                title=c.title,
                created_at=int(c.created_at.timestamp()),
            )
            for c in chats_output.chats
        ],
        chat_configuration=UserChatConfiguration(
            id=str(chats_output.configuration.id),
            user_name=chats_output.configuration.user_name,
            ai_name=chats_output.configuration.ai_name,
            description=chats_output.configuration.description,
            role=chats_output.configuration.role,
        ) if chats_output.configuration else None,
    )
