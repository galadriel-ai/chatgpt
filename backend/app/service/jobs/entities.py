from typing import Optional

from pydantic import BaseModel


class JobStatus(BaseModel):
    id: str
    status: str
    url: Optional[str]
