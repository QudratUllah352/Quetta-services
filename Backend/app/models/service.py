import enum
from sqlalchemy import Column, Integer, String, Text, Numeric, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ServiceStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    location = Column(String(150), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    provider = relationship("User")
    category = relationship("Category")