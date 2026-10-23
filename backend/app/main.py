import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, profile, reports, chat, health
from app.services.supabase_service import get_supabase_service
from app.services.ocr_service import get_ocr_service
from app.services.gemini_service import get_gemini_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_health_copilot")

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    AI-Powered Personal Health Copilot REST API.
    Provides secure health profile management, medical document processing using Google Gemini Multimodal AI,
    clinical structuring and AI chat, and persistent storage via Supabase PostgreSQL.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing your request. Please try again later.",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# Health Check Endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Returns system status, version, and the readiness of connected services (Supabase, Gemini Multimodal, Gemini Chat).
    """
    supabase = get_supabase_service()
    gemini = get_gemini_service()
    ocr = get_ocr_service()

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "supabase": "connected" if supabase.is_configured() else "in-memory (dev mode)",
            "ocr_engine": "Gemini Multimodal Document AI" if ocr.is_configured() else "Gemini Multimodal Document AI (dev fallback mode)",
            "gemini_api": "configured" if gemini.is_configured() else "fallback mode (awaiting GEMINI_API_KEY)",
        },
        "limits": {
            "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
            "max_pdf_pages": settings.MAX_PDF_PAGES,
            "allowed_formats": settings.ALLOWED_EXTENSIONS,
        },
    }


# Include Application Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(reports.router)
app.include_router(chat.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
