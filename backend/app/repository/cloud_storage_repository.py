import asyncio
import os

from app import api_logger
from google.cloud import storage
from google.cloud.storage import Bucket
from google.oauth2 import service_account

logger = api_logger.get()


class CloudStorageRepository:
    def __init__(self, bucket_name: str, credentials_file_path: str):
        self.bucket_name = bucket_name

        if not os.path.exists(credentials_file_path):
            raise FileNotFoundError(
                f"Google Cloud credentials file not found at: {credentials_file_path}."
            )

        credentials = service_account.Credentials.from_service_account_file(
            credentials_file_path
        )
        self.storage_client = storage.Client(credentials=credentials)

    async def upload_blob_to_gcs(self, data: bytes, gcs_path: str) -> str:
        """
        Uploads a bytes blob (e.g., image or video) to GCS at the specified path.
        Optionally sets the content type.
        Returns the public URL of the uploaded file.
        """
        bucket: Bucket = self.storage_client.bucket(self.bucket_name)
        blob = bucket.blob(gcs_path)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, lambda: blob.upload_from_string(data))
        return f"https://storage.googleapis.com/{self.bucket_name}/{gcs_path}"
