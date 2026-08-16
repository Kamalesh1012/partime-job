"""
WorkMate Chennai - Authentication API

Authentication flow:
    Frontend
        ↓
    FastAPI
        ↓
    Supabase Auth
        ↓
    Supabase REST API (users / refresh_tokens)
        ↓
    Local application JWT
        ↓
    HttpOnly refresh-token cookie
"""

from datetime import datetime, timedelta
import hashlib
import os
import uuid

import httpx
from fastapi import (
    APIRouter,
    HTTPException,
    Header,
    Response,
    Request,
    status,
)
from pydantic import BaseModel, EmailStr
from jose import jwt

from app.core.config import settings


router = APIRouter()


# ============================================================
# CONFIGURATION
# ============================================================

def get_supabase_url() -> str:
    """Return configured Supabase project URL."""

    value = (
        getattr(settings, "SUPABASE_URL", None)
        or os.getenv("SUPABASE_URL")
    )

    if not value:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL is not configured",
        )

    return value.rstrip("/")


def get_supabase_anon_key() -> str:
    """
    Return Supabase anon/publishable key.

    This key is used for Supabase Auth signup/login.
    """

    value = (
        os.getenv("SUPABASE_ANON_KEY")
        or getattr(settings, "SUPABASE_ANON_KEY", None)
        or os.getenv("SUPABASE_KEY")
        or getattr(settings, "SUPABASE_KEY", None)
    )

    if not value:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_ANON_KEY is not configured",
        )

    return value


