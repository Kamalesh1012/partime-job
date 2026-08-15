"""
WorkMate Chennai - Authentication API
Supabase authentication + local JWT + refresh-token handling
"""

from datetime import datetime, timedelta
import hashlib
import os
import uuid

import httpx
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Header,
    Response,
    Request,
    status,
)
from pydantic import BaseModel
from jose import jwt

# IMPORTANT:
# Use the full backend package path so Vercel can import this correctly.
from backend.app.core.config import settings


router = APIRouter()


# ============================================================
# Configuration helpers
# ============================================================

def get_supabase_url() -> str:
    """
    Get Supabase project URL.

    Prefer settings.SUPABASE_URL, with environment variable
    fallback for production deployments.
    """
    value = getattr(settings, "SUPABASE_URL", None) or os.getenv("SUPABASE_URL")

    if not value:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL is not configured",
        )

    return value.rstrip("/")


def get_supabase_service_role_key() -> str:
    """
    Get the Supabase service-role/secret key.

    SUPABASE_SERVICE_ROLE_KEY is preferred.
    SUPABASE_KEY is retained as a backwards-compatible fallback.
    """

    value = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
        or os.getenv("SUPABASE_KEY")
        or getattr(settings, "SUPABASE_KEY", None)
    )

    if not value:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase service role key is not configured",
        )

    return value


# ============================================================
# Response / Request models
# ============================================================

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SupabaseLoginIn(BaseModel):
    access_token: str


# ============================================================
# JWT helper
# ============================================================

def create_access_token(
    data: dict,
    expires_minutes: int = None,
):
    """
    Create local application JWT access token.
    """

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=(
            expires_minutes
            or settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return encoded_jwt


# ============================================================
# Cookie helper
# ============================================================

def cookie_options():
    """
    Return refresh-token cookie options based on environment.
    """

    frontend = getattr(
        settings,
        "FRONTEND_URL",
        "",
    ) or ""

    environment = getattr(
        settings,
        "ENVIRONMENT",
        "",
    ) or ""

    is_secure = (
        frontend.startswith("https")
        or environment.lower() == "production"
    )

    samesite = "none" if is_secure else "lax"

    refresh_days = getattr(
        settings,
        "REFRESH_TOKEN_EXPIRE_DAYS",
        30,
    )

    max_age = int(refresh_days * 24 * 3600)

    return {
        "httponly": True,
        "secure": is_secure,
        "samesite": samesite,
        "path": "/",
        "max_age": max_age,
    }


# ============================================================
# Refresh token helpers
# ============================================================

def hash_token(token: str) -> str:
    """
    Hash refresh token before storing it in Supabase.
    """

    return hashlib.sha256(
        token.encode()
    ).hexdigest()


async def create_refresh_token(user_id: str):
    """
    Create and store refresh token in Supabase.
    """

    token_plain = uuid.uuid4().hex

    token_hash = hash_token(token_plain)

    refresh_days = getattr(
        settings,
        "REFRESH_TOKEN_EXPIRE_DAYS",
        30,
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(days=refresh_days)
    ).isoformat()

    supabase_url = get_supabase_url()
    service_key = get_supabase_service_role_key()

    rest_url = (
        f"{supabase_url}/rest/v1/refresh_tokens"
    )

    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    payload = {
        "user_id": user_id,
        "token_hash": token_hash,
        "revoked": False,
        "expires_at": expires_at,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            rest_url,
            headers=headers_admin,
            json=payload,
        )

    if resp.status_code not in (201, 200):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create refresh token",
        )

    created = resp.json()

    if isinstance(created, list):
        created_id = (
            created[0].get("id")
            if created
            else None
        )
    else:
        created_id = created.get("id")

    return token_plain, created_id


async def get_refresh_record_by_token(
    token_plain: str,
):
    """
    Verify refresh token from cookie
    and return the database record.
    """

    token_hash = hash_token(token_plain)

    supabase_url = get_supabase_url()
    service_key = get_supabase_service_role_key()

    rest_url = (
        f"{supabase_url}/rest/v1/refresh_tokens"
    )

    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            rest_url,
            headers=headers_admin,
            params={
                "select": "*",
                "token_hash": f"eq.{token_hash}",
            },
        )

    if resp.status_code not in (200, 206):
        return None

    items = resp.json()

    if not items:
        return None

    return items[0]


