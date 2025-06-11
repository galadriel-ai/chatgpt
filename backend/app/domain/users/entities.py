from dataclasses import dataclass
from enum import Enum
from typing import List
from typing import Literal
from uuid import UUID


@dataclass
class MessageRateLimit:
    hours: Literal[24]
    unit: Literal["day"]


MESSAGE_RATE_LIMIT_TIMEFRAMES: List[MessageRateLimit] = [
    MessageRateLimit(
        hours=24,
        unit="day",
    )
]


class BillingPlan(str, Enum):
    FREE = "FREE"

    def get_max_user_message_count(self, rate_limit: MessageRateLimit) -> int:
        if rate_limit.unit == "day":
            if self == BillingPlan.FREE:
                return 80
        return 0


@dataclass(frozen=True)
class User:
    uid: UUID
    email: str
    # Once we get different plans, store it in DB
    billing_plan: BillingPlan = BillingPlan.FREE
