from typing import AsyncGenerator, Optional
from typing import List
import json

from app import api_logger
from openai import AsyncOpenAI, AsyncStream
from app.domain.llm_tools.search import search_web
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
import serpapi
from uuid_extensions import uuid7
from app.domain.chat.entities import Message

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
    ) -> AsyncGenerator[str, None]:
        # Need to handle context length?
        while True:
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

            final_tool_calls = {}

            async for chunk in stream:
                choice = chunk.choices[0]
                if choice.delta.tool_calls:
                    for tc in choice.delta.tool_calls:
                        if tc.id not in final_tool_calls:
                            final_tool_calls[tc.id] = {
                                "id": tc.id,
                                "name": tc.function.name if tc.function else None,
                                "arguments": "",
                            }

                        if tc.function and tc.function.arguments:
                            final_tool_calls[tc.id]["arguments"] += (
                                tc.function.arguments
                            )
                            try:
                                args = json.loads(final_tool_calls[tc.id]["arguments"])
                                if (
                                    final_tool_calls[tc.id]["name"]
                                    == SEARCH_TOOL_DEFINITION["function"]["name"]
                                ):
                                    logger.info(f"Searching web for: {args['query']}")
                                    result = search_web(
                                        args["query"], self.search_client
                                    )
                                    logger.info(f"Search result: {result}")
                                    messages.append(
                                        Message(
                                            id=uuid7(),
                                            chat_id=messages[0].chat_id,
                                            role="tool",
                                            content=result,
                                            tool_call_id=tc.id,
                                            name="search_web",
                                        )
                                    )
                            except json.JSONDecodeError:
                                continue
                    continue

                if choice.delta.content is not None:
                    yield choice.delta.content

            if final_tool_calls:
                continue
            break
