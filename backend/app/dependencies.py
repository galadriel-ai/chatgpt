import settings
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.repository.connection import get_session_provider
from app.repository.connection import get_session_provider_read
from app.repository.file_repository import FileRepository
from app.repository.llm_repository import LlmRepository
from app.repository.user_repository import UserRepository


def get_file_repository() -> FileRepository:
    return FileRepository(
        get_session_provider(),
        get_session_provider_read(),
    )


def get_llm_repository() -> LlmRepository:
    return LlmRepository(
        api_key=settings.LLM_API_KEY,
        search_api_key=settings.SERPAPI_API_KEY,
        base_url=settings.LLM_BASE_URL,
        fallback_api_key=settings.FALLBACK_LLM_API_KEY,
        fallback_base_url=settings.FALLBACK_LLM_BASE_URL,
    )


def get_user_repository() -> UserRepository:
    return UserRepository(
        get_session_provider(),
        get_session_provider_read(),
    )


def get_chat_repository() -> ChatRepository:
    return ChatRepository(
        get_session_provider(),
        get_session_provider_read(),
    )


def get_chat_configuration_repository() -> ChatConfigurationRepository:
    return ChatConfigurationRepository(
        get_session_provider(),
        get_session_provider_read(),
    )
