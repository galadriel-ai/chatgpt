import uvicorn

import settings

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=True,
        timeout_keep_alive=120,
    )
