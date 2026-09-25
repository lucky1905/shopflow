"""JWT authentication endpoints (Phase 7).

Exposes:
    POST /auth/register  - create a user, return tokens
    POST /auth/login     - exchange credentials for tokens
    POST /auth/refresh   - rotate an access token
    GET  /auth/me        - current user profile
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer(auto_error=False)

# The demo credentials referenced by the frontend login screen.
DEMO_EMAIL = "admin@shopflow.ai"
DEMO_PASSWORD = "password"
DEMO_NAME = "Alex Rivera"


def _tokens_for(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.user_id),
        refresh_token=create_refresh_token(user.user_id),
        user=UserResponse.model_validate(user),
    )


def _get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency that resolves the bearer token to a user."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials, expected_type="access")
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists or is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if _get_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role if payload.role in {"admin", "manager", "cashier"} else "cashier",
        is_active=1,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _tokens_for(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = _get_user_by_email(db, email)

    # The demo account is seeded on first successful login so the shipped
    # frontend login screen keeps working against a fresh database.
    if user is None and email == DEMO_EMAIL and payload.password == DEMO_PASSWORD:
        user = User(
            email=DEMO_EMAIL,
            full_name=DEMO_NAME,
            hashed_password=hash_password(DEMO_PASSWORD),
            role="admin",
            is_active=1,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    return _tokens_for(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    claims = decode_token(payload.refresh_token, expected_type="refresh")
    if claims is None or "sub" not in claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user = db.query(User).filter(User.user_id == int(claims["sub"])).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return _tokens_for(user)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Resolves the bearer token when present, otherwise returns None.

    Used by endpoints that should work for anonymous callers but attribute
    the record to a user when a valid token is supplied.
    """
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials, expected_type="access")
    if payload is None or "sub" not in payload:
        return None
    user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
    if user is None or not user.is_active:
        return None
    return user
