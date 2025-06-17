from datetime import datetime
from unittest.mock import AsyncMock

from uuid_extensions import uuid7

from app.domain.chat import get_system_prompt_use_case as use_case
from app.domain.chat.entities import ChatConfigurationSummary
from app.domain.chat.entities import ChatInput
from tests.unit import testing_utils


def _get_chat_input() -> ChatInput:
    return ChatInput(
        chat_id=None,
        configuration_id=None,
        think_model=None,
        is_search_enabled=None,
        content="Hello",
        attachment_ids=[],
    )


async def test_no_configuration():
    repo = AsyncMock()
    response = await use_case.execute(
        _get_chat_input(),
        testing_utils.get_user(),
        repo,
    )
    assert response == use_case.DEFAULT_SYSTEM_MESSAGE


async def test_configuration():
    chat_input = _get_chat_input()
    chat_input.configuration_id = uuid7()
    repo = AsyncMock()
    user = testing_utils.get_user()
    repo.get_by_id_and_user.return_value = ChatConfigurationSummary(
        id=uuid7(),
        user_name="user_name",
        ai_name="ai_name",
        description="description",
        role="role",
        user_profile_id=user.uid,
        summary_id=None,
        summary=None,
        last_summarized_at=None,
    )
    response = await use_case.execute(
        chat_input,
        user,
        repo,
    )
    assert response != use_case.DEFAULT_SYSTEM_MESSAGE
    assert "summary" not in response


async def test_configuration_uses_summary():
    chat_input = _get_chat_input()
    chat_input.configuration_id = uuid7()
    repo = AsyncMock()
    user = testing_utils.get_user()
    repo.get_by_id_and_user.return_value = ChatConfigurationSummary(
        id=uuid7(),
        user_name="user_name",
        ai_name="ai_name",
        description="description",
        role="role",
        user_profile_id=user.uid,
        summary_id=uuid7(),
        summary="Likes JavaScript",
        last_summarized_at=datetime(2020, 1, 1),
    )
    response = await use_case.execute(
        chat_input,
        user,
        repo,
    )
    assert response != use_case.DEFAULT_SYSTEM_MESSAGE
    assert "summary" in response


async def test_configuration_not_found():
    chat_input = _get_chat_input()
    chat_input.configuration_id = uuid7()
    repo = AsyncMock()
    repo.get_by_id_and_user.return_value = None
    response = await use_case.execute(
        chat_input,
        testing_utils.get_user(),
        repo,
    )
    assert response == use_case.DEFAULT_SYSTEM_MESSAGE
