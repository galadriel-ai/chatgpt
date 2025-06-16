from typing import Any
from typing import Dict
from typing import Optional
from uuid import UUID
import json

import sqlalchemy
from uuid_extensions import uuid7

from app.domain.generation.entities import GenerationOutput
from app.domain.generation.entities import GenerationStatus
from app.domain.generation.entities import GenerationType
from app.repository.connection import SessionProvider
from app.repository.utils import utcnow

SQL_INSERT = """
INSERT INTO generation (
    id,
    user_profile_id,
    type,
    prompt,
    status,
    url,
    data,
    created_at,
    last_updated_at
) VALUES (
    :id,
    :user_profile_id,
    :type,
    :prompt,
    :status,
    :url,
    :data,
    :created_at,
    :last_updated_at
);
"""

SQL_GET = """
SELECT 
    id,
    user_profile_id,
    type,
    prompt,
    status,
    url,
    data,
    created_at,
    last_updated_at
FROM generation
WHERE id = :id;
"""

SQL_UPDATE = """
UPDATE generation
SET status = :status,
    url = :url,
    last_updated_at = :last_updated_at
WHERE id = :id;
"""


class GenerationRepository:
    def __init__(
        self, session_provider: SessionProvider, session_provider_read: SessionProvider
    ):
        self._session_provider = session_provider
        self._session_provider_read = session_provider_read

    async def insert(
        self,
        user_id: UUID,
        type: GenerationType,
        prompt: str,
        status: GenerationStatus,
        data: Dict[str, Any],
        url: Optional[str],
    ) -> GenerationOutput:
        utc_now = utcnow()
        id = uuid7()
        data = {
            "id": id,
            "user_profile_id": user_id,
            "type": type,
            "prompt": prompt,
            "status": status,
            "data": json.dumps(data),
            "url": url,
            "created_at": utc_now,
            "last_updated_at": utc_now,
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_INSERT), data)
            await session.commit()
        return GenerationOutput(
            id=id,
            user_id=user_id,
            type=type,
            prompt=prompt,
            status=status,
            url=url,
            data=data,
            created_at=utc_now,
            last_updated_at=utc_now,
        )

    async def get(self, generation_id: UUID) -> Optional[GenerationOutput]:
        data = {
            "id": generation_id,
        }
        async with self._session_provider_read.get() as session:
            result = await session.execute(sqlalchemy.text(SQL_GET), data)
            row = result.first()
            if row:
                return GenerationOutput(
                    id=row.id,
                    user_id=row.user_profile_id,
                    type=row.type,
                    prompt=row.prompt,
                    status=row.status,
                    url=row.url,
                    data=row.data,
                    created_at=row.created_at,
                    last_updated_at=row.last_updated_at,
                )
        return None

    async def update(
        self, generation_id: UUID, status: GenerationStatus, url: Optional[str]
    ) -> None:
        data = {
            "id": generation_id,
            "status": status,
            "url": url,
            "last_updated_at": utcnow(),
        }
        async with self._session_provider.get() as session:
            await session.execute(sqlalchemy.text(SQL_UPDATE), data)
            await session.commit()
