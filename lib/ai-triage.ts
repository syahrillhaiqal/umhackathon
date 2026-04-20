export type TriageLevel = "Emergency" | "High Risk" | "Monitor";

export type RouteImpact = "Full Blockade" | "Partial Lane Impact" | "Passable";

export type HazardType = "Public Safety" | "Traffic Congestion" | "Infrastructure Damage";

export interface TriageInput {
  location: string;
  description: string;
  imageSize: number;
}

export interface TriageResult {
  level: TriageLevel;
  routeImpact: RouteImpact;
  hazardType: HazardType;
  confidence: number;
  recommendation: string;
}

function normalizeScore(seedText: string): number {
  let hash = 0;

  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash % 100);
}

export function generateDummyTriage(input: TriageInput): TriageResult {
  const combinedSignal = `${input.location}|${input.description}|${input.imageSize}`.toLowerCase();
  const score = normalizeScore(combinedSignal);
  const highSignalWords = /(tree|fallen|blocked|accident|injury|fire|landslide|flood|sinkhole)/;
  const mediumSignalWords = /(pothole|hole|debris|jam|congestion|damaged sign|light)/;

  const strongContext = highSignalWords.test(combinedSignal);
  const mediumContext = mediumSignalWords.test(combinedSignal);

  if (strongContext || score > 72) {
    return {
      level: "Emergency",
      routeImpact: score % 2 === 0 ? "Full Blockade" : "Partial Lane Impact",
      hazardType: "Public Safety",
      confidence: 82 + (score % 14),
      recommendation:
        "Dispatch rapid response team and request immediate manual verification from district operations.",
    };
  }

  if (mediumContext || score > 42) {
    return {
      level: "High Risk",
      routeImpact: "Partial Lane Impact",
      hazardType: "Infrastructure Damage",
      confidence: 71 + (score % 15),
      recommendation:
        "Queue municipal maintenance crew and monitor nearby traffic flow for escalation signs.",
    };
  }

  return {
    level: "Monitor",
    routeImpact: "Passable",
    hazardType: "Traffic Congestion",
    confidence: 65 + (score % 18),
    recommendation:
      "Keep in monitoring list and schedule normal inspection if no further citizen reports are received.",
  };
}
