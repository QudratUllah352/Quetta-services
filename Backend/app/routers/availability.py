from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, date, time, timedelta
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User, UserRole
from app.models.availability import ProviderSchedule
from app.models.service import Service
from app.models.booking import Booking
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/availability", tags=["availability"])


class ScheduleDayItem(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    is_active: bool
    start_time: str  # "09:00"
    end_time: str    # "17:00"
    slot_duration_minutes: int = 60


class ScheduleBulkUpdate(BaseModel):
    schedules: List[ScheduleDayItem]


# 1. Provider fetches their configured weekly schedule
@router.get("/my-schedule", response_model=List[ScheduleDayItem])
def get_my_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers have working schedules.")
    
    records = db.execute(
        select(ProviderSchedule).where(ProviderSchedule.provider_id == current_user.id)
    ).scalars().all()

    return [
        ScheduleDayItem(
            day_of_week=r.day_of_week,
            is_active=r.is_active,
            start_time=r.start_time.strftime("%H:%M"),
            end_time=r.end_time.strftime("%H:%M"),
            slot_duration_minutes=r.slot_duration_minutes,
        )
        for r in records
    ]


# 2. Provider updates their weekly schedule
@router.post("/my-schedule")
def save_my_schedule(
    payload: ScheduleBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.provider:
        raise HTTPException(status_code=403, detail="Only providers can configure schedules.")

    for item in payload.schedules:
        st_parts = [int(p) for p in item.start_time.split(":")]
        et_parts = [int(p) for p in item.end_time.split(":")]
        
        st = time(st_parts[0], st_parts[1])
        et = time(et_parts[0], et_parts[1])

        existing = db.execute(
            select(ProviderSchedule).where(
                and_(
                    ProviderSchedule.provider_id == current_user.id,
                    ProviderSchedule.day_of_week == item.day_of_week,
                )
            )
        ).scalar_one_or_none()

        if existing:
            existing.is_active = item.is_active
            existing.start_time = st
            existing.end_time = et
            existing.slot_duration_minutes = item.slot_duration_minutes
        else:
            db.add(
                ProviderSchedule(
                    provider_id=current_user.id,
                    day_of_week=item.day_of_week,
                    is_active=item.is_active,
                    start_time=st,
                    end_time=et,
                    slot_duration_minutes=item.slot_duration_minutes,
                )
            )

    db.commit()
    return {"message": "Working schedule updated successfully."}


# 3. Customer checks available slots for a given service & target date (Prevents double booking)
@router.get("/slots")
def get_available_slots(
    service_id: int = Query(...),
    target_date: date = Query(...),
    db: Session = Depends(get_db),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service listing not found.")

    provider_id = service.provider_id

    # Get weekday: Monday=0, Sunday=6
    weekday = target_date.weekday()

    schedule = db.execute(
        select(ProviderSchedule).where(
            and_(
                ProviderSchedule.provider_id == provider_id,
                ProviderSchedule.day_of_week == weekday,
            )
        )
    ).scalar_one_or_none()

    # If provider hasn't set custom hours, default: Mon-Sat 09:00-17:00, Sun off
    if not schedule:
        if weekday == 6:  # Sunday off by default
            return {"date": target_date.isoformat(), "is_available": False, "slots": []}
        start_t = time(9, 0)
        end_t = time(17, 0)
        slot_mins = 60
        is_active = True
    else:
        if not schedule.is_active:
            return {"date": target_date.isoformat(), "is_available": False, "slots": []}
        start_t = schedule.start_time
        end_t = schedule.end_time
        slot_mins = schedule.slot_duration_minutes

    # Generate all candidate time slots for this day
    candidate_slots = []
    curr_dt = datetime.combine(target_date, start_t)
    end_dt = datetime.combine(target_date, end_t)

    while curr_dt + timedelta(minutes=slot_mins) <= end_dt:
        candidate_slots.append(curr_dt)
        curr_dt += timedelta(minutes=slot_mins)

    # Fetch existing active bookings for this provider on this day
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)

    existing_bookings = db.execute(
        select(Booking.booking_date).join(Service).where(
            and_(
                Service.provider_id == provider_id,
                Booking.status.in_(["pending", "confirmed"]),
                Booking.booking_date >= day_start,
                Booking.booking_date <= day_end,
            )
        )
    ).scalars().all()

    # Convert existing bookings to comparison format (YYYY-MM-DD HH:MM)
    booked_times = {b.strftime("%Y-%m-%d %H:%M") for b in existing_bookings if b}

    slot_results = []
    for s in candidate_slots:
        slot_str = s.strftime("%Y-%m-%d %H:%M")
        time_label = s.strftime("%I:%M %p")
        slot_results.append({
            "datetime": s.isoformat(),
            "time_label": time_label,
            "is_booked": slot_str in booked_times,
        })

    return {
        "date": target_date.isoformat(),
        "is_available": True,
        "slots": slot_results,
    }