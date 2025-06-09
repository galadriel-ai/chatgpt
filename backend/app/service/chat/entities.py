from typing import List
from typing import Literal
from typing import Optional

from pydantic import BaseModel

from pydantic import Field


class ChatRequest(BaseModel):
    chat_id: Optional[str] = Field(description="chat id", default=None)
    model: Optional[
        Literal[
            "accounts/fireworks/models/deepseek-v3-0324",
            "accounts/fireworks/models/deepseek-r1-0528",
        ]
    ] = Field(
        description="model id", default="accounts/fireworks/models/deepseek-v3-0324"
    )
    is_search_enabled: Optional[bool] = Field(
        description="enable search tool", default=True
    )
    content: str = Field(description="content")
    attachment_ids: List[str] = Field(description="attachment ids", default=[])


class UserChat(BaseModel):
    id: str
    title: str
    created_at: int


class ChatMessage(BaseModel):
    id: str
    role: Literal["system", "user", "assistant"]
    content: str
    model: Optional[str]
    attachment_ids: List[str]


class ChatsResponse(BaseModel):
    chats: List[UserChat]


class ChatDetailsResponse(UserChat):
    messages: List[ChatMessage]
