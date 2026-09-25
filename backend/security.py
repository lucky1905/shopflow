"""Password hashing and JWT helpers for the Phase 7 auth layer.

Uses `bcrypt` for password hashing and `python-jose` for HS256 JWTs. Both
are already present in the project virtualenv.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
from decouple import config
from jose import JWTError, jwt

# HS256 secret + lifetime. Override SECRET_KEY in any real deployment.
SECRET_KEY = config("SECRET_KEY", default="shopflow-dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(config("ACCESS_TOKEN_EXPIRE_MINUTES", default=60 * 8))
REFRESH_TOKEN_EXPIRE_DAYS = int(config("REFRESH_TOKEN_EXPIRE_DAYS", default=7))

# passlib 1.7.4 is incompatible with crypt 5.x (it probes bcrypt with an
# over-length secret and raises). The crypt library is used directly instead.
BCRYPT_MAX_BYTES = 72


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(plain_password.encode("utf-8")[:BCRYPT_MAX_BYTES], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time comparison of a plaintext password against its hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:BCRYPT_MAX_BYTES], hashed_password.encode("utf-8"))
    except ValueError:
        # Malformed hash in the database should not crash the request.
        return False


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(subject: str | int, expires_minutes: Optional[int] = None) -> str:
    minutes = expires_minutes if expires_minutes is not None else ACCESS_TOKEN_EXPIRE_MINUTES
    return _create_token(str(subject), timedelta(minutes=minutes), "access")


def create_refresh_token(subject: str | int, expires_days: Optional[int] = None) -> str:
    days = expires_days if expires_days is not None else REFRESH_TOKEN_EXPIRE_DAYS
    return _create_token(str(subject), timedelta(days=days), "refresh")


def decode_token(token: str, expected_type: str = "access") -> Optional[dict[str, Any]]:
    """Decode a JWT, returning None when invalid, expired or the wrong type."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload


