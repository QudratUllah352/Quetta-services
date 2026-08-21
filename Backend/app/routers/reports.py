from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.service import Service
from app.models.review import Review
from app.models.report import Report, ReportTargetType
from app.schemas.report import ReportCreate, ReportRead
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Confirm the target actually exists before accepting the report -
    # a report pointing at a made-up id isn't useful to an admin.
    if payload.target_type == ReportTargetType.service:
        target = db.get(Service, payload.target_id)
    else:
        target = db.get(Review, payload.target_id)

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {payload.target_type.value} found with that id.",
        )

    report = Report(
        reporter_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report