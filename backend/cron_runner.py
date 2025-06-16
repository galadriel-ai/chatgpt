import asyncio
from typing import Awaitable
from typing import Callable

from app import api_logger
from app import dependencies
from app.cron import summarization_job
from app.repository import connection

logger = api_logger.get()


async def start_cron_jobs():
    connection.init_defaults()

    tasks = [
        (_run_character_summarization_job, "Chat summarization job", 1800),
    ]

    await asyncio.gather(*[_cron_runner(*t) for t in tasks])
    logger.info("Cron jobs done")


async def _cron_runner(
    job_callback: Callable[..., Awaitable[None]],
    job_name: str,
    timeout_seconds: int,
    *args,
):
    while True:
        try:
            logger.debug(f"Started {job_name} job")
            await job_callback(*args)
            logger.debug(f"Finished {job_name} job, waiting {timeout_seconds} seconds")
            await asyncio.sleep(timeout_seconds)
        except Exception:
            logger.error(
                f"{job_name} job failed, will retry in {timeout_seconds} seconds",
                exc_info=True,
            )
            # Wait a minute before checking the next schedule
            await asyncio.sleep(60)


async def _run_character_summarization_job():
    repository = dependencies.get_chat_configuration_repository()
    llm_repository = dependencies.get_llm_repository()
    await summarization_job.execute(repository, llm_repository)


if __name__ == "__main__":
    asyncio.run(start_cron_jobs())
