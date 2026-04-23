from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from app.models.incident import IncidentCreate
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/api", tags=["gridguard"])


def get_workflow_service(request: Request) -> WorkflowService:
    return request.app.state.workflow_service


@router.post("/incidents")
async def create_incident(
    payload: IncidentCreate,
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> dict:
    return await workflow_service.process_incident(payload)


@router.post("/incidents/{incident_id}/resume")
async def resume_incident(
    incident_id: str,
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> dict:
    try:
        return await workflow_service.resume_incident(incident_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/incidents")
async def list_incidents(
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> list[dict]:
    return await workflow_service.list_incidents()


@router.get("/incidents/{incident_id}/trace")
async def incident_trace(
    incident_id: str,
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> list[dict]:
    return await workflow_service.get_trace(incident_id)


@router.get("/budgets")
async def list_budgets(
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> list[dict]:
    return await workflow_service.list_budgets()


@router.get("/stream/incidents")
async def stream_incidents(
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> EventSourceResponse:
    return EventSourceResponse(workflow_service.stream_events())
