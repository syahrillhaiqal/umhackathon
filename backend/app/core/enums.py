from enum import Enum


class HazardCategory(str, Enum):
    ROAD_PAVEMENT = "ROAD_PAVEMENT"
    UTILITY_POWER = "UTILITY_POWER"
    WATER_SEWAGE = "WATER_SEWAGE"
    VEGETATION = "VEGETATION"
    LIGHTING = "LIGHTING"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ResolutionStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    HUMAN_ESCALATION = "HUMAN_ESCALATION"
    FAILED = "FAILED"


class ReasoningDecisionType(str, Enum):
    TRANSFER_FUNDS = "TRANSFER_FUNDS"
    CONTINUE = "CONTINUE"
    ESCALATE = "ESCALATE"
