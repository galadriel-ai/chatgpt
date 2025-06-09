from typing import List
from typing import Optional
from uuid import UUID

import sqlalchemy

from app.domain.files.entities import File
from app.repository.connection import SessionProvider
from app.repository.utils import utcnow

SQL_INSERT = """
INSERT INTO file (
    id,
    user_profile_id,
    filename,
    full_path,
    content_type,
    size,
    deleted,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :user_profile_id,
    :filename,
    :full_path,
    :content_type,
    :size,
    :deleted,
    :created_at,
    :last_updated_at
);
"""

SQL_GET_BY_USER = """
SELECT 
    id,
    user_profile_id,
    filename,
    full_path,
    content_type,
    size,
    deleted,
    created_at,
    last_updated_at
FROM file
WHERE user_profile_id = :user_profile_id AND deleted = false
ORDER BY created_at DESC;
;
"""

SQL_GET = """
SELECT 
    id,
    user_profile_id,
    filename,
    full_path,
    content_type,
    size,
    deleted,
    created_at,
    last_updated_at
FROM file
WHERE id = :id;
"""

SQL_DELETE = """
UPDATE 
    file 
SET
    deleted = true,
    last_updated_at = :last_updated_at
WHERE id = :id;
"""


class FileRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    async def insert(self, file: File) -> None:
        utc_now = utcnow()
        data = {
            "id": file.uid,
            "user_profile_id": file.user_id,
            "filename": file.filename,
            "full_path": file.full_path,
            "content_type": file.content_type,
            "size": file.size,
            "deleted": False,
            "created_at": utc_now,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()

    async def get(self, file_id: UUID) -> Optional[File]:
        data = {
            "id": file_id,
        }
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET), data)
            row = result.first()
            if row:
                return File(
                    id=row.id,
                    user_id=row.user_profile_id,
                    filename=row.filename,
                    full_path=row.full_path,
                    content_type=row.content_type,
                    size=row.size,
                )
        return None

    async def get_by_user(self, user_id: UUID) -> List[File]:
        data = {
            "user_id": user_id,
        }
        files = []
        async with self._session_provider_read.get() as session:
            rows = await session.execute(sqlalchemy.text(SQL_GET_BY_USER), data)
            for row in rows:
                files.append(
                    File(
                        id=row.id,
                        user_id=row.user_profile_id,
                        filename=row.filename,
                        full_path=row.full_path,
                        content_type=row.content_type,
                        size=row.size,
                    )
                )
        return files

    async def delete(self, file_id: UUID) -> None:
        utc_now = utcnow()
        async with self._session_provider.get() as session:
            data = {
                "id": file_id,
                "last_updated_at": utc_now,
            }
            await session.execute(sqlalchemy.text(SQL_DELETE), data)
            await session.commit()
