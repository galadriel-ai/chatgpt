from dataclasses import dataclass
from typing import Optional

import httpx

from app import api_logger

logger = api_logger.get()


@dataclass
class WavespeedGenerationOutput:
    id: str
    status: str
    url: Optional[str]


class WavespeedRepository:
    api_key: str

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("API key must be set")
        self.api_key = api_key

    async def generate_image(
        self,
        prompt: str,
    ) -> WavespeedGenerationOutput:
        with httpx.Client() as client:
            response = client.post(
                "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-kontext-max/text-to-image",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                json={
                    "prompt": prompt,
                    # "aspect_ratio": "1:1",
                    # "num_images": 1,
                    # "guidance_scale": 3.5,
                    # "safety_tolerance": "2"
                },
            )
            response.raise_for_status()
            result = response.json()
            logger.info(
                f"Task submitted successfully. Request ID: {result['data']['id']}"
            )
            return WavespeedGenerationOutput(
                id=result["data"]["id"],
                status=result["data"]["status"],
                url=result["data"]["outputs"][0] if result["data"]["outputs"] else None,
            )

    async def get_result(self, request_id: str) -> WavespeedGenerationOutput:
        with httpx.Client() as client:
            response = client.get(
                f"https://api.wavespeed.ai/api/v3/predictions/{request_id}/result",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            result = response.json()
            return WavespeedGenerationOutput(
                id=request_id,
                status=result["data"]["status"],
                url=result["data"]["outputs"][0] if result["data"]["outputs"] else None,
            )
