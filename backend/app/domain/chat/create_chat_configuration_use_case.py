from app.domain.chat.entities import ChatConfiguration
from app.domain.chat.entities import ChatConfigurationInput
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository


async def execute(
    configuration_input: ChatConfigurationInput,
    user: User,
    repository: ChatConfigurationRepository,
) -> ChatConfiguration:
    configuration_id = await repository.insert(configuration_input, user.uid)
    return ChatConfiguration(
        id=configuration_id,
        user_name=configuration_input.user_name,
        ai_name=configuration_input.ai_name,
        description=configuration_input.description,
        role=configuration_input.role,
    )
