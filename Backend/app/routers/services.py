from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_provider
from app.database import get_db
from app.models.availability import ProviderSchedule
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.service import Category, Service, ServiceStatus
from app.models.user import User, UserRole
from app.schemas.provider import ProviderPublicProfile
from app.schemas.service import (
    CategoryRead,
    ServiceCreate,
    ServiceRead,
    ServiceReadWithDetails,
    ServiceUpdate,
)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return db.execute(select(Category).order_by(Category.name)).scalars().all()


@router.get("/provider-profile/{provider_id}", response_model=ProviderPublicProfile)
def get_public_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    provider = db.get(User, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {provider_id} does not exist.",
        )

    # Check if role matches
    role_val = (
        provider.role.value
        if hasattr(provider.role, "value")
        else str(provider.role)
    )
    if role_val != "provider":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {provider_id} is a {role_val}, not a service provider.",
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

    verif_val = (
        provider.verification_status.value
        if hasattr(provider.verification_status, "value")
        else str(provider.verification_status)
    )

    return {
        "id": provider.id,
        "name": provider.name,
        "profile_picture": getattr(provider, "profile_picture", None),
        "verification_status": verif_val,
        "bio": (
            getattr(provider, "bio", None)
            or "Certified professional offering quality maintenance and on-demand local services in Quetta."
        ),
        "location_area": getattr(provider, "location_area", None) or "Quetta",
        "phone_whatsapp": getattr(provider, "phone_whatsapp", None),
        "years_experience": getattr(provider, "years_experience", 1) or 1,
        "response_time_str": (
            getattr(
                provider,
                "response_time_str",
                "Usually responds within 30 minutes",
            )
            or "Usually responds within 30 minutes"
        ),
        "average_rating": avg_rating,
        "total_reviews": len(reviews),
        "completed_jobs_count": completed_jobs,
        "services": services,
        "reviews": reviews,
        "working_hours": working_hours,
    }


@router.get("", response_model=list[ServiceReadWithDetails])
def list_services(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    location: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    min_rating: Optional[float] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rating_subq = (
        select(
            Review.service_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.service_id)
        .subquery()
    )

    query = (
        select(Service, User.name, rating_subq.c.avg_rating, rating_subq.c.review_count)
        .join(User, Service.provider_id == User.id)
        .outerjoin(rating_subq, Service.id == rating_subq.c.service_id)
        .where(Service.status == ServiceStatus.active)
    )

    if search:
        like = f"%{search}%"
        query = query.where(Service.title.ilike(like) | Service.description.ilike(like))
    if category_id:
        query = query.where(Service.category_id == category_id)
    if location:
        query = query.where(Service.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.where(Service.price >= min_price)
    if max_price is not None:
        query = query.where(Service.price <= max_price)
    if min_rating is not None:
        query = query.where(rating_subq.c.avg_rating >= min_rating)

    query = query.order_by(Service.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = db.execute(query).all()

    results = []
    for service, provider_name, avg_rating, review_count in rows:
        item = ServiceReadWithDetails.model_validate(service)
        item.provider_name = provider_name
        item.average_rating = round(float(avg_rating), 2) if avg_rating is not None else None
        item.review_count = review_count or 0
        results.append(item)
    return results


@router.get("/mine", response_model=list[ServiceRead])
def list_my_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    """Provider's own listings, including inactive ones - unlike the public
    GET /services, which only shows active listings to shoppers."""
    return (
        db.execute(
            select(Service)
            .where(Service.provider_id == current_user.id)
            .order_by(Service.created_at.desc())
        )
        .scalars()
        .all()
    )


@router.get("/{service_id}", response_model=ServiceReadWithDetails)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found."
        )

    rating_row = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.service_id == service_id
        )
    ).first()
    avg_rating, review_count = rating_row

    item = ServiceReadWithDetails.model_validate(service)
    item.provider_name = service.provider.name
    item.average_rating = (
        round(float(avg_rating), 2) if avg_rating is not None else None
    )
    item.review_count = review_count or 0
    return item


@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    category = db.get(Category, payload.category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category does not exist.",
        )

    service = Service(
        provider_id=current_user.id,
        category_id=payload.category_id,
        title=payload.title,
        description=payload.description,
        price=payload.price,
        location=payload.location,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found."
        )

    if service.provider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own services.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service


@router.patch("/{service_id}/deactivate", response_model=ServiceRead)
def deactivate_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found."
        )

    if service.provider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only deactivate your own services.",
        )

    service.status = ServiceStatus.inactive
    db.commit()
    db.refresh(service)
    return service