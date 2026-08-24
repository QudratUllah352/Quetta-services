from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole, VerificationStatus
from app.models.service import Service, ServiceStatus, Category
from app.models.booking import Booking
from app.models.review import Review
from app.models.report import Report, ReportStatus, ReportTargetType
from app.schemas.user import UserRead
from app.schemas.service import ServiceRead, CategoryCreate, CategoryRead
from app.schemas.booking import BookingRead
from app.schemas.report import ReportRead
from app.auth.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


class VerificationDecision(BaseModel):
    status: VerificationStatus  # 'verified' or 'rejected'
    rejection_reason: Optional[str] = None


# --- Users & Verification Moderation ---

@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.execute(select(User).order_by(User.created_at.desc())).scalars().all()


@router.get("/verifications", response_model=list[UserRead])
def list_pending_verifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Returns all service providers who have submitted documents and are awaiting verification."""
    return (
        db.execute(
            select(User)
            .where(
                User.role == UserRole.provider,
                User.verification_status == VerificationStatus.pending,
            )
            .order_by(User.created_at.desc())
        )
        .scalars()
        .all()
    )


@router.patch("/verifications/{user_id}", response_model=UserRead)
def review_provider_verification(
    user_id: int,
    decision: VerificationDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Approves or rejects a service provider's verification documents."""
    user = db.get(User, user_id)
    if not user or user.role != UserRole.provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found.",
        )

    if decision.status not in [VerificationStatus.verified, VerificationStatus.rejected]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification status must be either 'verified' or 'rejected'.",
        )

    user.verification_status = decision.status
    if decision.status == VerificationStatus.rejected:
        user.rejection_reason = decision.rejection_reason or "Document verification criteria not met."
    else:
        user.rejection_reason = None

    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserRead)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own admin account.",
        )
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/activate", response_model=UserRead)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


# --- Services (moderation) ---

@router.get("/services", response_model=list[ServiceRead])
def list_all_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Includes inactive listings, unlike the public /services endpoint."""
    return db.execute(select(Service).order_by(Service.created_at.desc())).scalars().all()


@router.patch("/services/{service_id}/deactivate", response_model=ServiceRead)
def admin_deactivate_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin moderation - unlike the provider's own deactivate endpoint,
    this doesn't check ownership."""
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")
    service.status = ServiceStatus.inactive
    db.commit()
    db.refresh(service)
    return service


# --- Bookings ---

@router.get("/bookings", response_model=list[BookingRead])
def list_all_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.execute(select(Booking).order_by(Booking.created_at.desc())).scalars().all()


# --- Categories ---

@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.execute(
        select(Category).where(Category.name == payload.name)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists.",
        )
    category = Category(name=payload.name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# --- Reports (moderation queue) ---

@router.get("/reports", response_model=list[ReportRead])
def list_reports(
    status_filter: ReportStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = select(Report).order_by(Report.created_at.desc())
    if status_filter:
        query = query.where(Report.status == status_filter)
    return db.execute(query).scalars().all()


def _resolve_report_status(
    report_id: int,
    new_status: ReportStatus,
    db: Session,
) -> Report:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if report.status != ReportStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This report has already been {report.status.value}.",
        )
    report.status = new_status
    report.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return report


@router.patch("/reports/{report_id}/resolve", response_model=ReportRead)
def resolve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _resolve_report_status(report_id, ReportStatus.resolved, db)


@router.patch("/reports/{report_id}/dismiss", response_model=ReportRead)
def dismiss_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _resolve_report_status(report_id, ReportStatus.dismissed, db)