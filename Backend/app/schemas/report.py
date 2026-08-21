from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.report import ReportTargetType, ReportStatus


class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: int
    reason: str = Field(min_length=5, max_length=1000)


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: int
    target_type: ReportTargetType
    target_id: int
    reason: str
    status: ReportStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None