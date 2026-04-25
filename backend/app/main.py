from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings
from app.services.workflow_service import WorkflowService


@asynccontextmanager
async def lifespan(app: FastAPI):
    workflow_service = WorkflowService()
    await workflow_service.initialize()
    app.state.workflow_service = workflow_service
    try:
        yield
    finally:
        await workflow_service.shutdown()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
