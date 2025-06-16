from datetime import datetime
from typing import Optional

from app import api_logger
from app.domain.chat.entities import ChatConfigurationSummary
from app.domain.chat.entities import Model
from app.domain.chat.entities import ModelConfig
from app.domain.chat.entities import ModelSpec
from app.repository import utils
from app.repository.chat_configuration_repository import ChatConfigurationRepository
from app.repository.llm_repository import LlmRepository

SUMMARIZATION_PROMPT = """
You are an assistant responsible for maintaining long-term memory about a user based on their conversations.

Below is a sequence of messages between the user and an AI character. Your job is to extract important facts, recurring topics, and relevant context that the AI should remember for future conversations with this user.

Include:
- Facts about the user (interests, preferences, background, goals, relationships, etc.)
- Important events or stories they’ve shared
- Any questions or topics they frequently discuss
- Insights into their personality, tone, or communication style

Be concise but specific. Do not include irrelevant small talk or anything already too vague to be useful.

---

Messages:
{{messages}}

---

Memory Summary:
"""

SUMMARY_MERGING_PROMPT = """
You are an AI assistant responsible for managing long-term memory about a user.

Below are two memory summaries:
- The first is the current long-term memory stored about the user.
- The second is a new set of information extracted from recent conversations.

Your task is to intelligently merge these two summaries into a single, updated memory. Avoid repeating identical points. Keep the result concise, fact-based, and easy for an AI to use in future interactions. Prioritize clarity and coherence.

---

Existing Memory:
{{existing_summary}}

New Summary:
{{new_summary}}

---

Updated Combined Memory:

"""

SUMMARIZATION_MODEL = ModelSpec(
    id=Model.DEFAULT_MODEL,
    config=ModelConfig(),
)

SUMMARIZATION_FREQUENCY_SECONDS = 1800

logger = api_logger.get()


async def execute(
    repository: ChatConfigurationRepository,
    llm_repository: LlmRepository,
) -> None:
    characters = await repository.get_characters_needing_summarization(
        SUMMARIZATION_FREQUENCY_SECONDS
    )
    for character in characters:
        try:
            messages = await repository.get_chat_messages_by_configuration(
                configuration_id=character.id,
                starting_from=character.last_summarized_at,
            )
            if not messages:
                continue
            last_summarized_at = utils.utcnow()
            summary = await _get_summary(messages, llm_repository)
            if not summary:
                continue
            await _update_summary(
                character, summary, last_summarized_at, repository, llm_repository
            )
        except Exception:
            logger.error(
                f"Unexpected error while trying to summarize messages, for configuration: {character.id}",
                exc_info=True,
            )


async def _get_summary(messages, llm_repository) -> Optional[str]:
    formatted_messages = "\n".join([f"{m.role}: {m.content}" for m in messages])
    prompt = SUMMARIZATION_PROMPT.replace("{{messages}}", formatted_messages)
    try:
        response = await llm_repository.completion_nostream(
            [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            SUMMARIZATION_MODEL,
        )
        return response
    except Exception:
        logger.error("Error composing summary", exc_info=True)
    return None


async def _update_summary(
    character: ChatConfigurationSummary,
    summary: str,
    last_summarized_at: datetime,
    repository: ChatConfigurationRepository,
    llm_repository: LlmRepository,
) -> None:
    if character.summary:
        try:
            prompt = SUMMARY_MERGING_PROMPT.replace(
                "{{existing_summary}}", character.summary
            ).replace("{{new_summary}}", summary)
            updated_summary = await llm_repository.completion_nostream(
                [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                SUMMARIZATION_MODEL,
            )
        except Exception:
            logger.error("Error merging summary with existing one", exc_info=True)
            return
    else:
        updated_summary = summary

    await repository.upsert_summary(updated_summary, last_summarized_at, character.id)
