from typing import AsyncGenerator, Optional
from typing import List

from app import api_logger
from openai import AsyncOpenAI, AsyncStream
from app.domain.chat.entities import Message, ChunkOutput, ToolOutput
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
import serpapi

logger = api_logger.get()


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
        messages: List[Message],
        model: str,
        is_search_enabled: bool = True,
        temperature: float = 0.2,
        max_tokens: int = 350,
        response_format: Optional[dict] = None,
    ) -> AsyncGenerator[ChunkOutput | ToolOutput, None]:
        stream: AsyncStream = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": m.role,
                    "content": m.content,
                    "tool_call_id": m.tool_call_id,
                    "name": m.name,
                }
                for m in messages
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
            tools=[SEARCH_TOOL_DEFINITION] if is_search_enabled else None,
            stream=True,
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
