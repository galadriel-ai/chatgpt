from typing import AsyncGenerator, Optional
from typing import Dict
from typing import List
import asyncio

from app import api_logger
from openai import AsyncOpenAI, AsyncStream
from app.domain.chat.entities import ChunkOutput, ToolOutput, ModelSpec
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
import serpapi

logger = api_logger.get()

TIMEOUT = 10


class LlmRepository:
    api_key: str
    client: AsyncOpenAI

    def __init__(self, api_key: str, search_api_key: str, base_url: str):
        if not api_key:
            raise ValueError("API key must be set")
        if not search_api_key:
            raise ValueError("Search API key must be set")
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
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
            stream: AsyncStream = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=model.id.value,
                    messages=messages,
                    temperature=model.config.temperature,
                    max_tokens=model.config.max_tokens,
                    response_format=response_format,
                    tools=[SEARCH_TOOL_DEFINITION] if is_search_enabled else None,
                    stream=True,
                ),
                timeout=TIMEOUT,
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
                                result=None,
                            )
                if choice.delta.content is not None:
                    yield ChunkOutput(content=choice.delta.content)
        except asyncio.TimeoutError:
            logger.error(f"LLM request timed out after {TIMEOUT} seconds")
            raise (
                asyncio.TimeoutError(f"LLM request timed out after {TIMEOUT} seconds")
            )
        except Exception as e:
            logger.error(f"LLM request failed: {str(e)}")
            raise (Exception(f"{str(e)}"))
