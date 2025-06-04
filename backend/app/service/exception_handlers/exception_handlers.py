from fastapi import Request
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
from starlette.responses import Response

from app.service import error_responses


async def custom_exception_handler(request: Request, error: Exception):
    if not isinstance(error, error_responses.APIErrorResponse):
        error = error_responses.InternalServerAPIError()
    headers = {}
    if hasattr(error, "headers"):
        headers = error.headers
    return await _add_response_headers(
        JSONResponse(
            status_code=error.to_status_code(),
            content=jsonable_encoder(
                {
                    "response": "NOK",
                    "error": {
                        "status_code": error.to_status_code(),
                        "code": error.to_code(),
                        "message": error.to_message(),
                    },
                }
            ),
            headers=headers,
        ),
    )


async def _add_response_headers(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
    return response
