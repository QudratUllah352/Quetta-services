from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewRead
from app.auth.dependencies import require_customer

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    booking = db.get(Booking, payload.booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    # Only the customer who made the booking can review it (Section 20:
    # "a customer should review only a service they actually booked").
    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review your own bookings.",
        )

    # Only after the service is marked completed.
    if booking.status != BookingStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only review a booking after the service is completed.",
        )

    # One review per booking - the DB has a UNIQUE constraint on booking_id
    # as a backstop, but check first here to return a clean error message
    # instead of a raw integrity-error 500.
    existing = db.execute(
        select(Review).where(Review.booking_id == payload.booking_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this booking.",
        )

    review = Review(
        customer_id=current_user.id,
        service_id=booking.service_id,
        booking_id=booking.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/service/{service_id}", response_model=list[ReviewRead])
def list_service_reviews(service_id: int, db: Session = Depends(get_db)):
    reviews = db.execute(
        select(Review)
        .where(Review.service_id == service_id)
        .order_by(Review.created_at.desc())
    ).scalars().all()
    return reviews