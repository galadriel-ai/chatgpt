from app.domain.chat import create_chat_configuration_use_case
from app.domain.chat.entities import ChatConfigurationInput
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.service.chat.entities import ChatConfigurationRequest
from app.service.chat.entities import UserChatConfiguration


async def execute(
    request: ChatConfigurationRequest,
    user: User,
    repository: ChatConfigurationRepository,
) -> UserChatConfiguration:
    configuration = await create_chat_configuration_use_case.execute(
        ChatConfigurationInput(
            user_name=request.user_name,
            ai_name=request.ai_name,
            description=request.description,
            role=request.role,
        ),
        user,
        repository,
    )
    return UserChatConfiguration(
        id=str(configuration.id),
        user_name=configuration.user_name,
        ai_name=configuration.ai_name,
        description=configuration.description,
        role=configuration.role,
    )
