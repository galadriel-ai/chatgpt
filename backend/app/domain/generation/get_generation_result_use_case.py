import os
from uuid import UUID
from urllib.parse import urlparse, unquote

import httpx
from uuid_extensions import uuid7

import settings
from app.domain.generation.entities import GenerationOutput
from app.domain.generation.entities import GenerationStatus
from app.repository.generation_repository import GenerationRepository
from app.repository.cloud_storage_repository import CloudStorageRepository
from app.repository.wavespeed_repository import WavespeedRepository
from app.service import error_responses

IMAGES_FOLDER = "images"


async def execute(
    generation_id: UUID,
    repository: GenerationRepository,
    cloud_storage_repository: CloudStorageRepository,
    wavespeed_repository: WavespeedRepository,
) -> GenerationOutput:
    generation = await repository.get(generation_id)
    if not generation:
        raise error_responses.NotFoundAPIError("Generation not found")
    if generation.status == GenerationStatus.COMPLETED:
        return generation
    response = await wavespeed_repository.get_result(generation.data["wavespeed_id"])
    if response.status == "completed" and response.url:
        response.url = await upload_to_gcp(response.url, cloud_storage_repository)
    await repository.update(
        generation_id, GenerationStatus(response.status), response.url
    )
    return GenerationOutput(
        id=generation_id,
        user_id=generation.user_id,
        type=generation.type,
        prompt=generation.prompt,
        status=GenerationStatus(response.status),
        url=response.url,
        data=generation.data,
        created_at=generation.created_at,
        last_updated_at=generation.last_updated_at,
    )


async def upload_to_gcp(
    download_url: str, cloud_storage_repository: CloudStorageRepository
) -> str:
    # don't reupload to GCP if we are in local environment
    parsed_url = urlparse(download_url)
    original_image_name = unquote(parsed_url.path.split("/")[-1])
    new_image_name = await _generate_filename(original_image_name)
    print(original_image_name, new_image_name)
    if not settings.is_production():
        return download_url

    async with httpx.AsyncClient() as session:
        response = await session.get(download_url)
        response.raise_for_status()
        image_data = response.read()
        return await cloud_storage_repository.upload_blob_to_gcs(
            image_data, f"{IMAGES_FOLDER}/{new_image_name}"
        )


async def _generate_filename(original_filename: str) -> str:
    _, extension = os.path.splitext(original_filename)
    return f"{uuid7()}{extension}"
