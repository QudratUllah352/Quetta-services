from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.availability import ProviderSchedule
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.service import Service, ServiceStatus
from app.models.user import User, UserRole, VerificationStatus
from app.schemas.provider import ProviderProfileUpdate, ProviderPublicProfile
from app.schemas.user import Token, UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


class VerificationSubmission(BaseModel):
    cnic_number: str = Field(
        ...,
        min_length=13,
        max_length=15,
        description="CNIC formatted e.g. 54400-1234567-1 or 13 digits",
    )
    document_url: str = Field(
        ..., description="Direct link or uploaded URL of CNIC / Certification image"
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Automatically initialize verification status based on chosen role
    initial_verification = (
        VerificationStatus.unsubmitted
        if payload.role == UserRole.provider
        else VerificationStatus.verified
    )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        phone=payload.phone,
        location=payload.location,
        verification_status=initial_verification,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()

    # Same error for "no such user" and "wrong password" -
    # don't leak which one it was.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    # Encode role and current verification status into token claims
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value,
            "verification_status": (
                user.verification_status.value
                if hasattr(user.verification_status, "value")
                else str(user.verification_status)
            ),
        }
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """The logged-in user's own profile - used by dashboards to show
    name/email/phone/location/verification_status without re-decoding the JWT."""
    return current_user


@router.post("/provider/verify", response_model=UserRead)
def submit_provider_verification(
    payload: VerificationSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allows authenticated service providers to submit their CNIC and documents for admin review."""
    if current_user.role != UserRole.provider:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only service providers can submit verification documents.",
        )

    current_user.cnic_number = payload.cnic_number
    current_user.document_url = payload.document_url
    current_user.verification_status = VerificationStatus.pending
    current_user.rejection_reason = None

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/provider/profile/me", response_model=UserRead)
def update_my_provider_profile(
    payload: ProviderProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allows logged-in providers to manually update their public storefront profile."""
    if current_user.role != UserRole.provider:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can edit their business profile.",
        )

    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.phone_whatsapp is not None:
        current_user.phone_whatsapp = payload.phone_whatsapp
    if payload.years_experience is not None:
        current_user.years_experience = payload.years_experience
    if payload.location_area is not None:
        current_user.location_area = payload.location_area
    if payload.response_time_str is not None:
        current_user.response_time_str = payload.response_time_str
    if payload.profile_picture is not None:
        current_user.profile_picture = payload.profile_picture

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/provider-profile/{provider_id}", response_model=ProviderPublicProfile)
def get_public_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    provider = db.get(User, provider_id)
    if not provider or provider.role != UserRole.provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found.",
        )

    # 1. Fetch active services
    services = (
        db.execute(
            select(Service).where(
                and_(
                    Service.provider_id == provider_id,
                    Service.status == ServiceStatus.active,
                )
            )
        )
        .scalars()
        .all()
    )

    # 2. Count completed jobs
    completed_jobs = (
        db.execute(
            select(func.count(Booking.id))
            .join(Service, Booking.service_id == Service.id)
            .where(
                and_(
                    Service.provider_id == provider_id,
                    Booking.status == BookingStatus.completed,
                )
            )
        ).scalar()
        or 0
    )

    # 3. Fetch reviews & compute rating
    reviews = (
        db.execute(
            select(Review)
            .join(Service, Review.service_id == Service.id)
            .where(Service.provider_id == provider_id)
            .order_by(Review.created_at.desc())
        )
        .scalars()
        .all()
    )

    avg_rating = 5.0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

    # 4. Fetch working schedule
    schedules = (
        db.execute(
            select(ProviderSchedule).where(ProviderSchedule.provider_id == provider_id)
        )
        .scalars()
        .all()
    )

    working_hours = [
        {
            "day_of_week": s.day_of_week,
            "is_active": s.is_active,
            "start_time": (
                s.start_time.strftime("%H:%M")
                if hasattr(s.start_time, "strftime")
                else str(s.start_time)
            ),
            "end_time": (
                s.end_time.strftime("%H:%M")
                if hasattr(s.end_time, "strftime")
                else str(s.end_time)
            ),
        }
        for s in schedules
    ]

    return {
        "id": provider.id,
        "name": provider.name,
        "profile_picture": provider.profile_picture,
        "verification_status": (
            provider.verification_status.value
            if hasattr(provider.verification_status, "value")
            else str(provider.verification_status)
        ),
        "bio": (
            provider.bio
            or "Certified professional offering quality maintenance and on-demand local services in Quetta."
        ),
        "location_area": provider.location_area or "Quetta",
        "phone_whatsapp": provider.phone_whatsapp,
        "years_experience": provider.years_experience or 2,
        "response_time_str": (
            provider.response_time_str or "Usually responds within 30 minutes"
        ),
        "average_rating": avg_rating,
        "total_reviews": len(reviews),
        "completed_jobs_count": completed_jobs,
        "services": services,
        "reviews": reviews,
        "working_hours": working_hours,
    }