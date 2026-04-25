"""Vision preprocessing output from multimodal image analysis."""

from pydantic import BaseModel, Field


class VisionOutput(BaseModel):
    """Structured output from Ilmu multimodal API image analysis.
    
    This model captures the AI's understanding of the image and converts it
    to structured incident information before entering the workflow.
    """

    generated_title: str = Field(
        min_length=3,
        max_length=180,
        description="AI-generated incident title based on image analysis",
    )
    generated_description: str = Field(
        min_length=10,
        max_length=2000,
        description="AI-generated detailed description of the incident",
    )
    hazard_category_hint: str = Field(
        description="Suggested hazard category: ROAD_PAVEMENT, UTILITY_POWER, WATER_SEWAGE, VEGETATION, or LIGHTING",
    )
    risk_level_hint: str = Field(
        description="Suggested risk level: LOW, MEDIUM, HIGH, or CRITICAL",
    )
    detected_objects: list[str] = Field(
        default_factory=list,
        description="List of detected objects/hazards in the image",
    )
    confidence_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score of the analysis (0.0 to 1.0)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "generated_title": "Pothole in Main Street",
                "generated_description": "Large pothole on Main Street causing traffic hazard. Approximately 6 inches deep.",
                "hazard_category_hint": "ROAD_PAVEMENT",
                "risk_level_hint": "HIGH",
                "detected_objects": ["pothole", "asphalt", "vehicle"],
                "confidence_score": 0.92,
            }
        }