async def revoke_refresh_token(
    token_id: str,
    replaced_by: str = None,
):
    """
    Revoke refresh token by ID.
    """

    supabase_url = get_supabase_url()
    service_key = get_supabase_service_role_key()

    rest_url = (
        f"{supabase_url}/rest/v1/refresh_tokens"
    )

    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    patch = {
        "revoked": True,
    }

    if replaced_by:
        patch["replaced_by"] = replaced_by

    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            rest_url,
            headers=headers_admin,
            params={
                "id": f"eq.{token_id}",
            },
            json=patch,
        )

    return resp.status_code in (200, 204)


# ============================================================
# Supabase Login
# ============================================================

@router.post(
    "/supabase-login",
    response_model=TokenOut,
)
async def supabase_login(
    payload: SupabaseLoginIn,
    response: Response,
):
    """
    Accept a Supabase access token.

    1. Verify the Supabase access token.
    2. Read user information from Supabase Auth.
    3. Create/update user record in users table.
    4. Create local JWT access token.
    5. Create refresh token.
    6. Set refresh token in HttpOnly cookie.
    """

    if not payload.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="access_token required",
        )

    supabase_url = get_supabase_url()

    # --------------------------------------------------------
    # Verify Supabase access token
    # --------------------------------------------------------

    supabase_user_url = (
        f"{supabase_url}/auth/v1/user"
    )

    headers = {
        "Authorization": (
            f"Bearer {payload.access_token}"
        )
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            supabase_user_url,
            headers=headers,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase access token",
        )

    user_info = resp.json()

    email = user_info.get("email")

    metadata = user_info.get(
        "user_metadata",
        {},
    ) or {}

    full_name = (
        metadata.get("full_name")
        or metadata.get("name")
        or ""
    )

    avatar_url = metadata.get(
        "avatar_url"
    )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supabase user has no email",
        )

    # --------------------------------------------------------
    # Upsert / find user in users table
    # --------------------------------------------------------

    rest_url = (
        f"{supabase_url}/rest/v1/users"
    )

    service_key = (
        get_supabase_service_role_key()
    )

    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient() as client:

        check_resp = await client.get(
            rest_url,
            headers=headers_admin,
            params={
                "select": "*",
                "email": f"eq.{email}",
            },
        )

        users = (
            check_resp.json()
            if check_resp.status_code in (200, 206)
            else []
        )

        if users:
            user_row = users[0]

        else:
            # Default user type.
            # Employers can be handled separately.
            payload_row = {
                "email": email,
                "full_name": full_name,
                "user_type": "student",
                "profile_picture": avatar_url,
            }

            create_resp = await client.post(
                rest_url,
                headers=headers_admin,
                json=payload_row,
            )

            if create_resp.status_code not in (
                201,
                200,
            ):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user record",
                )

            created = create_resp.json()

            user_row = (
                created[0]
                if isinstance(created, list)
                else created
            )

    # --------------------------------------------------------
    # Create local access JWT
    # --------------------------------------------------------

    token_data = {
        "sub": str(user_row.get("id")),
        "email": email,
        "role": user_row.get("user_type"),
    }

    access_token = create_access_token(
        token_data,
        expires_minutes=(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    # --------------------------------------------------------
    # Create refresh token
    # --------------------------------------------------------

    refresh_plain, refresh_id = (
        await create_refresh_token(
            str(user_row.get("id"))
        )
    )

    cookie_opts = cookie_options()

    response.set_cookie(
        "refresh_token",
        refresh_plain,
        httponly=cookie_opts["httponly"],
        secure=cookie_opts["secure"],
        samesite=cookie_opts["samesite"],
        path=cookie_opts["path"],
        max_age=cookie_opts["max_age"],
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# Refresh token
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenOut,
)
async def refresh(
    request: Request,
    response: Response,
):
    """
    Read refresh token from HttpOnly cookie,
    validate it, rotate it, revoke the old token,
    and return a new access token.
    """

    token_plain = request.cookies.get(
        "refresh_token"
    )

    if not token_plain:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token cookie",
        )

    record = await get_refresh_record_by_token(
        token_plain
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # --------------------------------------------------------
    # Check revoked status
    # --------------------------------------------------------

    if record.get("revoked"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked",
        )

    # --------------------------------------------------------
    # Check expiry
    # --------------------------------------------------------

    expires_at = record.get("expires_at")

    if expires_at:
        try:
            expires_datetime = datetime.fromisoformat(
                expires_at.replace("Z", "+00:00")
            )

            # Handle timezone-aware datetime safely
            now = datetime.now(
                expires_datetime.tzinfo
            )

            if expires_datetime < now:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token expired",
                )

        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token expiry",
            )

    user_id = record.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has no user",
        )

    # --------------------------------------------------------
    # Rotate refresh token
    # --------------------------------------------------------

    new_plain, new_id = (
        await create_refresh_token(
            str(user_id)
        )
    )

    await revoke_refresh_token(
        record.get("id"),
        replaced_by=new_id,
    )

    # --------------------------------------------------------
    # Set new refresh cookie
    # --------------------------------------------------------

    cookie_opts = cookie_options()

    response.set_cookie(
        "refresh_token",
        new_plain,
        httponly=cookie_opts["httponly"],
        secure=cookie_opts["secure"],
        samesite=cookie_opts["samesite"],
        path=cookie_opts["path"],
        max_age=cookie_opts["max_age"],
    )

    # --------------------------------------------------------
    # Fetch user information
    # --------------------------------------------------------

    supabase_url = get_supabase_url()
    service_key = get_supabase_service_role_key()

    rest_url = (
        f"{supabase_url}/rest/v1/users"
    )

    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            rest_url,
            headers=headers_admin,
            params={
                "select": "*",
                "id": f"eq.{user_id}",
            },
        )

    users = (
        resp.json()
        if resp.status_code in (200, 206)
        else []
    )

    token_data = {
        "sub": str(user_id),
    }

    if users:
        user_row = users[0]

        token_data.update(
            {
                "email": user_row.get("email"),
                "role": user_row.get("user_type"),
            }
        )

    access_token = create_access_token(
        token_data,
        expires_minutes=(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# Logout
# ============================================================

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
):
    """
    Revoke refresh token and clear cookie.
    """

    token_plain = request.cookies.get(
        "refresh_token"
    )

    if token_plain:
        record = await get_refresh_record_by_token(
            token_plain
        )

        if record:
            await revoke_refresh_token(
                record.get("id")
            )

    response.delete_cookie(
        "refresh_token",
        path="/",
    )

    return {
        "message": "logged out"
    }


# ============================================================
# Current user
# ============================================================

@router.get("/me")
async def me(
    authorization: str = Header(None),
):
    """
    Return user information based on:

    Authorization: Bearer <token>
    """

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    # --------------------------------------------------------
    # Parse Authorization header
    # --------------------------------------------------------

    try:
        scheme, token = authorization.split()

        if scheme.lower() != "bearer":
            raise Exception(
                "Invalid auth scheme"
            )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header",
        )

    # --------------------------------------------------------
    # Decode local JWT
    # --------------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[
                settings.ALGORITHM
            ],
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token missing subject",
        )

    # --------------------------------------------------------
    # Fetch user from Supabase
    # --------------------------------------------------------

    supabase_url = get_supabase_url()
    service_key = get_supabase_service_role_key()

    rest_url = (
        f"{supabase_url}/rest/v1/users"
    )

    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            rest_url,
            headers=headers_admin,
            params={
                "select": "*",
                "id": f"eq.{user_id}",
            },
        )

    if resp.status_code not in (200, 206):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    users = resp.json()

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user_row = users[0]

    return {
        "id": user_row.get("id"),
        "email": user_row.get("email"),
        "full_name": user_row.get("full_name"),
        "role": user_row.get("user_type"),
        "profile_picture": user_row.get(
            "profile_picture"
        ),
    }