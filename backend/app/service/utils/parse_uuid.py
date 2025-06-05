from uuid import UUID

from app.service import error_responses


def parse(uid: str) -> UUID:
    try:
        return UUID(uid)
    except ValueError:
        raise error_responses.ValidationTypeError("Error, id is not a valid UUID")
    except TypeError:
        raise error_responses.ValidationTypeError("Error, id is not a valid type")
    except Exception:
        raise error_responses.ValidationTypeError("Failed to process id")
