from typing import List
from typing import Literal
from typing import Optional

from pydantic import BaseModel

from pydantic import Field


class ChatRequest(BaseModel):
    chat_id: Optional[str] = Field(description="chat id", default=None)
    model: Optional[str] = Field(description="model id", default=None)
    is_search_enabled: Optional[bool] = Field(
        description="enable search tool", default=True
    )
    content: str = Field(description="content")


class UserChat(BaseModel):
    id: str
    title: str


class ChatMessage(BaseModel):
    id: str
    role: Literal["system", "user", "assistant"]
    content: str
    model: Optional[str]


class ChatsResponse(BaseModel):
    chats: List[UserChat]


class ChatDetailsResponse(UserChat):
    messages: List[ChatMessage]
