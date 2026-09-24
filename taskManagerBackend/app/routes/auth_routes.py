import uuid
from flask import Blueprint, jsonify, request, g
from app.database import db
from app.models.profile import Profile
from app.services.auth_service import require_auth, get_or_create_profile

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.get('/me')
@require_auth
def get_current_user():
    return jsonify({
        'user': g.current_user.to_dict()
    })

@auth_bp.post('/sync')
@require_auth
def sync_profile():
    data = request.get_json() or {}
    full_name = data.get('full_name')
    avatar_url = data.get('avatar_url')

    if full_name:
        g.current_user.full_name = full_name
    if avatar_url:
        g.current_user.avatar_url = avatar_url

    db.session.commit()
    return jsonify({
        'message': 'Profile synchronized successfully',
        'user': g.current_user.to_dict()
    })

@auth_bp.get('/demo-users')
def get_demo_users():
    """
    Returns available demo users for quick review and testing.
    Seeds sample accounts into public.profiles if they don't already exist.
    """
    demo_accounts = [
        {"email": "alex.chen@example.com", "name": "Alex Chen", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"},
        {"email": "sarah.connor@example.com", "name": "Sarah Connor", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"},
        {"email": "david.kim@example.com", "name": "David Kim", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=David"},
    ]

    for acc in demo_accounts:
        existing = Profile.query.filter_by(email=acc['email']).first()
        if not existing:
            user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"demo-{acc['email']}")
            new_profile = Profile(
                id=user_uuid,
                email=acc['email'],
                full_name=acc['name'],
                avatar_url=acc['avatar']
            )
            db.session.add(new_profile)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    users = Profile.query.order_by(Profile.created_at.asc()).all()
    return jsonify({
        'users': [u.to_dict() for u in users]
    })
