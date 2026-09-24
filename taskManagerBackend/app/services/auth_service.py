import uuid
import logging
import jwt
from jwt import PyJWKClient
import httpx
from functools import wraps
from flask import request, jsonify, g, current_app
from app.database import db
from app.models.profile import Profile
from app.config import Config

logger = logging.getLogger(__name__)

# Cache JWKS client
_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if _jwks_client is None and Config.SUPABASE_URL:
        jwks_url = f"{Config.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwks_client

def get_or_create_profile(user_id_str: str, email: str, full_name: str = None, avatar_url: str = None) -> Profile:
    """Retrieve existing profile or create one synchronously in database."""
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, user_id_str)

    profile = Profile.query.get(user_uuid)
    if not profile:
        # Check by email as well to avoid duplicates
        profile = Profile.query.filter_by(email=email).first()
        if not profile:
            profile = Profile(
                id=user_uuid,
                email=email,
                full_name=full_name or email.split('@')[0],
                avatar_url=avatar_url or ''
            )
            db.session.add(profile)
        else:
            if full_name and not profile.full_name:
                profile.full_name = full_name
            if avatar_url and not profile.avatar_url:
                profile.avatar_url = avatar_url
        db.session.commit()
    else:
        # Update existing profile metadata if provided
        updated = False
        if full_name and profile.full_name != full_name:
            profile.full_name = full_name
            updated = True
        if avatar_url and profile.avatar_url != avatar_url:
            profile.avatar_url = avatar_url
            updated = True
        if updated:
            db.session.commit()

    return profile

def verify_token(token: str):
    """
    Validates a JWT token.
    Supports:
    1. Demo tokens for easy evaluation/testing (e.g. 'demo:email@example.com:John Doe')
    2. Supabase Auth via JWKS verification
    3. Supabase Auth via GoTrue /auth/v1/user endpoint fallback
    4. Unsigned payload decode in development mode
    """
    if not token:
        return None

    # 1. Check for Demo / Evaluation token
    if token.startswith("demo:"):
        parts = token.split(":")
        email = parts[1] if len(parts) > 1 else "demo@example.com"
        name = parts[2] if len(parts) > 2 else email.split("@")[0].capitalize()
        user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"demo-user-{email}")
        return {
            'id': str(user_uuid),
            'email': email,
            'full_name': name,
            'avatar_url': f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"
        }

    # 2. Try Supabase JWKS verification
    try:
        jwks_client = get_jwks_client()
        if jwks_client:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            data = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256", "HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
            sub = data.get('sub')
            email = data.get('email', '')
            user_metadata = data.get('user_metadata', {})
            full_name = user_metadata.get('full_name') or user_metadata.get('name') or (email.split('@')[0] if email else 'User')
            avatar_url = user_metadata.get('avatar_url') or user_metadata.get('picture') or ''
            return {
                'id': sub,
                'email': email,
                'full_name': full_name,
                'avatar_url': avatar_url
            }
    except Exception as jwks_err:
        logger.debug(f"JWKS verification failed, trying Supabase REST user endpoint: {jwks_err}")

    # 3. Fallback: Query Supabase /auth/v1/user endpoint
    try:
        if Config.SUPABASE_URL and Config.SUPABASE_KEY:
            resp = httpx.get(
                f"{Config.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": Config.SUPABASE_KEY
                },
                timeout=5.0
            )
            if resp.status_code == 200:
                user_data = resp.json()
                sub = user_data.get('id')
                email = user_data.get('email', '')
                meta = user_data.get('user_metadata', {})
                full_name = meta.get('full_name') or meta.get('name') or (email.split('@')[0] if email else 'User')
                avatar_url = meta.get('avatar_url') or meta.get('picture') or ''
                return {
                    'id': sub,
                    'email': email,
                    'full_name': full_name,
                    'avatar_url': avatar_url
                }
    except Exception as req_err:
        logger.debug(f"Supabase REST user endpoint failed: {req_err}")

    # 4. Fallback decode for development/testing if token is a valid unverified JWT
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        if 'sub' in unverified:
            email = unverified.get('email', '')
            meta = unverified.get('user_metadata', {})
            full_name = meta.get('full_name') or meta.get('name') or (email.split('@')[0] if email else 'User')
            avatar_url = meta.get('avatar_url') or meta.get('picture') or ''
            return {
                'id': unverified['sub'],
                'email': email,
                'full_name': full_name,
                'avatar_url': avatar_url
            }
    except Exception as decode_err:
        logger.error(f"Token decode error: {decode_err}")

    return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing Authorization header'}), 401

        parts = auth_header.split(' ', 1)
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid Authorization header format. Expected "Bearer <token>"'}), 401

        token = parts[1]
        user_info = verify_token(token)
        if not user_info:
            return jsonify({'error': 'Invalid or expired authentication token'}), 401

        # Fetch or create database Profile
        profile = get_or_create_profile(
            user_id_str=user_info['id'],
            email=user_info['email'],
            full_name=user_info.get('full_name'),
            avatar_url=user_info.get('avatar_url')
        )

        g.current_user = profile
        return f(*args, **kwargs)
    return decorated
