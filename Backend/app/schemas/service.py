from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.service import ServiceStatus


# --- Category ---

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# --- Service ---

class ServiceBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: Decimal = Field(gt=0)
    location: Optional[str] = None
    category_id: int


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    location: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[ServiceStatus] = None


class ServiceRead(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider_id: int
    status: ServiceStatus
    created_at: datetime
    updated_at: datetime


class ServiceReadWithDetails(ServiceRead):
    """Used for service detail pages - includes provider name and avg rating."""
    provider_name: Optional[str] = None
    average_rating: Optional[float] = None
    review_count: int = 0