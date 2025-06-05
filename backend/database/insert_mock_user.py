import asyncio
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker

from settings import DB_USER, DB_PASSWORD, DB_DATABASE, DB_HOST, DB_PORT


async def insert_mock_user():
    # Create database URL
    url = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}"

    # Create engine and session
    engine = create_async_engine(url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    # Create mock user data
    user_id = uuid4()
    email = "mock.user@example.com"

    # SQL query to insert user
    query = text("""
        INSERT INTO user_profile (id, email, created_at, last_updated_at)
        VALUES (:id, :email, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """)

    async with async_session() as session:
        await session.execute(query, {"id": user_id, "email": email})
        await session.commit()
        print(f"Successfully inserted mock user with ID: {user_id} and email: {email}")


if __name__ == "__main__":
    asyncio.run(insert_mock_user())
