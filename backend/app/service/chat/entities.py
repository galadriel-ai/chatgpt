from typing import List
from typing import Optional

from pydantic import BaseModel
from pydantic import Field


class ChatRequest(BaseModel):
    chat_id: Optional[str] = Field(description="chat id", default=None)
    configuration_id: Optional[str] = Field(
        description="chat configuration id", default=None
    )
    think_model: Optional[bool] = Field(description="think model", default=False)
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
    role: str
    content: str
    model: Optional[str]
    attachment_ids: List[str]


class ChatConfigurationRequest(BaseModel):
    user_name: str
    ai_name: str
    description: str
    role: str


class UserChatConfiguration(BaseModel):
    id: str
    user_name: str
    ai_name: str
    description: str
    role: str


class ChatDetailsResponse(UserChat):
    messages: List[ChatMessage]
    configuration: Optional[UserChatConfiguration]


class ChatsResponse(BaseModel):
    chats: List[UserChat]
    chat_configuration: Optional[UserChatConfiguration]
