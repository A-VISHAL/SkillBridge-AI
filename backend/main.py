from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router
import os

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

@app.on_event("startup")
async def startup_event():
    print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} starting...")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔧 Upload directory: {settings.UPLOAD_DIR}")
    
    if settings.OXLO_API_KEY:
        print("✅ Oxlo API configured")
    else:
        print("⚠️  Oxlo API not configured - using demo mode")
    
    if settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY:
        print("✅ Adzuna API configured")
    else:
        print("⚠️  Adzuna API not configured - using sample jobs")

@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Shutting down SkillBridge AI API...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
