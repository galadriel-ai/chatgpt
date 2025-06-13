from uuid import UUID

from app.domain.users.entities import User
from uuid_extensions import uuid7


def get_user(
    uid: UUID = uuid7(),
    email: str = "email",
) -> User:
    return User(
        uid=uid,
        email=email,
    )
