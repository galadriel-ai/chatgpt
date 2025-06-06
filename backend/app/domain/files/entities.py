from dataclasses import dataclass
from uuid import UUID


@dataclass
class File:
    uid: UUID
    user_id: UUID
    filename: str
    full_path: str
    content_type: str
    size: int


@dataclass
class FileInput:
    user_id: UUID
    file_name: str
    content_type: str
    content: bytes
