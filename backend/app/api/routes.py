from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
from app.models.incident import IncidentCreate
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/api", tags=["gridguard"])


class IncidentAdminAction(BaseModel):
    reviewer: str = Field(min_length=2, max_length=80)
    note: str | None = Field(default=None, max_length=500)


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


@router.get("/incidents/pending-approval")
async def list_pending_approval_incidents(
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> list[dict]:
    return await workflow_service.list_pending_approvals()


@router.get("/incidents/{incident_id}/trace")
async def incident_trace(
    incident_id: str,
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> list[dict]:
    return await workflow_service.get_trace(incident_id)


@router.post("/incidents/{incident_id}/approve")
async def approve_incident(
    incident_id: str,
    payload: IncidentAdminAction,
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> dict:
    try:
        return await workflow_service.approve_incident(
            incident_id=incident_id,
            reviewer=payload.reviewer,
            note=payload.note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/incidents/{incident_id}/reject")
async def reject_incident(
    incident_id: str,
    payload: IncidentAdminAction,
    workflow_service: WorkflowService = Depends(get_workflow_service),
) -> dict:
    try:
        return await workflow_service.reject_incident(
            incident_id=incident_id,
            reviewer=payload.reviewer,
            note=payload.note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


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
