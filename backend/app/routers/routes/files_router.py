from fastapi import APIRouter
from fastapi import Body
from fastapi import Path
from fastapi import Depends
from fastapi import UploadFile
from fastapi import File

from app import dependencies
from app.domain.users.entities import User
from app.repository.file_repository import FileRepository
from app.service.auth import authentication
from app.service.files import upload_file_service

TAG = "Files"
router = APIRouter()
router.openapi_tags = [TAG]
router.title = "Files router"


@router.post(
    "/files",
    summary="Upload a file and return file ID.",
    tags=[TAG],
)
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(authentication.validate_session_token),
    file_repository: FileRepository = Depends(dependencies.get_file_repository),
):
   return await upload_file_service.execute(user, file, file_repository)