from uuid import UUID

from app.domain.generation.entities import GenerationStatus
from app.domain.generation import get_generation_result_use_case
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository
from app.repository.generation_repository import GenerationRepository
from app.repository.cloud_storage_repository import CloudStorageRepository
from app.repository.wavespeed_repository import WavespeedRepository
from app.service.jobs.entities import JobStatus
from app.service import error_responses


async def execute(
    job_id: UUID,
    user: User,
    generation_repository: GenerationRepository,
    chat_repository: ChatRepository,
    cloud_storage_repository: CloudStorageRepository,
    wavespeed_repository: WavespeedRepository,
) -> JobStatus:
    generation = await generation_repository.get(job_id)
    if not generation:
        raise error_responses.NotFoundAPIError("Generation not found")
    if generation.user_id != user.uid:
        raise error_responses.InvalidCredentialsAPIError()
    if generation.status == GenerationStatus.COMPLETED:
        return JobStatus(
            id=str(generation.id),
            status=generation.status,
            url=generation.url,
        )
    generation = await get_generation_result_use_case.execute(
        job_id,
        generation_repository,
        chat_repository,
        cloud_storage_repository,
        wavespeed_repository,
    )
    return JobStatus(
        id=str(generation.id),
        status=generation.status,
        url=generation.url,
    )
