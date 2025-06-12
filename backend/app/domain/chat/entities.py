import datetime
from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional
from uuid import UUID

from settings import SUPPORTED_MODELS


@dataclass
class Chat:
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime


@dataclass
class ChatInput:
    chat_id: Optional[UUID]
    think_model: Optional[bool]
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
class Image:
    mime_type: str
    base64_data: str


@dataclass
class Message:
    id: UUID
    chat_id: UUID
    role: Literal["system", "user", "assistant", "tool"]
    attachment_ids: List[UUID]
    content: Optional[str] = None
    model: Optional[str] = None
    tool_call: Optional[ToolCall] = None
    tool_calls: Optional[List[ToolCall]] = None

    def to_llm_ready_dict(self) -> Dict:
        content = [{"type": "text", "text": self.content}]
        result = {
            "role": self.role,
            "content": content,
        }
        if self.tool_call is not None:
            result["tool_call_id"] = self.tool_call.id
            result["name"] = self.tool_call.function["name"]
        if self.tool_calls is not None:
            result["tool_calls"] = [tc.to_serializable_dict() for tc in self.tool_calls]
        return result

    def to_llm_ready_dict_with_images(self, images: List[Image]) -> Dict:
        content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image.mime_type};base64,{image.base64_data}"
                },
            }
            for image in images
        ]
        if self.content:
            content.append({"type": "text", "text": self.content})
        result = {
            "role": self.role,
            "content": content,
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


class Model(Enum):
    DEFAULT_MODEL = SUPPORTED_MODELS["default"]
    THINK_MODEL = SUPPORTED_MODELS["think"]
    VLM_MODEL = SUPPORTED_MODELS["vlm"]

    def __str__(self) -> str:
        return self.value


@dataclass
class ModelConfig:
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 128000


@dataclass
class ModelSpec:
    id: Model
    config: ModelConfig
