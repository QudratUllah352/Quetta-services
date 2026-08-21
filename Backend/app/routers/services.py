from typing import Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.service import Service, ServiceStatus, Category
from app.models.review import Review
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceRead, ServiceReadWithDetails, CategoryRead
from app.auth.dependencies import get_current_user, require_provider

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return db.execute(select(Category).order_by(Category.name)).scalars().all()


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
    # Average rating + review count per service, computed from the reviews
    # table rather than trusting any client-supplied value (Section 20).
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
    return db.execute(
        select(Service)
        .where(Service.provider_id == current_user.id)
        .order_by(Service.created_at.desc())
    ).scalars().all()


@router.get("/{service_id}", response_model=ServiceReadWithDetails)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    rating_row = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.service_id == service_id)
    ).first()
    avg_rating, review_count = rating_row

    item = ServiceReadWithDetails.model_validate(service)
    item.provider_name = service.provider.name
    item.average_rating = round(float(avg_rating), 2) if avg_rating is not None else None
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category does not exist.")

    service = Service(
        provider_id=current_user.id,  # taken from the token, never trust a client-supplied provider_id
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found.")

    if service.provider_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only deactivate your own services.",
        )

    service.status = ServiceStatus.inactive
    db.commit()
    db.refresh(service)
    return service