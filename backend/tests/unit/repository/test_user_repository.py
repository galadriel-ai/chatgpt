import os
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

os.environ["SERPAPI_API_KEY"] = "dummy_serpapi_key"
os.environ["LLM_API_KEY"] = "dummy_llm_key"

from app.repository.user_repository import UserRepository
from app.domain.users.entities import User


@pytest.fixture
def mock_session_providers():
    """Fixture to provide mocked session providers."""
    mock_session_provider = MagicMock()
    mock_session_provider_read = MagicMock()
    return mock_session_provider, mock_session_provider_read


@pytest.fixture
def user_repository(mock_session_providers):
    """Fixture to provide UserRepository instance with mocked dependencies."""
    session_provider, session_provider_read = mock_session_providers
    return UserRepository(
        session_provider=session_provider, session_provider_read=session_provider_read
    )


async def test_get_by_id_user_found(user_repository, mock_session_providers):
    """Test get_by_id when user exists in database."""
    # Arrange
    _, mock_session_provider_read = mock_session_providers
    user_id = uuid4()
    expected_email = "test@example.com"

    mock_row = MagicMock()
    mock_row.id = user_id
    mock_row.email = expected_email

    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.first.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Mock session provider context manager
    async_context_manager = AsyncMock()
    async_context_manager.__aenter__.return_value = mock_session
    async_context_manager.__aexit__.return_value = None
    mock_session_provider_read.get.return_value = async_context_manager

    # Act
    result = await user_repository.get_by_id(user_id)

    # Assert
    assert result is not None
    assert isinstance(result, User)
    assert result.uid == user_id
    assert result.email == expected_email

    # Verify the session was called correctly
    mock_session.execute.assert_called_once()


async def test_get_by_id_user_not_found(user_repository, mock_session_providers):
    """Test get_by_id when user does not exist in database."""
    # Arrange
    _, mock_session_provider_read = mock_session_providers
    user_id = uuid4()

    # Mock session and result - fix the async mocking
    mock_session = AsyncMock()
    mock_result = MagicMock()  # This should be sync, not async
    mock_result.first.return_value = None  # No user found
    mock_session.execute.return_value = mock_result

    # Mock session provider context manager
    async_context_manager = AsyncMock()
    async_context_manager.__aenter__.return_value = mock_session
    async_context_manager.__aexit__.return_value = None
    mock_session_provider_read.get.return_value = async_context_manager

    # Act
    result = await user_repository.get_by_id(user_id)

    # Assert
    assert result is None

    # Verify the session was called correctly
    mock_session.execute.assert_called_once()


async def test_insert_user_success(user_repository, mock_session_providers):
    """Test insert method successfully adds a user to database."""
    # Arrange
    mock_session_provider, _ = mock_session_providers
    user_id = uuid4()
    user = User(uid=user_id, email="new@example.com")

    # Mock session - fix the async mocking
    mock_session = AsyncMock()

    # Mock session provider context manager
    async_context_manager = AsyncMock()
    async_context_manager.__aenter__.return_value = mock_session
    async_context_manager.__aexit__.return_value = None
    mock_session_provider.get.return_value = async_context_manager

    # Act
    await user_repository.insert(user)

    # Assert
    mock_session.execute.assert_called_once()
    mock_session.commit.assert_called_once()
