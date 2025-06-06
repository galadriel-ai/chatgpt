import settings
from app.repository.chat_repository import ChatRepository
from app.repository.file_repository import FileRepository
from app.repository.connection import get_session_provider
from app.repository.connection import get_session_provider_read
from app.repository.llm_repository import LlmRepository
from app.repository.user_repository import UserRepository


def get_file_repository() -> FileRepository:
    return FileRepository(
        settings.STORAGE_FOLDER,
    )


def get_llm_repository() -> LlmRepository:
    return LlmRepository(
        settings.LLM_API_KEY,
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
