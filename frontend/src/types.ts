export type ResolutionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "HUMAN_ESCALATION"
  | "FAILED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type HazardCategory =
  | "ROAD_PAVEMENT"
  | "UTILITY_POWER"
  | "WATER_SEWAGE"
  | "VEGETATION"
  | "LIGHTING";

export interface IncidentSummary {
  incident_id: string;
  title: string;
  location: string;
  status: ResolutionStatus;
  risk_level: RiskLevel | null;
  hazard_category: HazardCategory | null;
  updated_at: string;
}

export interface BudgetSnapshot {
  category: string;
  allocated_budget: number;
  remaining_budget: number;
}

export interface DecisionTraceEntry {
  id: string;
  incident_id: string;
  node_name: string;
  summary: string;
  decision: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface IncidentCreateInput {
  title: string;
  description: string;
  location: string;
  media_url?: string;
}

export interface IncidentEvent {
  incident_id: string;
  node: string;
  summary: string;
  decision: string | null;
  state: Record<string, unknown>;
}
