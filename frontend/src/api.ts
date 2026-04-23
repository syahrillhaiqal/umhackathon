import axios from "axios";
import type {
  BudgetSnapshot,
  DecisionTraceEntry,
  IncidentCreateInput,
  IncidentEvent,
  IncidentSummary,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export async function listIncidents(): Promise<IncidentSummary[]> {
  const { data } = await client.get<IncidentSummary[]>("/api/incidents");
  return data;
}

export async function listBudgets(): Promise<BudgetSnapshot[]> {
  const { data } = await client.get<BudgetSnapshot[]>("/api/budgets");
  return data;
}

export async function createIncident(payload: IncidentCreateInput): Promise<Record<string, unknown>> {
  const { data } = await client.post<Record<string, unknown>>("/api/incidents", payload);
  return data;
}

export async function getTrace(incidentId: string): Promise<DecisionTraceEntry[]> {
  const { data } = await client.get<DecisionTraceEntry[]>(`/api/incidents/${incidentId}/trace`);
  return data;
}

export function subscribeIncidentEvents(onEvent: (event: IncidentEvent) => void): () => void {
  const source = new EventSource(`${API_BASE_URL}/api/stream/incidents`);
  source.addEventListener("incident_update", (message) => {
    const event = JSON.parse((message as MessageEvent).data) as IncidentEvent;
    onEvent(event);
  });

  return () => {
    source.close();
  };
}
