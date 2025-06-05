from typing import List
from typing import Optional

from pydantic import BaseModel

from pydantic import Field


class ChatRequest(BaseModel):
    chat_id: Optional[str] = Field(description="chat id", default=None)
    model: Optional[str] = Field(description="model id", default=None)
    enable_search: Optional[bool] = Field(
        description="enable search tool", default=True
    )
    content: str = Field(description="content")


class UserChat(BaseModel):
    id: str
    user_id: str
    title: str


class ChatsResponse(BaseModel):
    chats: List[UserChat]
