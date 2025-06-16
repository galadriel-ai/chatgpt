from app.domain.users.entities import User
from app.domain.generation.entities import GenerationInput
from app.domain.generation.entities import GenerationOutput
from app.domain.generation.entities import GenerationStatus
from app.domain.generation.entities import GenerationType
from app.repository.generation_repository import GenerationRepository
from app.repository.wavespeed_repository import WavespeedRepository


async def execute(
    user: User,
    request: GenerationInput,
    repository: GenerationRepository,
    wavespeed_repository: WavespeedRepository,
) -> GenerationOutput:
    response = await wavespeed_repository.generate_image(request.prompt)
    status = GenerationStatus(response.status)
    return await repository.insert(
        user.uid,
        GenerationType.IMAGE,
        request.prompt,
        status,
        {"wavespeed_id": response.id},
        None,
    )
