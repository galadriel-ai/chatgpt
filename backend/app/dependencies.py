import settings
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.repository.connection import get_session_provider
from app.repository.connection import get_session_provider_read
from app.repository.file_repository import FileRepository
from app.repository.generation_repository import GenerationRepository
from app.repository.cloud_storage_repository import CloudStorageRepository
from app.repository.wavespeed_repository import WavespeedRepository
from app.repository.llm_repository import LlmRepository
from app.repository.user_repository import UserRepository


def get_file_repository() -> FileRepository:
    return FileRepository(
        get_session_provider(),
        get_session_provider_read(),
    )


def get_llm_repository() -> LlmRepository:
    return LlmRepository(
        settings.LLM_API_KEY,
        settings.SERPAPI_API_KEY,
        settings.LLM_BASE_URL,
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


def get_generation_repository() -> GenerationRepository:
    return GenerationRepository(
        get_session_provider(),
        get_session_provider_read(),
    )


def get_wavespeed_repository() -> WavespeedRepository:
    return WavespeedRepository(
        settings.WAVESPEED_API_KEY,
    )


def get_cloud_storage_repository() -> CloudStorageRepository:
    return CloudStorageRepository(
        settings.GCS_BUCKET,
        settings.GOOGLE_CREDENTIALS,
    )
