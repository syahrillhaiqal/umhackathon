from app.core.enums import HazardCategory
from app.models.contractor import Contractor


_MOCK_CONTRACTORS: list[Contractor] = [
    Contractor(
        contractor_id="ctr-road-01",
        name="PaveFix Works",
        category=HazardCategory.ROAD_PAVEMENT,
        distance_km=2.5,
        available=False,
        eta_minutes=35,
        hourly_rate=250.0,
    ),
    Contractor(
        contractor_id="ctr-road-02",
        name="Metro Asphalt Services",
        category=HazardCategory.ROAD_PAVEMENT,
        distance_km=4.2,
        available=True,
        eta_minutes=50,
        hourly_rate=210.0,
    ),
    Contractor(
        contractor_id="ctr-power-01",
        name="Grid Response Sdn Bhd",
        category=HazardCategory.UTILITY_POWER,
        distance_km=3.0,
        available=True,
        eta_minutes=30,
        hourly_rate=320.0,
    ),
    Contractor(
        contractor_id="ctr-water-01",
        name="HydroFlow Civil",
        category=HazardCategory.WATER_SEWAGE,
        distance_km=5.1,
        available=False,
        eta_minutes=70,
        hourly_rate=280.0,
    ),
    Contractor(
        contractor_id="ctr-water-02",
        name="Aqua Utility Rapid",
        category=HazardCategory.WATER_SEWAGE,
        distance_km=7.3,
        available=True,
        eta_minutes=85,
        hourly_rate=260.0,
    ),
    Contractor(
        contractor_id="ctr-green-01",
        name="GreenCut Municipal",
        category=HazardCategory.VEGETATION,
        distance_km=1.8,
        available=True,
        eta_minutes=20,
        hourly_rate=140.0,
    ),
    Contractor(
        contractor_id="ctr-light-01",
        name="Lumina Street Ops",
        category=HazardCategory.LIGHTING,
        distance_km=2.0,
        available=False,
        eta_minutes=28,
        hourly_rate=180.0,
    ),
    Contractor(
        contractor_id="ctr-light-02",
        name="BrightGrid Services",
        category=HazardCategory.LIGHTING,
        distance_km=6.0,
        available=True,
        eta_minutes=55,
        hourly_rate=165.0,
    ),
]


def find_contractors(category: HazardCategory, location: str) -> list[Contractor]:
    del location
    matches = [item for item in _MOCK_CONTRACTORS if item.category == category]
    return sorted(matches, key=lambda item: item.distance_km)
