from typing import List
from typing import Literal
from typing import Optional

from pydantic import BaseModel

from pydantic import Field


class ChatRequest(BaseModel):
    chat_id: Optional[str] = Field(description="chat id", default=None)
    model: Optional[str] = Field(description="model id", default=None)
    content: str = Field(description="content")
    attachment_ids: List[str] = Field(description="attachment ids", default=[])


class UserChat(BaseModel):
    id: str
    title: str


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
