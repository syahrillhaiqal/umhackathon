import { TriageResult } from "@/lib/ai-triage";

export type BudgetStatus = "Pending" | "Approved";

export interface IncidentReport {
  id: string;
  createdAt: string;
  locationText: string;
  description: string;
  latitude: number;
  longitude: number;
  triage: TriageResult;
  aiSuggestedBudget: number;
  budgetStatus: BudgetStatus;
}

interface CreateIncidentInput {
  locationText: string;
  description: string;
  latitude: number;
  longitude: number;
  triage: TriageResult;
}

const STORAGE_KEY = "gridguard_incident_reports";

export const GRIDGUARD_TOTAL_BUDGET = 450000;

const seedReports: IncidentReport[] = [
  {
    id: "GG-1021",
    createdAt: "2026-04-23T10:20:00.000Z",
    locationText: "Jalan Harmoni, Section 9",
    description: "Large pothole with standing water causing lane weaving.",
    latitude: 3.1014,
    longitude: 101.6542,
    triage: {
      level: "High Risk",
      routeImpact: "Partial Lane Impact",
      hazardType: "Infrastructure Damage",
      confidence: 83,
      recommendation: "Assign road patch team within 6 hours and place warning cones immediately.",
      aiSuggestedBudget: 12000,
    },
    aiSuggestedBudget: 12000,
    budgetStatus: "Approved",
  },
  {
    id: "GG-1022",
    createdAt: "2026-04-24T01:15:00.000Z",
    locationText: "Jalan Permai, KM 2",
    description: "Fallen tree branch blocking one side of carriageway.",
    latitude: 3.1435,
    longitude: 101.7012,
    triage: {
      level: "Emergency",
      routeImpact: "Full Blockade",
      hazardType: "Public Safety",
      confidence: 91,
      recommendation: "Deploy emergency clearance crew and coordinate temporary traffic rerouting.",
      aiSuggestedBudget: 28000,
    },
    aiSuggestedBudget: 28000,
    budgetStatus: "Pending",
  },
];

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readReportsFromStorage(): IncidentReport[] {
  if (!canUseStorage()) {
    return seedReports;
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedReports));
    return seedReports;
  }

  try {
    const parsed = JSON.parse(raw) as IncidentReport[];
    return Array.isArray(parsed) ? parsed : seedReports;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedReports));
    return seedReports;
  }
}

function writeReportsToStorage(reports: IncidentReport[]) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getIncidentReports(): IncidentReport[] {
  return readReportsFromStorage().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function addIncidentReport(input: CreateIncidentInput): IncidentReport {
  const reports = readReportsFromStorage();
  const nextReport: IncidentReport = {
    id: `GG-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    locationText: input.locationText,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    triage: input.triage,
    aiSuggestedBudget: input.triage.aiSuggestedBudget,
    budgetStatus: "Pending",
  };

  reports.push(nextReport);
  writeReportsToStorage(reports);
  return nextReport;
}

export function updateBudgetStatus(reportId: string, nextStatus: BudgetStatus): IncidentReport[] {
  const reports = readReportsFromStorage();
  const nextReports = reports.map((report) =>
    report.id === reportId ? { ...report, budgetStatus: nextStatus } : report,
  );

  writeReportsToStorage(nextReports);
  return nextReports;
}

export function getBudgetOverview(reports: IncidentReport[]) {
  const aiProposed = reports.reduce((sum, report) => sum + report.aiSuggestedBudget, 0);
  const approved = reports
    .filter((report) => report.budgetStatus === "Approved")
    .reduce((sum, report) => sum + report.aiSuggestedBudget, 0);

  return {
    total: GRIDGUARD_TOTAL_BUDGET,
    aiProposed,
    approved,
    remaining: GRIDGUARD_TOTAL_BUDGET - approved,
  };
}
