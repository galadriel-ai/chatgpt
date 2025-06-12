from app.domain.chat.entities import GetChatsOutput
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository


async def execute(
    user: User,
    chat_repository: ChatRepository,
    configuration_repository: ChatConfigurationRepository,
) -> GetChatsOutput:
    chats = await chat_repository.get_by_user(user.uid)

    configuration = await configuration_repository.get_latest_by_user_id(user.uid)

    return GetChatsOutput(
        chats=chats,
        configuration=configuration,
    )
