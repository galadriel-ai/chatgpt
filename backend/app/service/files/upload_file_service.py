from uuid_extensions import uuid7

from fastapi import UploadFile, File

from app.domain.users.entities import User
from app.service.files.entities import FileUploadResponse
from app.repository.file_repository import FileRepository


async def execute(user: User, file: UploadFile, file_repository: FileRepository) -> FileUploadResponse:    
    print(f"Received file upload:")
    print(f"  filename: {file.filename}")
    print(f"  content_type: {file.content_type}")
    print(f"  size: {file.size}")
    print(f"  file object type: {type(file)}")
    print(f"  file headers: {file.headers if hasattr(file, 'headers') else 'No headers'}")
    
    file_id = str(uuid7())
    full_data = await file.read()
    file_size = len(full_data)
    
    await file_repository.save_file(str(user.uid), file.filename, full_data)

    return FileUploadResponse(
        file_id=file_id,
        filename=file.filename,
        content_type=file.content_type,
        size=file_size,
    )
