from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.service import Service, ServiceStatus
from app.models.favorite import Favorite
from app.schemas.service import ServiceRead
from app.auth.dependencies import require_customer

router = APIRouter(prefix="/favorites", tags=["favorites"])


# 1. Get all saved services for current customer
@router.get("", response_model=List[ServiceRead])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    services = (
        db.execute(
            select(Service)
            .join(Favorite, Favorite.service_id == Service.id)
            .where(
                and_(
                    Favorite.customer_id == current_user.id,
                    Service.status == ServiceStatus.active,
                )
            )
            .order_by(Favorite.created_at.desc())
        )
        .scalars()
        .all()
    )
    return services


# 2. Get list of favorite service IDs (for fast heart toggle state on cards)
@router.get("/ids", response_model=List[int])
def get_my_favorite_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    favorite_ids = db.execute(
        select(Favorite.service_id).where(Favorite.customer_id == current_user.id)
    ).scalars().all()
    return list(favorite_ids)


# 3. Toggle favorite (Save / Unsave)
@router.post("/toggle/{service_id}")
def toggle_favorite(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service listing not found.",
        )

    existing = db.execute(
        select(Favorite).where(
            and_(
                Favorite.customer_id == current_user.id,
                Favorite.service_id == service_id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        db.delete(existing)
        db.commit()
        return {"service_id": service_id, "is_favorite": False, "message": "Removed from favorites."}

    new_fav = Favorite(customer_id=current_user.id, service_id=service_id)
    db.add(new_fav)
    db.commit()
    return {"service_id": service_id, "is_favorite": True, "message": "Added to favorites."}