from typing import Optional

from app.domain.users.entities import MESSAGE_RATE_LIMIT_TIMEFRAMES
from app.domain.users.entities import MessageRateLimit
from app.domain.users.entities import User
from app.repository.chat_repository import ChatRepository


async def execute(
    user: User,
    chat_repository: ChatRepository,
) -> Optional[str]:
    for rate_limit in MESSAGE_RATE_LIMIT_TIMEFRAMES:
        if error := await _get_error(user, chat_repository, rate_limit):
            return error
    return None


async def _get_error(
    user: User, chat_repository: ChatRepository, rate_limit: MessageRateLimit
) -> Optional[str]:
    user_message_count = await chat_repository.get_message_count_by_user(
        user.uid, hours_back=rate_limit.hours
    )
    max_user_messages = user.billing_plan.get_max_user_message_count(rate_limit)
    if user_message_count > max_user_messages:
        return f"Maximum message count exceeded for the {rate_limit.unit}, the limit is {max_user_messages} messages."
    return None
