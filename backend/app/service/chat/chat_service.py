from app.repository.llm_repository import LlmRepository
from app.service.chat.entities import ChatRequest


async def execute(chat_id: str, request: ChatRequest, llm_repository: LlmRepository):
    async for chunk in llm_repository.completion(request.message, request.search):
        yield chunk
