from app.domain.chat.entities import ChatInput
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app import api_logger

logger = api_logger.get()

DEFAULT_SYSTEM_MESSAGE = "You are a helpful assistant."


async def execute(
    chat_input: ChatInput,
    user: User,
    configuration_repository: ChatConfigurationRepository,
) -> str:
    if not chat_input.configuration_id:
        return DEFAULT_SYSTEM_MESSAGE
    configuration = await configuration_repository.get_by_id_and_user(
        chat_input.configuration_id, user.uid
    )
    if not configuration:
        logger.debug("Use the default system prompt")
        return DEFAULT_SYSTEM_MESSAGE
    # TODO: Improve this
    logger.debug(f"Use system prompt from the configuration: {configuration}")
    prompt = (
        f'You are a helpful assistant named "{configuration.ai_name}".\n'
        f"You have the following character traits: {configuration.description}.\n"
        f'You\'re speaking to a user named "{configuration.user_name}".\n'
    )
    if configuration.summary:
        prompt += f"\n\nHere is a summary of the chats with the user: {configuration.summary}\n"
    return prompt
