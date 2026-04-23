# GridGuard

GridGuard is an agentic AI system for autonomous municipal hazard resolution.

This MVP demonstrates:

- Stateful cyclic reasoning with LangGraph loops (not a linear pipeline)
- Tool-driven decisions for budget checks, fund transfer, and contractor dispatch
- Autonomous fallback under constraints (budget transfer + contractor retries)
- Durable execution state with Redis checkpointer
- End-to-end auditability in PostgreSQL and operational budgeting in DuckDB

## Stack (Non-Negotiable Implementation)

- Backend: FastAPI (Python 3.12)
- Workflow Engine: LangGraph
- LLM: GLM-5.1 (through OpenAI-compatible endpoint)
- Operational DB: DuckDB
- Audit DB: PostgreSQL
- Checkpoint State: Redis
- Frontend: React + Vite + Tailwind

## Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/                 # FastAPI routes
│   │   ├── core/                # settings/enums
│   │   ├── db/                  # DuckDB + PostgreSQL repositories
│   │   ├── graph/               # LangGraph builder, nodes, GLM decision engine
│   │   ├── models/              # Pydantic models + workflow state
│   │   ├── services/            # workflow orchestration + SSE event broker
│   │   └── tools/               # mock tool interfaces
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/          # Incident feed, decision trace, budget board
│   │   ├── api.ts               # REST + SSE client
│   │   └── App.tsx              # dashboard shell
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Hazard Classification (Strict Enum)

```python
class HazardCategory(str, Enum):
		ROAD_PAVEMENT = "ROAD_PAVEMENT"
		UTILITY_POWER = "UTILITY_POWER"
		WATER_SEWAGE = "WATER_SEWAGE"
		VEGETATION = "VEGETATION"
		LIGHTING = "LIGHTING"
```

## Agentic Orchestration

Graph topology:

```text
Triage -> Financial_Check -> Reasoning -> Logistics_Dispatch -> END
		    ^
		    |
	    (TRANSFER_FUNDS loops)
```

Loop semantics:

1. `Triage` classifies hazard + risk.
2. `Financial_Check` runs `check_budget(category)`.
3. `Reasoning` emits strict structured decision JSON:

```json
{
	"decision": "TRANSFER_FUNDS | CONTINUE | ESCALATE",
	"reason": "...",
	"action": {
		"tool": "...",
		"params": {}
	}
}
```

4. If `TRANSFER_FUNDS`, system executes `execute_fund_transfer` and loops back to `Financial_Check`.
5. If `CONTINUE`, system enters `Logistics_Dispatch`.
6. If no viable path exists at any stage, state transitions to `HUMAN_ESCALATION`.

### Mandatory Budget Reallocation Logic

When `remaining_budget == 0` and `risk_level in [HIGH, CRITICAL]`, reasoning selects `TRANSFER_FUNDS` and calls:

- tool: `execute_fund_transfer`
- source: `Safety_Contingency`
- target: incident hazard category

### Contractor Fallback Loop

`Logistics_Dispatch` iterates contractors in distance order:

- If unavailable, retries next closest contractor
- Continues until contractor found or retries exhausted
- On exhaustion, escalates to `HUMAN_ESCALATION` (never silent failure)

## Why LangGraph + GLM (Instead of Hardcoded Logic)

Hardcoded branching locks behavior to static rules and does not adapt cleanly across mixed constraints.

GridGuard uses:

- LangGraph for explicit state machine control and cyclic execution
- GLM-driven decision node for structured, tool-aware policy selection
- Deterministic JSON outputs that are auditable and replayable

Result: dynamic decisioning with deterministic orchestration.

## Failure Recovery and Stateful Resume

- Redis checkpointer stores intermediate graph states by `thread_id = incident_id`.
- If runtime interruption occurs, execution can resume from checkpoint.
- Every node emits an audit event into PostgreSQL, preserving a full trace.

## API Surface

- `POST /api/incidents` - create and process incident
- `POST /api/incidents/{incident_id}/resume` - resume from checkpoint
- `GET /api/incidents` - latest incident feed
- `GET /api/incidents/{incident_id}/trace` - full decision trace
- `GET /api/budgets` - category budgets
- `GET /api/stream/incidents` - SSE real-time updates

## Run with Docker Compose

Prerequisites:

- Docker + Docker Compose

Start stack:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:5174
- Backend: http://localhost:8000
- Backend health: http://localhost:8000/health

Environment:

- Set `GLM_API_KEY` in shell before `docker compose up` if using live GLM decisions.
- Without `GLM_API_KEY`, reasoning falls back to deterministic policy logic using the same structured schema.

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Dashboard Capabilities

- Real-time incident feed and status badges
- Decision trace with summaries, decisions, and tool calls
- Live budget visualization for the 5 hazard categories
- Dark mode and high-contrast mode

## Note on Existing Next.js App

The legacy Next.js prototype remains in this repository untouched.
The production-grade GridGuard MVP required by this scope is implemented in `backend/` and `frontend/`.
