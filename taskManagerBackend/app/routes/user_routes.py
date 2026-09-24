from flask import Blueprint, jsonify, g
from app.models.profile import Profile
from app.services.auth_service import require_auth

user_bp = Blueprint('user_bp', __name__)

@user_bp.get('')
@require_auth
def list_users():
    """
    List all registered profiles for assigning tasks.
    """
    profiles = Profile.query.order_by(Profile.full_name.asc(), Profile.email.asc()).all()
    return jsonify({
        'users': [p.to_dict() for p in profiles]
    })
