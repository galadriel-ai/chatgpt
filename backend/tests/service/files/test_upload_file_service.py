import os
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from fastapi import UploadFile
from io import BytesIO

# Set environment variables before importing modules
os.environ["SERPAPI_API_KEY"] = "dummy_serpapi_key"
os.environ["LLM_API_KEY"] = "dummy_llm_key"
os.environ["FALLBACK_LLM_API_KEY"] = "dummy_fallback_llm_key"
os.environ["WAVESPEED_API_KEY"] = "dummy_wavespeed_key"

from app.service.files import upload_file_service
from app.domain.users.entities import User
from app.service import error_responses
from app.service.files.entities import FileUploadResponse
from app.repository.file_repository import FileRepository
from app.domain.files.entities import File


@pytest.fixture
def mock_user():
    """Fixture to provide a mock User instance."""
    return User(uid=uuid4(), email="test@example.com")


@pytest.fixture
def mock_file_repository():
    """Fixture to provide a mock FileRepository instance."""
    mock_repo = MagicMock(spec=FileRepository)
    return mock_repo


@pytest.fixture
def create_upload_file():
    """Fixture factory to create UploadFile instances with different sizes."""

    def _create_upload_file(
        size: int, filename: str = "test.txt", content_type: str = "text/plain"
    ):
        file_obj = BytesIO(b"dummy_content")
        upload_file = UploadFile(
            filename=filename,
            file=file_obj,
            size=size,
            headers={"content-type": content_type},
        )
        # Mock the read method to return the content
        upload_file.read = AsyncMock(return_value=b"dummy_content")
        # upload_file.content_type = content_type
        return upload_file

    return _create_upload_file


async def test_upload_file_under_limit(
    mock_user, mock_file_repository, create_upload_file
):
    """Test file upload succeeds when file size is under the limit."""
    # Arrange
    upload_file = create_upload_file(1024, "small_file.txt", "text/plain")

    # Mock the save_file_use_case
    mock_saved_file = File(
        uid=uuid4(),
        user_id=mock_user.uid,
        filename="small_file.txt",
        full_path="/path/to/file",
        content_type="text/plain",
        size=1024,
    )

    mock_save_file_use_case = AsyncMock()
    mock_save_file_use_case.execute.return_value = mock_saved_file
    upload_file_service.save_file_use_case = mock_save_file_use_case

    result = await upload_file_service.execute(
        mock_user, upload_file, mock_file_repository
    )

    # Assert
    assert isinstance(result, FileUploadResponse)
    assert result.filename == "small_file.txt"
    assert result.content_type == "text/plain"
    assert result.size == 1024
    assert result.file_id == str(mock_saved_file.uid)

    # Verify the use case was called
    mock_save_file_use_case.execute.assert_called_once()


@pytest.mark.asyncio
async def test_upload_file_over_limit(
    mock_user, mock_file_repository, create_upload_file
):
    """Test file upload fails when file size exceeds the limit."""

    upload_file = create_upload_file(11000000, "large_file.txt", "text/plain")

    with pytest.raises(error_responses.FileSizeTooLargeAPIError):
        await upload_file_service.execute(mock_user, upload_file, mock_file_repository)
