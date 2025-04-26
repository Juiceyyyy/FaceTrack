# -------------------------------
# APPLICATION ENTRY POINT
# -------------------------------
# Responsibilities:
# 1. Start ASGI server
# 2. Handle configuration
# 3. Initialize components
# -------------------------------

import uvicorn # type: ignore
import os
from app import app  # Import from app.py

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", 8000)),
        reload=os.environ.get("DEBUG", "false").lower() == "true",
        log_level="info",
        timeout_keep_alive=30
    )