from uuid import UUID

from app.domain.chat.entities import ChatDetails
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.service import error_responses


async def execute(
    chat_id: UUID,
    user: User,
    chat_repository: ChatRepository,
    configuration_repository: ChatConfigurationRepository,
) -> ChatDetails:
    chat = await chat_repository.get(chat_id)
    if not chat:
        raise error_responses.NotFoundAPIError()
    messages = await chat_repository.get_messages(chat.id)
    configuration = None
    if chat.configuration_id:
        # None
        configuration = await configuration_repository.get_by_id_and_user(
            chat.configuration_id, user.uid
        )
    return ChatDetails(
        id=chat.id,
        configuration_id=chat.configuration_id,
        user_id=chat.user_id,
        title=chat.title,
        created_at=chat.created_at,
        messages=messages,
        configuration=configuration,
    )