def get_supabase_service_role_key() -> str:
    """
    Return Supabase service-role/secret key.

    IMPORTANT:
    This key must NEVER be exposed to the frontend.
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
            detail="SUPABASE_SERVICE_ROLE_KEY is not configured",
        )

    return value


# ============================================================
# MODELS
# ============================================================

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SupabaseLoginIn(BaseModel):
    access_token: str


class EmailLoginIn(BaseModel):
    email: EmailStr
    password: str
    role: str = "student"


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    role: str = "student"
    full_name: str = ""


# ============================================================
# HTTP HELPERS
# ============================================================

def supabase_auth_headers() -> dict:
    """Headers for Supabase Auth API."""

    return {
        "apikey": get_supabase_anon_key(),
        "Content-Type": "application/json",
    }


def supabase_admin_headers() -> dict:
    """
    Headers for Supabase REST API using service-role key.
    """

    service_key = get_supabase_service_role_key()

    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def extract_supabase_error(response: httpx.Response) -> str:
    """
    Extract a useful error message from Supabase response.
    """

    try:
        data = response.json()
    except Exception:
        data = {}

    if isinstance(data, dict):
        return (
            data.get("error_description")
            or data.get("msg")
            or data.get("message")
            or data.get("error")
            or f"Supabase returned HTTP {response.status_code}"
        )

    return f"Supabase returned HTTP {response.status_code}"


# ============================================================
# JWT
# ============================================================

def create_access_token(
    data: dict,
    expires_minutes: int | None = None,
) -> str:
    """Create local application JWT."""

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=(
            expires_minutes
            or settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode["exp"] = expire

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


# ============================================================
# COOKIE
# ============================================================

def cookie_options() -> dict:
    """Return refresh-token cookie settings."""

    frontend = (
        getattr(settings, "FRONTEND_URL", "")
        or ""
    )

    environment = (
        getattr(settings, "ENVIRONMENT", "")
        or ""
    )

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

    return {
        "httponly": True,
        "secure": is_secure,
        "samesite": samesite,
        "path": "/",
        "max_age": int(refresh_days * 24 * 3600),
    }


def set_refresh_cookie(
    response: Response,
    token: str,
) -> None:
    """Set refresh token as HttpOnly cookie."""

    options = cookie_options()

    response.set_cookie(
        "refresh_token",
        token,
        httponly=options["httponly"],
        secure=options["secure"],
        samesite=options["samesite"],
        path=options["path"],
        max_age=options["max_age"],
    )


# ============================================================
# REFRESH TOKEN HELPERS
# ============================================================

def hash_token(token: str) -> str:
    """Hash refresh token before database storage."""

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


async def create_refresh_token(
    user_id: str,
):
    """Create and store refresh token."""

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

    rest_url = (
        f"{supabase_url}/rest/v1/refresh_tokens"
    )

    payload = {
        "user_id": user_id,
        "token_hash": token_hash,
        "revoked": False,
        "expires_at": expires_at,
    }

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.post(
            rest_url,
            headers=supabase_admin_headers(),
            json=payload,
        )

    if response.status_code not in (200, 201):
        error = extract_supabase_error(response)

        print(
            "REFRESH TOKEN CREATE ERROR:",
            response.status_code,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create refresh token",
        )

    try:
        data = response.json()
    except Exception:
        data = []

    if isinstance(data, list):
        created_id = (
            data[0].get("id")
            if data
            else None
        )
    else:
        created_id = data.get("id")

    return token_plain, created_id


async def get_refresh_record_by_token(
    token_plain: str,
):
    """Find refresh token record."""

    token_hash = hash_token(token_plain)

    supabase_url = get_supabase_url()

    rest_url = (
        f"{supabase_url}/rest/v1/refresh_tokens"
    )

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.get(
            rest_url,
            headers=supabase_admin_headers(),
            params={
                "select": "*",
                "token_hash": f"eq.{token_hash}",
            },
        )

    if response.status_code not in (200, 206):
        return None

    try:
        records = response.json()
    except Exception:
        return None

    if not records:
        return None

    return records[0]


async def revoke_refresh_token(
    token_id: str,
    replaced_by: str | None = None,
) -> bool:
    """Revoke refresh token."""

    supabase_url = get_supabase_url()

    rest_url = (
        f"{supabase_url}/rest/v1/refresh_tokens"
    )

    patch = {
        "revoked": True,
    }

    if replaced_by:
        patch["replaced_by"] = replaced_by

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.patch(
            rest_url,
            headers=supabase_admin_headers(),
            params={
                "id": f"eq.{token_id}",
            },
            json=patch,
        )

    return response.status_code in (200, 204)


# ============================================================
# USERS TABLE HELPERS
# ============================================================

async def find_user_by_email(
    email: str,
):
    """Find local user by email."""

    supabase_url = get_supabase_url()

    rest_url = (
        f"{supabase_url}/rest/v1/users"
    )

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.get(
            rest_url,
            headers=supabase_admin_headers(),
            params={
                "select": "*",
                "email": f"eq.{email}",
            },
        )

    if response.status_code not in (200, 206):
        error = extract_supabase_error(response)

        print(
            "FIND USER ERROR:",
            response.status_code,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to access users table",
        )

    try:
        users = response.json()
    except Exception:
        users = []

    return users[0] if users else None


async def find_user_by_id(
    user_id: str,
):
    """Find local user by ID."""

    supabase_url = get_supabase_url()

    rest_url = (
        f"{supabase_url}/rest/v1/users"
    )

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.get(
            rest_url,
            headers=supabase_admin_headers(),
            params={
                "select": "*",
                "id": f"eq.{user_id}",
            },
        )

    if response.status_code not in (200, 206):
        return None

    try:
        users = response.json()
    except Exception:
        return None

    return users[0] if users else None


async def create_local_user(
    email: str,
    full_name: str,
    role: str,
):
    """Create user in custom users table."""

    supabase_url = get_supabase_url()

    rest_url = (
        f"{supabase_url}/rest/v1/users"
    )

    row = {
        "email": email,
        "full_name": full_name or "",
        "user_type": role,
    }

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        response = await client.post(
            rest_url,
            headers=supabase_admin_headers(),
            json=row,
        )

    if response.status_code not in (200, 201):
        error = extract_supabase_error(response)

        print(
            "CREATE USER ERROR:",
            response.status_code,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user record: {error}",
        )

    try:
        created = response.json()
    except Exception:
        created = None

    if isinstance(created, list):
        return created[0] if created else row

    return created or row


# ============================================================
# SUPABASE LOGIN
# ============================================================

@router.post(
    "/supabase-login",
    response_model=TokenOut,
)
async def supabase_login(
    payload: SupabaseLoginIn,
    response: Response,
):
    """Login using an existing Supabase access token."""

    if not payload.access_token:
        raise HTTPException(
            status_code=400,
            detail="access_token required",
        )

    supabase_url = get_supabase_url()

    user_url = (
        f"{supabase_url}/auth/v1/user"
    )

    headers = {
        "apikey": get_supabase_anon_key(),
        "Authorization": (
            f"Bearer {payload.access_token}"
        ),
    }

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        user_response = await client.get(
            user_url,
            headers=headers,
        )

    if user_response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid Supabase access token",
        )

    user_info = user_response.json()

    email = user_info.get("email")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Supabase user has no email",
        )

    metadata = (
        user_info.get("user_metadata")
        or {}
    )

    full_name = (
        metadata.get("full_name")
        or metadata.get("name")
        or ""
    )

    avatar_url = metadata.get(
        "avatar_url"
    )

    user_row = await find_user_by_email(email)

    if not user_row:

        supabase_url = get_supabase_url()

        rest_url = (
            f"{supabase_url}/rest/v1/users"
        )

        row = {
            "email": email,
            "full_name": full_name,
            "user_type": "student",
            "profile_picture": avatar_url,
        }

        async with httpx.AsyncClient(
            timeout=20.0
        ) as client:

            create_response = await client.post(
                rest_url,
                headers=supabase_admin_headers(),
                json=row,
            )

        if create_response.status_code not in (
            200,
            201,
        ):
            error = extract_supabase_error(
                create_response
            )

            raise HTTPException(
                status_code=500,
                detail=f"Failed to create user record: {error}",
            )

        created = create_response.json()

        user_row = (
            created[0]
            if isinstance(created, list)
            else created
        )

    token_data = {
        "sub": str(user_row.get("id")),
        "email": email,
        "role": user_row.get(
            "user_type",
            "student",
        ),
    }

    access_token = create_access_token(
        token_data
    )

    try:
        refresh_plain, _ = (
            await create_refresh_token(
                str(user_row.get("id"))
            )
        )

        set_refresh_cookie(
            response,
            refresh_plain,
        )

    except Exception as error:
        print(
            "REFRESH TOKEN ERROR:",
            repr(error),
        )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# EMAIL/PASSWORD LOGIN
# ============================================================

@router.post("/login")
async def email_login(
    payload: EmailLoginIn,
    response: Response,
):
    """Login using Supabase email/password authentication."""

    supabase_url = get_supabase_url()

    auth_url = (
        f"{supabase_url}/auth/v1/token"
        "?grant_type=password"
    )

    auth_payload = {
        "email": str(payload.email).strip(),
        "password": payload.password,
    }

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:

        auth_response = await client.post(
            auth_url,
            headers=supabase_auth_headers(),
            json=auth_payload,
        )

    if auth_response.status_code != 200:
        error = extract_supabase_error(
            auth_response
        )

        raise HTTPException(
            status_code=401,
            detail=error,
        )

    data = auth_response.json()

    sb_user = data.get("user") or {}

    email = (
        sb_user.get("email")
        or str(payload.email).strip()
    )

    user_row = await find_user_by_email(email)

    if not user_row:

        metadata = (
            sb_user.get("user_metadata")
            or {}
        )

        full_name = (
            metadata.get("full_name")
            or metadata.get("name")
            or ""
        )

        user_row = await create_local_user(
            email=email,
            full_name=full_name,
            role=payload.role,
        )

    token_data = {
        "sub": str(user_row.get("id")),
        "email": email,
        "role": user_row.get(
            "user_type",
            payload.role,
        ),
    }

    local_token = create_access_token(
        token_data
    )

    try:
        refresh_plain, _ = (
            await create_refresh_token(
                str(user_row.get("id"))
            )
        )

        set_refresh_cookie(
            response,
            refresh_plain,
        )

    except Exception as error:
        print(
            "REFRESH TOKEN ERROR:",
            repr(error),
        )

    return {
        "access_token": local_token,
        "token_type": "bearer",
        "role": user_row.get(
            "user_type",
            payload.role,
        ),
        "email": email,
    }


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
async def register_user(
    payload: RegisterIn,
    response: Response,
):
    """
    Register a new user.

    Flow:
        1. Validate request.
        2. Create account in Supabase Auth (via Admin API to bypass email limit).
        3. Create local users table record.
        4. Create local JWT.
        5. Create refresh token if possible.
    """

    email = str(payload.email).strip().lower()

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters",
        )

    if payload.role not in (
        "student",
        "employer",
        "admin",
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    try:

        # ----------------------------------------------------
        # 1. Supabase Admin signup (bypasses rate limit)
        # ----------------------------------------------------

        supabase_url = get_supabase_url()

        signup_url = (
            f"{supabase_url}/auth/v1/admin/users"
        )

        signup_payload = {
            "email": email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "role": payload.role,
                "user_type": payload.role,
                "full_name": payload.full_name or "",
            },
        }

        async with httpx.AsyncClient(
            timeout=20.0
        ) as client:

            signup_response = await client.post(
                signup_url,
                headers=supabase_admin_headers(),
                json=signup_payload,
            )

        # ----------------------------------------------------
        # 2. Handle Supabase signup failure
        # ----------------------------------------------------

        if signup_response.status_code not in (
            200,
            201,
        ):
            # If user already exists, it usually returns 422
            error = extract_supabase_error(
                signup_response
            )

            print(
                "SUPABASE SIGNUP ERROR:",
                signup_response.status_code,
                error,
            )

            raise HTTPException(
                status_code=400,
                detail=error,
            )

        # ----------------------------------------------------
        # 3. Parse Supabase response
        # ----------------------------------------------------

        try:
            signup_data = signup_response.json()
        except Exception:
            signup_data = {}

        sb_user = signup_data
        registered_email = sb_user.get("email") or email

        # ----------------------------------------------------
        # 4. Check/create local users table record
        # ----------------------------------------------------

        user_row = await find_user_by_email(
            registered_email
        )

        if not user_row:

            user_row = await create_local_user(
                email=registered_email,
                full_name=payload.full_name,
                role=payload.role,
            )

        # ----------------------------------------------------
        # 5. Make sure user ID exists
        # ----------------------------------------------------

        user_id = user_row.get("id")

        if not user_id:

            raise HTTPException(
                status_code=500,
                detail="User was created but no local user ID was returned",
            )

        # ----------------------------------------------------
        # 6. Create local JWT
        # ----------------------------------------------------

        token_data = {
            "sub": str(user_id),
            "email": registered_email,
            "role": user_row.get(
                "user_type",
                payload.role,
            ),
        }

        local_token = create_access_token(
            token_data
        )

        # ----------------------------------------------------
        # 7. Create refresh token
        # ----------------------------------------------------

        refresh_created = False

        try:

            refresh_plain, _ = (
                await create_refresh_token(
                    str(user_id)
                )
            )

            set_refresh_cookie(
                response,
                refresh_plain,
            )

            refresh_created = True

        except Exception as error:

            print(
                "REFRESH TOKEN ERROR:",
                repr(error),
            )

        # ----------------------------------------------------
        # 8. Success
        # ----------------------------------------------------

        return {
            "access_token": local_token,
            "token_type": "bearer",
            "role": user_row.get(
                "user_type",
                payload.role,
            ),
            "email": registered_email,
            "needs_email_confirmation": False,
            "refresh_token_created": refresh_created,
            "message": "Registration successful!",
        }

    # --------------------------------------------------------
    # IMPORTANT:
    # Do NOT catch/re-wrap HTTPException.
    # --------------------------------------------------------

    except HTTPException:
        raise

    except httpx.TimeoutException as error:

        print(
            "REGISTRATION TIMEOUT:",
            repr(error),
        )

        raise HTTPException(
            status_code=504,
            detail="Supabase request timed out",
        )

    except httpx.RequestError as error:

        print(
            "REGISTRATION NETWORK ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to connect to Supabase",
        )

    except Exception as error:

        import traceback

        print(
            "========== REGISTRATION ERROR =========="
        )

        print(
            "ERROR:",
            repr(error),
        )

        traceback.print_exc()

        print(
            "========================================"
        )

        raise HTTPException(
            status_code=500,
            detail="Registration failed due to a server error",
        )


# ============================================================
# REFRESH
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenOut,
)
async def refresh(
    request: Request,
    response: Response,
):
    """Rotate refresh token and issue new access token."""

    token_plain = request.cookies.get(
        "refresh_token"
    )

    if not token_plain:
        raise HTTPException(
            status_code=401,
            detail="Missing refresh token cookie",
        )

    record = await get_refresh_record_by_token(
        token_plain
    )

    if not record:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )

    if record.get("revoked"):
        raise HTTPException(
            status_code=401,
            detail="Refresh token revoked",
        )

    expires_at = record.get(
        "expires_at"
    )

    if expires_at:

        try:

            expires_datetime = (
                datetime.fromisoformat(
                    expires_at.replace(
                        "Z",
                        "+00:00",
                    )
                )
            )

            if expires_datetime.tzinfo:

                now = datetime.now(
                    expires_datetime.tzinfo
                )

            else:

                now = datetime.utcnow()

            if expires_datetime < now:

                raise HTTPException(
                    status_code=401,
                    detail="Refresh token expired",
                )

        except ValueError:

            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token expiry",
            )

    user_id = record.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Refresh token has no user",
        )

    # Create new refresh token
    new_plain, new_id = (
        await create_refresh_token(
            str(user_id)
        )
    )

    # Revoke old refresh token
    await revoke_refresh_token(
        record.get("id"),
        replaced_by=new_id,
    )

    # Set new cookie
    set_refresh_cookie(
        response,
        new_plain,
    )

    # Fetch local user
    user_row = await find_user_by_id(
        str(user_id)
    )

    if not user_row:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    token_data = {
        "sub": str(user_id),
        "email": user_row.get("email"),
        "role": user_row.get("user_type"),
    }

    access_token = create_access_token(
        token_data
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
):
    """Revoke refresh token and clear cookie."""

    token_plain = request.cookies.get(
        "refresh_token"
    )

    if token_plain:

        record = (
            await get_refresh_record_by_token(
                token_plain
            )
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
# CURRENT USER
# ============================================================

@router.get("/me")
async def me(
    authorization: str = Header(None),
):
    """Return current user from local JWT."""

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing",
        )

    try:

        parts = authorization.split()

        if len(parts) != 2:
            raise ValueError()

        scheme, token = parts

        if scheme.lower() != "bearer":
            raise ValueError()

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header",
        )

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
            status_code=401,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Token missing subject",
        )

    user_row = await find_user_by_id(
        str(user_id)
    )

    if not user_row:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "id": user_row.get("id"),
        "email": user_row.get("email"),
        "full_name": user_row.get("full_name"),
        "role": user_row.get("user_type"),
        "profile_picture": user_row.get(
            "profile_picture"
        ),
    }