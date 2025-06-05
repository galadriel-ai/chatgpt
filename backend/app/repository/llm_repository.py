from typing import AsyncGenerator, Optional
from typing import List

from app import api_logger
from openai import AsyncOpenAI

from app.domain.chat.entities import Message

logger = api_logger.get()


class LlmRepository:
    api_key: str
    client: AsyncOpenAI

    def __init__(
        self,
        api_key: str,
    ):
        if not api_key:
            raise ValueError("API key must be set")
        self.client = AsyncOpenAI(api_key=api_key)

    async def completion(
        self,
        messages: List[Message],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 350,
        response_format: Optional[dict] = None,
    ) -> AsyncGenerator[str, None]:
        # Need to handle context length?
        response = await self.client.chat.completions.create(
            model=model,
            messages=[{
                "role": m.role,
                "content": m.content
            } for m in messages],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
