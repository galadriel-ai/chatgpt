from typing import Optional

from fastapi import Depends

from app import dependencies
from app.domain.users.entities import User
from app.repository.user_repository import UserRepository
from uuid_extensions import uuid7

from app.service import error_responses


async def validate_session_token(
    user_repository: UserRepository = Depends(dependencies.get_user_repository),
) -> Optional[User]:
    # TODO: dummy implementation
    user = await user_repository.get_by_id(uuid7())
    if not user:
        raise error_responses.InvalidCredentialsAPIError(message_extra="User not found.")
    return user
