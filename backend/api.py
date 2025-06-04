from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.repository import connection
from app.routers import main_router
from app.service.exception_handlers.exception_handlers import custom_exception_handler


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    app = FastAPI(title="ChatGPT API", description="API for ChatGPT", lifespan=lifespan)

    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(Exception, custom_exception_handler)

    app.include_router(
        main_router.router,
    )

    return app


@asynccontextmanager
async def lifespan(_: FastAPI):
    connection.init_defaults()
    yield


app = create_app()
