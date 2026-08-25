from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.service import ServiceRead
from app.schemas.review import ReviewRead


class ProviderPublicProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    profile_picture: Optional[str] = None
    verification_status: str
    bio: Optional[str] = None
    location_area: Optional[str] = "Quetta"
    phone_whatsapp: Optional[str] = None
    years_experience: int = 1
    response_time_str: str = "Usually responds within 30 minutes"
    
    # Aggregated Real-time Stats
    average_rating: float = 5.0
    total_reviews: int = 0
    completed_jobs_count: int = 0
    
    # Nested Relations
    services: List[ServiceRead] = []
    reviews: List[ReviewRead] = []
    working_hours: List[dict] = []