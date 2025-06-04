from typing import List

from fastapi import APIRouter

from app import api_logger
from app.routers.routes import chat_router

TAG_ROOT = "root"

router = APIRouter()
logger = api_logger.get()

routers_to_include: List[APIRouter] = [
    # This is the order they show up in openapi.json
    chat_router.router,
]

for router_to_include in routers_to_include:
    router.include_router(router_to_include)
