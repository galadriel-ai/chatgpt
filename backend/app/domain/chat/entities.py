from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from typing import Dict
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
class Message:
    id: UUID
    chat_id: UUID
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    model: Optional[str] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None
