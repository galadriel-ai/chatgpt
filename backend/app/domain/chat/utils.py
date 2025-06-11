import base64
from typing import List
from uuid import UUID

from app.domain.chat.entities import Image
from app.repository.file_repository import FileRepository


async def get_images(
    attachment_ids: List[UUID], file_repository: FileRepository
) -> List[Image]:
    if not attachment_ids:
        return []
    files = await file_repository.get_by_ids(attachment_ids)
    images = []
    for file in files:
        if file.content_type.startswith("image/"):
            images.append(
                Image(
                    mime_type=file.content_type,
                    base64_data=encode_image(file.full_path),
                )
            )
    return images


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
