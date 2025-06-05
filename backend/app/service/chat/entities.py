from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    search: bool = True


class ChatResponse(BaseModel):
    message: str
