import os
import pytest

@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment variables before each test."""
    os.environ["LLM_API_KEY"] = "test_api_key"
    os.environ["SERPAPI_API_KEY"] = "test_serpapi_key"
    yield
    # Clean up after test
    os.environ.pop("LLM_API_KEY", None)
    os.environ.pop("SERPAPI_API_KEY", None) 