from fastapi import UploadFile

from app.domain.files.entities import FileInput
from app.domain.files import save_file_use_case
from app.domain.users.entities import User
from app.service.files.entities import FileUploadResponse
from app.repository.file_repository import FileRepository


async def execute(
    user: User, file: UploadFile, file_repository: FileRepository
) -> FileUploadResponse:
    content = await file.read()
    input = FileInput(
        user_id=user.uid,
        file_name=file.filename,
        content_type=file.content_type,
        content=content,
    )
    file_result = await save_file_use_case.execute(input, file_repository)
    return FileUploadResponse(
        file_id=str(file_result.uid),
        filename=file_result.filename,
        content_type=file_result.content_type,
        size=file_result.size,
    )
