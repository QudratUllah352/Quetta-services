from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.models.service import Service, ServiceStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingStatusUpdate, BookingRead
from app.auth.dependencies import get_current_user, require_customer

router = APIRouter(prefix="/bookings", tags=["bookings"])


# Which status transitions are legal, and who's allowed to make them.
# (from_status -> {to_status: {allowed roles}})
ALLOWED_TRANSITIONS = {
    BookingStatus.pending: {
        BookingStatus.confirmed: {UserRole.provider},
        BookingStatus.cancelled: {UserRole.provider, UserRole.customer},
    },
    BookingStatus.confirmed: {
        BookingStatus.completed: {UserRole.provider},
        BookingStatus.cancelled: {UserRole.provider, UserRole.customer},
    },
    # completed and cancelled are terminal - no further transitions
}


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = db.get(Service, payload.service_id)
    if not service or service.status != ServiceStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This service is not available for booking.",
        )

    booking = Booking(
        customer_id=current_user.id,  # from token, never trust a client-supplied customer_id
        service_id=payload.service_id,
        booking_date=payload.booking_date,
        notes=payload.notes,
        status=BookingStatus.pending,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/my", response_model=list[BookingRead])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Customer's own booking history."""
    bookings = db.execute(
        select(Booking)
        .where(Booking.customer_id == current_user.id)
        .order_by(Booking.created_at.desc())
    ).scalars().all()
    return bookings


@router.get("/provider", response_model=list[BookingRead])
def provider_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bookings for services owned by the current provider."""
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Provider access only.")

    bookings = db.execute(
        select(Booking)
        .join(Service, Booking.service_id == Service.id)
        .where(Service.provider_id == current_user.id)
        .order_by(Booking.created_at.desc())
    ).scalars().all()
    return bookings


@router.patch("/{booking_id}/status", response_model=BookingRead)
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    is_owner_customer = current_user.role == UserRole.customer and booking.customer_id == current_user.id
    is_owner_provider = current_user.role == UserRole.provider and booking.service.provider_id == current_user.id

    if not (is_owner_customer or is_owner_provider):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this booking.",
        )

    transitions = ALLOWED_TRANSITIONS.get(booking.status, {})
    allowed_roles = transitions.get(payload.status)

    if allowed_roles is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move booking from '{booking.status.value}' to '{payload.status.value}'.",
        )
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {', '.join(r.value for r in allowed_roles)} can make this change.",
        )

    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    return booking