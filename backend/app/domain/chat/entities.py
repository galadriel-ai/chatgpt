import datetime
from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional
from uuid import UUID


@dataclass
class Chat:
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime


@dataclass
class ChatInput:
    chat_id: Optional[UUID]
    model: Optional[str]
    is_search_enabled: Optional[bool]
    content: str
    attachment_ids: List[UUID]


class ChatOutputChunk(ABC):
    @abstractmethod
    def to_serializable_dict(self) -> Dict:
        pass


@dataclass
class ErrorChunk(ChatOutputChunk):
    error: str

    def to_serializable_dict(self) -> Dict:
        return {
            "error": self.error,
        }


@dataclass
class NewChatOutput(ChatOutputChunk):
    chat_id: UUID

    def to_serializable_dict(self):
        return {"chat_id": str(self.chat_id)}


@dataclass
class ChunkOutput(ChatOutputChunk):
    content: str

    def to_serializable_dict(self):
        return {"content": self.content}


@dataclass
class ToolOutput(ChatOutputChunk):
    tool_call_id: str
    name: str
    arguments: str
    result: str

    def to_serializable_dict(self):
        return {
            "tool_call_id": self.tool_call_id,
            "name": self.name,
            "arguments": self.arguments,
            "result": self.result,
        }


@dataclass
class ToolCall:
    id: str
    function: Dict[str, str]
    type: Literal["function"] = "function"

    def to_serializable_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type,
            "function": self.function,
        }


@dataclass
class Message:
    id: UUID
    chat_id: UUID
    role: Literal["system", "user", "assistant", "tool"]
    content: Optional[str] = None
    model: Optional[str] = None
    tool_call: Optional[ToolCall] = None
    tool_calls: Optional[List[ToolCall]] = None
    attachment_ids: List[UUID]

    def to_llm_reaady_dict(self) -> Dict:
        result = {
            "role": self.role,
            "content": self.content,
        }
        if self.tool_call is not None:
            result["tool_call_id"] = self.tool_call.id
            result["name"] = self.tool_call.function["name"]
        if self.tool_calls is not None:
            result["tool_calls"] = [tc.to_serializable_dict() for tc in self.tool_calls]
        return result


@dataclass
class ChatDetails(Chat):
    messages: List[Message]


@dataclass
class Model:
    id: Literal[
        "accounts/fireworks/models/deepseek-v3-0324",
        "accounts/fireworks/models/deepseek-r1-0528",
    ]
    is_search_enabled: Optional[bool] = True
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 128000
