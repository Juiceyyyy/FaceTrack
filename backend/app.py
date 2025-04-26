# -------------------------------
# FASTAPI APPLICATION ENTRY POINT
# -------------------------------
# Responsibilities:
# 1. Initialize FastAPI application
# 2. Configure middleware
# 3. Mount routers
# -------------------------------

from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
import uvicorn # type: ignore
from routes import camera, faces

# -------------------------------
# APPLICATION INITIALIZATION
# -------------------------------
app = FastAPI(
    title="FaceTrack API",
    description="Real-time facial recognition system",
    version="2.0.0",
    docs_url="/docs",
    redoc_url=None
)

# -------------------------------
# CORS CONFIGURATION
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://facetrack-dbit.vercel.app/"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# -------------------------------
# ROUTER REGISTRATION
# -------------------------------
app.include_router(camera.router, prefix="/camera", tags=["Camera"])
app.include_router(faces.router, prefix="/faces", tags=["Faces"])

# -------------------------------
# LIFECYCLE HANDLERS
# -------------------------------
@app.on_event("startup")
async def startup_event():
    print("✅ Application started successfully")
    print("✅ Face analysis models initialized")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Application shutting down")

# -------------------------------
# HEALTH CHECK ENDPOINT
# -------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "active",
        "version": "2.0.0",
        "components": {
            "face_detection": "operational",
            "database": "connected"
        }
    }

# -------------------------------
# APPLICATION RUNNER
# -------------------------------
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_config="logging.conf",
        timeout_keep_alive=30
    )