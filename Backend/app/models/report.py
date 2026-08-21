import enum
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ReportTargetType(str, enum.Enum):
    service = "service"
    review = "review"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    resolved = "resolved"
    dismissed = "dismissed"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(Enum(ReportTargetType), nullable=False)
    # No FK here on purpose - target_type determines which table target_id
    # points into (services.id or reviews.id), so a single FK isn't possible.
    # The content itself may also get deleted later; the report should still
    # be readable as a historical record.
    target_id = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.pending)
    created_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(TIMESTAMP, nullable=True)

    reporter = relationship("User")