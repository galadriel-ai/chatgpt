import os
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)

ENVIRONMENT = os.getenv("PLATFORM_ENVIRONMENT", "local")


def is_production():
    return ENVIRONMENT == "production"


def is_test():
    return ENVIRONMENT == "test"


APPLICATION_NAME = "DISTRIBUTED_INFERENCE"
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1")
API_PORT = int(os.getenv("API_PORT", 5000))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
LOG_FILE_PATH = "logs/logs.log"

# Database configurations
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "passw0rd")
DB_DATABASE = os.getenv("DB_DATABASE", "agents")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5435")

# Read replica database configurations
DB_USER_READ = os.getenv("DB_USER_READ", "postgres")
DB_PASSWORD_READ = os.getenv("DB_PASSWORD_READ", "passw0rd")
DB_DATABASE_READ = os.getenv("DB_DATABASE_READ", "agents")
DB_HOST_READ = os.getenv("DB_HOST_READ", "localhost")
DB_PORT_READ = os.getenv("DB_PORT_READ", "5435")

# AI configurations
LLM_MODEL = os.getenv("LLM_MODEL", "accounts/fireworks/models/deepseek-v3-0324")
LLM_API_KEY = os.getenv("LLM_API_KEY")
if not LLM_API_KEY:
    raise RuntimeError("LLM_API_KEY is not set")

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
if not SERPAPI_API_KEY:
    raise RuntimeError("SERPAPI_API_KEY is not set")
