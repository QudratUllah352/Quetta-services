from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    booking_id: int


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    service_id: int
    booking_id: int
    created_at: datetime