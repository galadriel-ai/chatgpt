from typing import List

from app.domain.chat.entities import Chat
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository


async def execute(
    user: User,
    chat_repository: ChatRepository,
) -> List[Chat]:
    return await chat_repository.get_by_user(user.uid)
