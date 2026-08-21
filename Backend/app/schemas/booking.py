from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.booking import BookingStatus


class BookingBase(BaseModel):
    service_id: int
    booking_date: datetime
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingRead(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    status: BookingStatus
    created_at: datetime
    updated_at: datetime