from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any
from typing import Dict
from typing import Optional
from uuid import UUID


class GenerationType(Enum):
    IMAGE = "image"
    VIDEO = "video"


class GenerationStatus(Enum):
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class GenerationInput:
    type: GenerationType
    prompt: str


@dataclass
class GenerationOutput:
    id: UUID
    user_id: UUID
    type: GenerationType
    prompt: str
    status: GenerationStatus
    url: Optional[str]
    data: Dict[str, Any]
    created_at: datetime
    last_updated_at: datetime
