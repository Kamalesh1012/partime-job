from fastapi import APIRouter, HTTPException, Depends, Header, Response, Request
from pydantic import BaseModel
from fastapi import status
import httpx
import os
from jose import jwt
from datetime import datetime, timedelta
from app.core.config import settings
import hashlib
import uuid

router = APIRouter()

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SupabaseLoginIn(BaseModel):
    access_token: str

# Helper: create JWT access token
def create_access_token(data: dict, expires_minutes: int = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=(expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Helper: cookie options based on environment
def cookie_options():
    frontend = settings.FRONTEND_URL or ''
    is_secure = frontend.startswith('https') or settings.ENVIRONMENT == 'production'
    samesite = 'none' if is_secure else 'lax'
    max_age = int(settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600)
    return {"httponly": True, "secure": is_secure, "samesite": samesite, "path": "/", "max_age": max_age}

# Helper: hash refresh token
def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

# Create and store refresh token in Supabase
async def create_refresh_token(user_id: str):
    token_plain = uuid.uuid4().hex
    token_hash = hash_token(token_plain)
    expires_at = (datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()

    rest_url = f"{settings.SUPABASE_URL}/rest/v1/refresh_tokens"
    service_key = settings.SUPABASE_KEY
    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {
        "user_id": user_id,
        "token_hash": token_hash,
        "revoked": False,
        "expires_at": expires_at
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(rest_url, headers=headers_admin, json=payload)
    if resp.status_code not in (201, 200):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create refresh token")
    created = resp.json()
    created_id = created[0].get('id') if isinstance(created, list) and created else created.get('id')
    return token_plain, created_id

# Verify refresh token from cookie and return record
async def get_refresh_record_by_token(token_plain: str):
    token_hash = hash_token(token_plain)
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/refresh_tokens"
    service_key = settings.SUPABASE_KEY
    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers_admin, params={"select":"*","token_hash":"eq."+token_hash})
    if resp.status_code not in (200, 206):
        return None
    items = resp.json()
    if not items:
        return None
    return items[0]

# Revoke refresh token by id
async def revoke_refresh_token(token_id: str, replaced_by: str = None):
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/refresh_tokens"
    service_key = settings.SUPABASE_KEY
    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    patch = {"revoked": True}
    if replaced_by:
        patch["replaced_by"] = replaced_by
    async with httpx.AsyncClient() as client:
        resp = await client.patch(rest_url, headers=headers_admin, params={"id":"eq."+token_id}, json=patch)
    return resp.status_code in (200, 204)

@router.post('/supabase-login', response_model=TokenOut)
async def supabase_login(payload: SupabaseLoginIn, response: Response):
    """
    Accepts a Supabase access token (from client-side Supabase auth). Verifies it with Supabase Auth user endpoint,
    upserts a user row in the `users` table (using the service role key), issues access JWT, creates refresh token and sets HttpOnly cookie.
    """
    if not payload.access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="access_token required")

    # Verify token with Supabase auth user endpoint
    supabase_user_url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": f"Bearer {payload.access_token}"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(supabase_user_url, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase access token")

    user_info = resp.json()
    email = user_info.get('email')
    full_name = user_info.get('user_metadata', {}).get('full_name') or user_info.get('user_metadata', {}).get('name')
    avatar_url = user_info.get('user_metadata', {}).get('avatar_url') if user_info.get('user_metadata') else None

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supabase user has no email")

    # Upsert into users table via Supabase REST API using service role key
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/users"
    service_key = settings.SUPABASE_KEY
    # Try to fetch existing user
    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    async with httpx.AsyncClient() as client:
        check_resp = await client.get(rest_url, headers=headers_admin, params={"select":"*","email":"eq."+email})
        users = check_resp.json() if check_resp.status_code in (200, 206) else []

        if users:
            user_row = users[0]
        else:
            # Default to 'student' user_type — employers can register separately
            payload_row = {
                "email": email,
                "full_name": full_name or "",
                "user_type": "student",
                "profile_picture": avatar_url
            }
            create_resp = await client.post(rest_url, headers=headers_admin, json=payload_row)
            if create_resp.status_code not in (201, 200):
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user record")
            created = create_resp.json()
            user_row = created[0] if isinstance(created, list) else created

    # Issue local JWT
    token_data = {"sub": str(user_row.get('id')), "email": email, "role": user_row.get('user_type')}
    access_token = create_access_token(token_data, expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create refresh token and set HttpOnly cookie
    refresh_plain, refresh_id = await create_refresh_token(str(user_row.get('id')))
    cookie_opts = cookie_options()
    # Set cookie (HttpOnly) - browser will store it
    response.set_cookie('refresh_token', refresh_plain, httponly=cookie_opts['httponly'], secure=cookie_opts['secure'], samesite=cookie_opts['samesite'], path=cookie_opts['path'], max_age=cookie_opts['max_age'])

    return {"access_token": access_token, "token_type": "bearer"}

@router.post('/refresh', response_model=TokenOut)
async def refresh(request: Request, response: Response):
    """
    Read refresh token from HttpOnly cookie, validate it, rotate it (create new one), revoke old token, and return new access token.
    """
    token_plain = request.cookies.get('refresh_token')
    if not token_plain:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token cookie")

    record = await get_refresh_record_by_token(token_plain)
    if not record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Check revoked and expiry
    if record.get('revoked'):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")
    expires_at = record.get('expires_at')
    if expires_at and datetime.fromisoformat(expires_at) < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user_id = record.get('user_id')

    # Rotate: create new refresh token and revoke the old one
    new_plain, new_id = await create_refresh_token(user_id)
    await revoke_refresh_token(record.get('id'), replaced_by=new_id)

    # Set new cookie
    cookie_opts = cookie_options()
    response.set_cookie('refresh_token', new_plain, httponly=cookie_opts['httponly'], secure=cookie_opts['secure'], samesite=cookie_opts['samesite'], path=cookie_opts['path'], max_age=cookie_opts['max_age'])

    # Issue new access token
    token_data = {"sub": str(user_id)}
    # Fetch user role & email for claims
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/users"
    service_key = settings.SUPABASE_KEY
    headers_admin = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers_admin, params={"select":"*","id":"eq."+str(user_id)})
    users = resp.json() if resp.status_code in (200,206) else []
    if users:
        user_row = users[0]
        token_data.update({"email": user_row.get('email'), "role": user_row.get('user_type')})

    access_token = create_access_token(token_data, expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post('/logout')
async def logout(request: Request, response: Response):
    """
    Revoke refresh token, clear cookie.
    """
    token_plain = request.cookies.get('refresh_token')
    if token_plain:
        record = await get_refresh_record_by_token(token_plain)
        if record:
            await revoke_refresh_token(record.get('id'))

    # Clear cookie
    response.delete_cookie('refresh_token', path='/')
    return {"message": "logged out"}

@router.get('/me')
async def me(authorization: str = Header(None)):
    """Return user info based on local JWT Authorization: Bearer <token>"""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise Exception("Invalid auth scheme")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token missing subject")

    # Fetch user row from Supabase REST
    rest_url = f"{settings.SUPABASE_URL}/rest/v1/users"
    service_key = settings.SUPABASE_KEY
    headers_admin = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(rest_url, headers=headers_admin, params={"select":"*","id":"eq."+user_id})

    if resp.status_code not in (200, 206):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    users = resp.json()
    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_row = users[0]
    return {"id": user_row.get('id'), "email": user_row.get('email'), "full_name": user_row.get('full_name'), "role": user_row.get('user_type'), "profile_picture": user_row.get('profile_picture')}
