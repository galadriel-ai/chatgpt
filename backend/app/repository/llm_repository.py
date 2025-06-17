from typing import AsyncGenerator, Optional, Dict, List
import asyncio

from app import api_logger
import openai
from openai import AsyncOpenAI
from app.domain.chat.entities import ChunkOutput, ToolOutput, ModelSpec
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
from app.exceptions import LlmError
import serpapi

logger = api_logger.get()


class LlmRepository:
    api_key: str
    client: AsyncOpenAI

    def __init__(
        self,
        api_key: str,
        search_api_key: str,
        base_url: str,
        fallback_api_key: str,
        fallback_base_url: str,
    ):
        if not api_key:
            raise ValueError("API key must be set")
        if not search_api_key:
            raise ValueError("Search API key must be set")
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
        )
        self.fallback_client = AsyncOpenAI(
            base_url=fallback_base_url,
            api_key=fallback_api_key,
        )
        self.search_client = serpapi.Client(api_key=search_api_key)

    async def completion(
        self,
        messages: List[Dict],
        model: ModelSpec,
        is_search_enabled: bool = True,
        response_format: Optional[dict] = None,
    ) -> AsyncGenerator[ChunkOutput | ToolOutput, None]:
        try:
            async for output in self._completion(
                self.client,
                messages,
                model,
                model.type.primary_model,
                is_search_enabled,
                response_format,
            ):
                yield output
        except (
            asyncio.TimeoutError,
            openai.RateLimitError,
            openai.NotFoundError,
            openai.BadRequestError,
            openai.InternalServerError,
            openai.APIStatusError,
            openai.APIError,
        ) as e:
            logger.warning(
                f"Primary LLM client failed: {str(e)}. Attempting fallback..."
            )
            try:
                async for output in self._completion(
                    self.fallback_client,
                    messages,
                    model,
                    model.type.fallback_model,
                    is_search_enabled,
                    response_format,
                ):
                    yield output
            except Exception as fallback_error:
                logger.error(f"Fallback LLM client also failed: {str(fallback_error)}")
                if isinstance(e, asyncio.TimeoutError):
                    raise LlmError(
                        message="Request timed out, please try again in a few moments."
                    )
                elif (
                    hasattr(e, "body")
                    and isinstance(e.body, dict)
                    and "message" in e.body
                ):
                    raise LlmError(message=e.body["message"])
                else:
                    raise LlmError(
                        message="An unexpected error occurred. Please try again in a few moments."
                    )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise LlmError(
                message="An unexpected error occurred. Please try again in a few moments."
            )

    async def _completion(
        self,
        client: AsyncOpenAI,
        messages: List[Dict],
        model: ModelSpec,
        model_id: str,
        is_search_enabled: bool,
        response_format: Optional[dict],
    ) -> AsyncGenerator[ChunkOutput | ToolOutput, None]:
        logger.info(f"Using model: {model_id}")
        stream = await asyncio.wait_for(
            client.chat.completions.create(
                model=model_id,
                messages=messages,
                temperature=model.config.temperature,
                max_tokens=model.config.max_tokens,
                response_format=response_format,
                tools=[SEARCH_TOOL_DEFINITION] if is_search_enabled else None,
                stream=True,
            ),
            timeout=model.type.timeout,
        )

        async for chunk in stream:
            choice = chunk.choices[0]
            if choice.delta.tool_calls:
                for tc in choice.delta.tool_calls:
                    if tc.function:
                        yield ToolOutput(
                            tool_call_id=tc.id,
                            name=tc.function.name,
                            arguments=tc.function.arguments,
                            result="",
                        )
            if choice.delta.content is not None:
                yield ChunkOutput(content=choice.delta.content)
