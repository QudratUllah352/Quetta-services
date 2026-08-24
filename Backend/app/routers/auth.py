from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User, UserRole, VerificationStatus
from app.schemas.user import UserCreate, UserRead, UserLogin, Token
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user

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
            "verification_status": user.verification_status.value
            if hasattr(user.verification_status, "value")
            else str(user.verification_status),
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