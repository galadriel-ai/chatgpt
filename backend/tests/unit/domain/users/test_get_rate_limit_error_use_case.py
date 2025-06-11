from unittest.mock import AsyncMock

from app.domain.users import get_rate_limit_error_use_case as use_case
from app.domain.users.entities import User
from uuid_extensions import uuid7


def _get_user() -> User:
    return User(
        uid=uuid7(),
        email="email",
    )


async def test_no_error():
    repo = AsyncMock()
    repo.get_message_count_by_user.return_value = 0
    error = await use_case.execute(_get_user(), repo)
    assert error is None


async def test_free_limit_exceeded():
    repo = AsyncMock()
    repo.get_message_count_by_user.return_value = 1_000_000_000
    error = await use_case.execute(_get_user(), repo)
    assert error is not None
