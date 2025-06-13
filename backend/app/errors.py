class LlmError(Exception):
    def __init__(self, message: str, error_code: int = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class LlmAuthenticationError(LlmError):
    def __init__(self, message: str = "Invalid authentication"):
        super().__init__(message, 401)


class LlmOrganizationError(LlmError):
    def __init__(
        self, message: str = "You must be a member of an organization to use the API"
    ):
        super().__init__(message, 401)


class LlmRegionError(LlmError):
    def __init__(self, message: str = "Country, region, or territory not supported"):
        super().__init__(message, 403)


class LlmRateLimitError(LlmError):
    def __init__(self, message: str = "Rate limit reached for requests"):
        super().__init__(message, 429)


class LlmQuotaError(LlmError):
    def __init__(
        self,
        message: str = "You exceeded your current quota, please check your plan and billing details",
    ):
        super().__init__(message, 429)


class LlmServerError(LlmError):
    def __init__(
        self, message: str = "The server had an error while processing your request"
    ):
        super().__init__(message, 500)


class LlmOverloadError(LlmError):
    def __init__(
        self,
        message: str = "The engine is currently overloaded, please try again later",
    ):
        super().__init__(message, 503)


class LlmSlowDownError(LlmError):
    def __init__(self, message: str = "Slow down, please reduce your request rate"):
        super().__init__(message, 503)


class LlmTimeoutError(LlmError):
    def __init__(self, message: str = "Request timed out"):
        super().__init__(message)


class LlmInvalidModelError(LlmError):
    def __init__(self, message: str = "Invalid model specified"):
        super().__init__(message)


class LlmModelNotFoundError(LlmError):
    def __init__(
        self, message: str = "Model not found, inaccessible, and/or not deployed"
    ):
        super().__init__(message, 404)
