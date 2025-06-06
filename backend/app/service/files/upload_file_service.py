from fastapi import UploadFile

from app.domain.files.entities import FileInput
from app.domain.files import save_file_use_case
from app.domain.users.entities import User
from app.service.files.entities import FileUploadResponse
from app.repository.file_repository import FileRepository


async def execute(
    user: User, file: UploadFile, file_repository: FileRepository
) -> FileUploadResponse:
    print(f"Received file upload:")
    print(f"  filename: {file.filename}")
    print(f"  content_type: {file.content_type}")
    print(f"  user.uid: {user.uid}")
    print(f"  user.uid type: {type(user.uid)}")
    
    # Validate required fields
    if not file.filename:
        raise ValueError("Filename is required")
    if not file.content_type:
        raise ValueError("Content type is required")
    
    content = await file.read()
    print(f"  content length: {len(content)}")
    
    input = FileInput(
        user_id=user.uid,
        file_name=file.filename,
        content_type=file.content_type,
        content=content,
    )
    
    print("FileInput created successfully")
    
    file_result = await save_file_use_case.execute(input, file_repository)
    
    print(f"File saved with uid: {file_result.uid}")
    
    return FileUploadResponse(
        file_id=str(file_result.uid),
        filename=file_result.filename,
        content_type=file_result.content_type,
        size=file_result.size,
    )
