from typing import List

from app.domain.chat.entities import Intent, Model, ModelConfig, ModelSpec
from app.repository.llm_repository import LlmRepository
from app.dependencies import get_llm_repository

PROMPT_TEMPLATE = """
You are a helpful assistant that can detect the intent of a message.

The intent can be one of the following:
\t{intents}

The message is:
{message}

Return the intent as a string.
"""


async def execute(
    message: str,
    llm_repository: LlmRepository,
) -> Intent:
    # get all enum values as a string
    intents = [intent.value for intent in Intent]
    prompt = PROMPT_TEMPLATE.format(intents="\n\t".join(intents), message=message)
    print(prompt)
    model = ModelSpec(
        id=Model.DEFAULT_MODEL,
        config=ModelConfig(),
    )
    async for chunk in llm_repository.completion([{"role": "system", "content": prompt}], model):
        print(chunk)
    return Intent("default")


if __name__ == "__main__":
    import asyncio
    asyncio.run(execute("Draw a monkey", get_llm_repository()))