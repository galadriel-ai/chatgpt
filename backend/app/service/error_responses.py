from typing import Optional

from starlette import status


class APIErrorResponse(Exception):
    """Base class for other exceptions"""

    def __init__(self):
        pass

    def to_status_code(self) -> int:
        raise NotImplementedError

    def to_code(self) -> str:
        raise NotImplementedError

    def to_message(self) -> str:
        raise NotImplementedError


class InvalidCredentialsAPIError(APIErrorResponse):
    def __init__(self, message_extra: Optional[str] = None):
        self.message_extra = message_extra

    def to_status_code(self) -> int:
        return status.HTTP_401_UNAUTHORIZED

    def to_code(self) -> str:
        return "invalid_credentials"

    def to_message(self) -> str:
        result = "Invalid credentials"
        if self.message_extra:
            result += f" - {self.message_extra}"
        return result


class NotFoundAPIError(APIErrorResponse):
    def __init__(self, message_extra: Optional[str] = None):
        self.message_extra = message_extra

    def to_status_code(self) -> int:
        return status.HTTP_404_NOT_FOUND

    def to_code(self) -> str:
        return "not_found"

    def to_message(self) -> str:
        return "Can't find the requested resource" + (
            f". {self.message_extra}" if self.message_extra else ""
        )


class FileSizeTooLargeAPIError(APIErrorResponse):
    def __init__(self, message: str):
        self.message = message

    def to_status_code(self) -> int:
        return status.HTTP_413_REQUEST_ENTITY_TOO_LARGE

    def to_code(self) -> str:
        return "file_size_too_large"

    def to_message(self) -> str:
        return self.message


class ValidationTypeError(APIErrorResponse):
    def __init__(self, message: str):
        self.message = message

    def to_status_code(self) -> int:
        return status.HTTP_422_UNPROCESSABLE_ENTITY

    def to_code(self) -> str:
        return "unprocessable_entity"

    def to_message(self) -> str:
        return self.message


class InternalServerAPIError(APIErrorResponse):
    """Raised when an internal server error occurs"""

    def __init__(self, message_extra: Optional[str] = None):
        self.message_extra = message_extra

    def to_status_code(self) -> int:
        return status.HTTP_500_INTERNAL_SERVER_ERROR

    def to_code(self) -> str:
        return "internal_server_error"

    def to_message(self) -> str:
        return (
            "The request could not be completed due to an internal server error: "
            + (f"{self.message_extra}" if self.message_extra else "")
        )
