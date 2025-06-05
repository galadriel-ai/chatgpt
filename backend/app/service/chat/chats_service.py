from app.domain.chat import get_chats_use_case
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository
from app.service.chat.entities import UserChat
from app.service.chat.entities import ChatsResponse


async def execute(
    user: User,
    chat_repository: ChatRepository,
) -> ChatsResponse:
    chats = await get_chats_use_case.execute(user, chat_repository)
    return ChatsResponse(
        chats=[
            UserChat(
                id=str(c.id),
                title=c.title,
            )
            for c in chats
        ]
    )
