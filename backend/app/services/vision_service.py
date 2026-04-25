"""Vision preprocessing service using Ilmu multimodal API."""

import base64
import json
import logging
from typing import Any

import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.models.vision_output import VisionOutput

logger = logging.getLogger(__name__)


class IlmuVisionService:
    """Service for analyzing images using Ilmu multimodal API.
    
    Handles:
    - Image preprocessing (URL or base64)
    - API calls to Ilmu endpoint
    - Response parsing and validation
    - Error handling and retries
    - Fallback when API unavailable
    """

    def __init__(self, settings: Settings):
        """Initialize vision service.
        
        Args:
            settings: Application configuration with Ilmu API credentials
        """
        self._settings = settings
        self._timeout = 30.0  # seconds

    async def analyze_image(
        self,
        image_input: str,
        title: str | None = None,
        description: str | None = None,
    ) -> VisionOutput | None:
        """Analyze image and extract structured incident information.
        
        Args:
            image_input: Either image URL or base64-encoded image
            title: Optional user-provided title (helps guide analysis)
            description: Optional user-provided description
            
        Returns:
            VisionOutput with structured incident info, or None if analysis fails
        """
        if not self._settings.ilmu_api_key or not self._settings.ilmu_base_url:
            logger.debug("Ilmu API not configured. Skipping vision preprocessing.")
            return None

        try:
            image_data = self._prepare_image(image_input)
            payload = self._build_payload(image_data, title, description)
            response = await self._call_ilmu_api(payload)
            vision_output = self._parse_response(response)
            
            logger.info(
                f"Vision analysis complete. Category hint: {vision_output.hazard_category_hint}, "
                f"Risk: {vision_output.risk_level_hint}, Confidence: {vision_output.confidence_score:.2f}"
            )
            return vision_output
        except Exception as e:
            logger.error(f"Vision preprocessing failed: {e}", exc_info=True)
            return None

    def _prepare_image(self, image_input: str) -> dict[str, Any]:
        """Convert image input (URL or base64) to format for API.
        
        Args:
            image_input: URL or base64 string
            
        Returns:
            Dictionary with image source and data
        """
        if image_input.startswith(("http://", "https://")):
            # URL-based image
            return {"type": "url", "url": image_input}
        elif image_input.startswith("data:image/"):
            # Data URL format
            return {"type": "url", "url": image_input}
        else:
            # Assume base64 encoded
            return {"type": "base64", "data": image_input}

    def _build_payload(
        self,
        image_data: dict[str, Any],
        title: str | None = None,
        description: str | None = None,
    ) -> dict[str, Any]:
        """Build request payload for Ilmu API.
        
        Args:
            image_data: Prepared image data
            title: Optional title
            description: Optional description
            
        Returns:
            API request payload
        """
        prompt_parts = [
            "Analyze this image of a municipal hazard or infrastructure issue. "
            "Extract the following structured information:\n\n"
            "1. A clear, concise title (max 180 characters)\n"
            "2. A detailed description of what you see (max 2000 characters)\n"
            "3. The most likely hazard category from: ROAD_PAVEMENT, UTILITY_POWER, WATER_SEWAGE, VEGETATION, LIGHTING\n"
            "4. Risk level assessment: LOW, MEDIUM, HIGH, or CRITICAL\n"
            "5. List of detected objects/hazards\n"
            "6. Confidence score for this analysis (0.0 to 1.0)\n\n"
            "Return as valid JSON only, no markdown or explanation."
        ]

        if title:
            prompt_parts.append(f"\nUser-provided title: {title}")
        if description:
            prompt_parts.append(f"User-provided description: {description}")

        prompt_parts.append(
            "\nReturn valid JSON with these exact keys: "
            "generated_title, generated_description, hazard_category_hint, "
            "risk_level_hint, detected_objects (array), confidence_score"
        )

        return {
            "model": self._settings.ilmu_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image_data},
                        {"type": "text", "text": "\n".join(prompt_parts)},
                    ],
                }
            ],
            "temperature": 0,  # Deterministic for audit trail
        }

    async def _call_ilmu_api(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Make HTTP call to Ilmu API.
        
        Args:
            payload: Request payload
            
        Returns:
            Parsed API response
            
        Raises:
            httpx.RequestError: If API call fails
            json.JSONDecodeError: If response is invalid JSON
        """
        headers = {
            "Authorization": f"Bearer {self._settings.ilmu_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                url=self._settings.ilmu_base_url,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()

    def _parse_response(self, response: dict[str, Any]) -> VisionOutput:
        """Extract and validate VisionOutput from API response.
        
        Args:
            response: Raw API response
            
        Returns:
            Validated VisionOutput
            
        Raises:
            ValidationError: If response doesn't match schema
            KeyError: If expected fields missing
            json.JSONDecodeError: If response content is not valid JSON
        """
        # Ilmu returns response in format: {"choices": [{"message": {"content": "..."}}]}
        content = response["choices"][0]["message"]["content"]

        # Parse JSON content from response
        # Some APIs might wrap in markdown code blocks
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()

        parsed = json.loads(json_str)
        return VisionOutput.model_validate(parsed)


class VisionServiceFactory:
    """Factory for creating vision service instances."""

    @staticmethod
    def create(settings: Settings) -> IlmuVisionService:
        """Create vision service instance.
        
        Args:
            settings: Application configuration
            
        Returns:
            IlmuVisionService instance
        """
        return IlmuVisionService(settings)
