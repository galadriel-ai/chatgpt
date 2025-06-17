from app.domain.chat.entities import ChatInput
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository

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
        return DEFAULT_SYSTEM_MESSAGE
    # TODO: Improve this
    prompt = (
        f'You are an AI named "{configuration.ai_name}".\n'
        f"You have the following character traits: {configuration.description}.\n"
        f"In this conversation, your role is: {configuration.role}.\n"
        f'You\'re speaking with a user named "{configuration.user_name}".\n'
        f"Refer to them as '{configuration.user_name}', and refer to yourself as '{configuration.ai_name}' when appropriate.\n"
        f"Be personable, stay in character, and align your responses with your role and purpose."
    )
    if configuration.summary:
        prompt += f"\n\nHere is a summary of the chats with the user: {configuration.summary}\n"
    return prompt
