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


@dataclass
class ChatInput:
    chat_id: Optional[UUID]
    model: Optional[str]
    is_search_enabled: Optional[bool]
    content: str


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
class Message:
    id: UUID
    chat_id: UUID
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    model: Optional[str] = None

    def to_serializable_dict(self) -> Dict:
        return {
            "role": self.role,
            "content": self.content,
        }


@dataclass
class ToolMessage:
    id: UUID
    chat_id: UUID
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    tool_call_id: str
    name: str
    model: Optional[str] = None

    def to_serializable_dict(self) -> Dict:
        return {
            "role": self.role,
            "content": self.content,
            "tool_call_id": self.tool_call_id,
            "name": self.name,
        }


@dataclass
class ChatDetails(Chat):
    messages: List[Message]
