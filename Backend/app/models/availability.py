from sqlalchemy import Column, Integer, String, Time, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class ProviderSchedule(Base):
    __tablename__ = "provider_schedules"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    day_of_week = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    start_time = Column(Time, nullable=False)  # e.g., 09:00:00
    end_time = Column(Time, nullable=False)    # e.g., 17:00:00
    slot_duration_minutes = Column(Integer, default=60, nullable=False)  # e.g., 60 mins per slot

    provider = relationship("User", backref="schedules")

    __table_args__ = (
        UniqueConstraint("provider_id", "day_of_week", name="uix_provider_day"),
    )