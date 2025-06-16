from uuid import UUID
from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path


from app import dependencies
from app.domain.users.entities import User
from app.repository.generation_repository import GenerationRepository
from app.repository.cloud_storage_repository import CloudStorageRepository
from app.repository.wavespeed_repository import WavespeedRepository
from app.service.auth import authentication
from app.service.jobs import get_job_status_service

TAG = "Jobs"
router = APIRouter()
router.openapi_tags = [TAG]
router.title = "Jobs router"


@router.get(
    "/job/{job_id}",
    summary="Upload a file and return file ID.",
    tags=[TAG],
)
async def get_job_status(
    job_id: UUID = Path(description="Job ID"),
    user: User = Depends(authentication.validate_session_token),
    generation_repository: GenerationRepository = Depends(
        dependencies.get_generation_repository
    ),
    cloud_storage_repository: CloudStorageRepository = Depends(
        dependencies.get_cloud_storage_repository
    ),
    wavespeed_repository: WavespeedRepository = Depends(
        dependencies.get_wavespeed_repository
    ),
):
    return await get_job_status_service.execute(
        job_id,
        user,
        generation_repository,
        cloud_storage_repository,
        wavespeed_repository,
    )
