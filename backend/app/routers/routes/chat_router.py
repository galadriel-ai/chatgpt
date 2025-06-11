from fastapi import APIRouter
from fastapi import Body
from fastapi import Path
from fastapi import Depends
from fastapi.responses import StreamingResponse

from app import dependencies
from app.domain.users.entities import User
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.chat_repository import ChatRepository
from app.repository.llm_repository import LlmRepository
from app.service.auth import authentication
from app.service.chat import chat_details_service
from app.service.chat import chat_service
from app.service.chat import chats_service
from app.service.chat import create_chat_configuration_service
from app.service.chat.entities import ChatConfigurationRequest
from app.service.chat.entities import ChatRequest

TAG = "Chat"
router = APIRouter()
router.openapi_tags = [TAG]
router.title = "Chat router"


@router.post(
    "/chat",
    summary="Send a message to the chat and stream the response.",
    tags=[TAG],
)
async def chat(
    request: ChatRequest = Body(..., description="Input and parameters for the chat."),
    user: User = Depends(authentication.validate_session_token),
    llm_repository: LlmRepository = Depends(dependencies.get_llm_repository),
    chat_repository: ChatRepository = Depends(dependencies.get_chat_repository),
):
    headers = {
        "X-Content-Type-Options": "nosniff",
        "Connection": "keep-alive",
    }

    return StreamingResponse(
        chat_service.execute(
            request,
            user,
            llm_repository,
            chat_repository,
        ),
        headers=headers,
        media_type="text/plain",
    )


@router.get(
    "/",
    summary="Get user chats",
    tags=[TAG],
)
async def get_chats(
    user: User = Depends(authentication.validate_session_token),
    chat_repository: ChatRepository = Depends(dependencies.get_chat_repository),
):
    return await chats_service.execute(
        user,
        chat_repository,
    )


@router.get(
    "/chat/{chat_id}",
    summary="Get chat details",
    tags=[TAG],
)
async def get_chat_details(
    chat_id: str = Path(description="Chat ID"),
    _: User = Depends(authentication.validate_session_token),
    chat_repository: ChatRepository = Depends(dependencies.get_chat_repository),
):
    return await chat_details_service.execute(
        chat_id,
        chat_repository,
    )


@router.post(
    "/configure/chat",
    summary="Add a chat configuration.",
    tags=[TAG],
)
async def create_chat_configuration(
    request: ChatConfigurationRequest = Body(..., description="Configuration for chats."),
    user: User = Depends(authentication.validate_session_token),
    configuration_repository: ChatConfigurationRepository = Depends(dependencies.get_chat_configuration_repository),
):
    return await create_chat_configuration_service.execute(
        request,
        user,
        configuration_repository,
    )
