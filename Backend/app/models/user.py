import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    provider = "provider"
    admin = "admin"


class VerificationStatus(str, enum.Enum):
    unsubmitted = "unsubmitted"
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    location = Column(String(150), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    is_active = Column(Boolean, default=True)

    # Provider & Profile Details
    profile_picture = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    phone_whatsapp = Column(String(30), nullable=True)
    years_experience = Column(Integer, default=1)
    response_time_str = Column(String(60), default="Usually responds within 30 minutes")
    location_area = Column(String(100), default="Quetta")

    # Provider Verification Columns
    verification_status = Column(
        Enum(VerificationStatus),
        default=VerificationStatus.unsubmitted,
        nullable=False,
    )
    cnic_number = Column(String(50), nullable=True)
    document_url = Column(String(500), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)