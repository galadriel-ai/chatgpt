import asyncio
from typing import AsyncGenerator
from typing import Dict
from typing import List
from typing import Optional

import openai
import serpapi
from openai import AsyncOpenAI
from openai import AsyncStream
from openai import NotGiven

from app import api_logger
from app.domain.chat.entities import ChunkOutput
from app.domain.chat.entities import ModelSpec
from app.domain.chat.entities import ToolOutput
from app.domain.llm_tools.tools_definition import SEARCH_TOOL_DEFINITION
from app.exceptions import LlmError

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
                    tools=[SEARCH_TOOL_DEFINITION] if is_search_enabled else NotGiven(),
                    stream=True,
                ),
                timeout=model.id.timeout,
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
            logger.error(f"LLM request timed out after {model.id.timeout} seconds")
            raise LlmError(
                message="Request timed out, please try again in a few moments."
            )
        except openai.RateLimitError as e:
            logger.error(f"Rate limit error: {str(e)}")
            raise LlmError(message=e.body["message"])
        except openai.NotFoundError as e:
            logger.error(f"Model not found: {str(e)}")
            raise LlmError(message=e.body["message"])
        except openai.BadRequestError as e:
            logger.error(f"Bad request: {str(e)}")
            raise LlmError(message=e.body["message"])
        except openai.InternalServerError as e:
            logger.error(f"OpenAI server error: {str(e)}")
            raise LlmError(message=e.body["message"])
        except openai.APIStatusError as e:
            logger.error(f"OpenAI API error (status {e.status_code}): {str(e)}")
            raise LlmError(message=e.body["message"])
        except openai.APIError as e:
            logger.error(f"API error: {str(e)}")
            raise LlmError(message=e.body["message"])
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise LlmError(
                message="An unexpected error occurred. Please try again in a few moments."
            )

    async def completion_nostream(
        self,
        messages: List[Dict],
        model: ModelSpec,
    ) -> str:
        try:
            response_content = ""
            async for chunk in self.completion(
                messages=messages, model=model, is_search_enabled=False
            ):
                if type(chunk) is ChunkOutput:
                    response_content += chunk.content
            return response_content
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise LlmError(
                message="An unexpected error occurred. Please try again in a few moments."
            )
