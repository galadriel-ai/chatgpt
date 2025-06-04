from typing import AsyncGenerator, Optional

from app import api_logger
from openai import AsyncOpenAI

logger = api_logger.get()


class LlmRepository:
    api_key: str
    llm_model: str
    client: AsyncOpenAI

    def __init__(
        self,
        api_key: str,
        llm_model: str,
    ):
        if not api_key:
            raise ValueError("API key must be set")
        if not llm_model:
            raise ValueError("LLM model must be set")
        self.llm_model = llm_model
        self.client = AsyncOpenAI(api_key=api_key)

    async def completion(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 350,
        response_format: Optional[dict] = None,
    ) -> AsyncGenerator[str, None]:
        response = await self.client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
