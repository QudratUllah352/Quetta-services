from pydantic import BaseModel
from typing import Optional


class ProviderProfileUpdate(BaseModel):
    bio: Optional[str] = None
    phone_whatsapp: Optional[str] = None
    years_experience: Optional[int] = 1
    location_area: Optional[str] = "Quetta"
    response_time_str: Optional[str] = "Usually responds within 30 minutes"
    profile_picture: Optional[str] = None