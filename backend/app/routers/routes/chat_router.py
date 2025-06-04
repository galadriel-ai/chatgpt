from fastapi import APIRouter
from fastapi import Body
from fastapi import Path
from fastapi import Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_llm_repository
from app.service.chat import chat_service
from app.service.chat.entities import ChatRequest
from app.repository.llm_repository import LlmRepository

TAG = "Chat"
router = APIRouter()
router.openapi_tags = [TAG]
router.title = "Chat router"


@router.post(
    "/{chat_id}",
    summary="Send a message to the chat and stream the response.",
    tags=[TAG],
)
async def chat(
    chat_id: str = Path(..., description="The ID of the chat."),
    request: ChatRequest = Body(..., description="Input and parameters for the chat."),
    llm_repository: LlmRepository = Depends(get_llm_repository),
):
    headers = {
        "X-Content-Type-Options": "nosniff",
        "Connection": "keep-alive",
    }

    return StreamingResponse(
        chat_service.execute(
            chat_id,
            request,
            llm_repository,
        ),
        headers=headers,
        media_type="text/event-stream",
    )
