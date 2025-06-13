import asyncio
import os
from typing import Optional

from uuid_extensions import uuid7

import settings

from app.domain.files.entities import File, FileInput
from app.repository.file_repository import FileRepository


async def execute(input: FileInput, file_repository: FileRepository) -> Optional[File]:
    file_id = uuid7()
    file_path = await _save_file(
        path=str(input.user_id),
        file_name=input.file_name,
        file_content=input.content,
    )
    file = File(
        uid=file_id,
        user_id=input.user_id,
        filename=input.file_name,
        full_path=file_path,
        content_type=input.content_type,
        size=len(input.content),
    )
    await file_repository.insert(file)
    return file


async def _save_file(
    path: str,
    file_name: str,
    file_content: bytes,
) -> str:
    def _save_file() -> str:
        full_path = os.path.join(settings.STORAGE_FOLDER, path)
        os.makedirs(full_path, exist_ok=True)
        file_path = os.path.join(full_path, file_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return file_path

    return await asyncio.to_thread(_save_file)
