import asyncio
import os

from app import api_logger


logger = api_logger.get()


class FileRepository:
    def __init__(
        self,
        storage_folder: str,
    ):
        self.storage_folder = storage_folder


    async def save_file(
        self,
        path: str,
        file_name: str,
        file_content: bytes,
    ) -> str:
        def _save_file() -> str:
            full_path = os.path.join(self.storage_folder, path)
            os.makedirs(full_path, exist_ok=True)
            file_path = os.path.join(full_path, file_name)
            with open(file_path, "wb") as f:
                f.write(file_content)
            return file_path
        
        return await asyncio.to_thread(_save_file)
