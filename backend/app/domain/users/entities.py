from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class User:
    uid: UUID
    email: str
